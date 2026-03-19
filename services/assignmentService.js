import pool from "../config.js";

const EARTH_RADIUS_KM = 6371;

/**
 * Haversine formula to calculate distance between two lat/lng points in km
 */
export function haversineDistance(lat1, lon1, lat2, lon2) {
  const toRad = (deg) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return EARTH_RADIUS_KM * c;
}

/**
 * Estimate delivery time in minutes based on distance (avg 20km/h in city)
 */
export function estimateDeliveryTime(distanceKm) {
  const avgSpeedKmH = 20;
  return Math.ceil((distanceKm / avgSpeedKmH) * 60);
}

/**
 * Get online riders sorted by proximity to a target location
 */
export async function getSuggestedRiders(targetLat, targetLng) {
  const [riders] = await pool.query(
    `SELECT id, name, phone, vehicle_type, vehicle_number, is_online,
            current_latitude, current_longitude, last_location_update
     FROM riders
     WHERE status = 'active' AND is_online = 1
       AND current_latitude IS NOT NULL AND current_longitude IS NOT NULL`
  );

  const ridersWithDistance = riders.map((rider) => {
    const distance = haversineDistance(
      parseFloat(rider.current_latitude),
      parseFloat(rider.current_longitude),
      targetLat,
      targetLng
    );
    return {
      ...rider,
      distance_km: Math.round(distance * 100) / 100,
      estimated_minutes: estimateDeliveryTime(distance),
    };
  });

  ridersWithDistance.sort((a, b) => a.distance_km - b.distance_km);
  return ridersWithDistance;
}

/**
 * Get active order count per rider
 */
export async function getActiveOrderCounts() {
  const [rows] = await pool.query(
    `SELECT rider_id, COUNT(*) AS active_orders
     FROM order_assignments
     WHERE status IN ('pending', 'accepted', 'picked_up', 'in_transit')
     GROUP BY rider_id`
  );
  const map = {};
  rows.forEach((r) => { map[r.rider_id] = r.active_orders; });
  return map;
}

/**
 * Suggest riders for an order, enriched with distance, active count, and nearby flag
 */
export async function suggestRidersForOrder(orderId) {
  const [orders] = await pool.query(
    `SELECT o.id, a.latitude, a.longitude
     FROM orders o
     LEFT JOIN newaddresses a ON o.address_id = a.id
     WHERE o.id = ?`,
    [orderId]
  );

  if (orders.length === 0) return [];

  const targetLat = parseFloat(orders[0].latitude);
  const targetLng = parseFloat(orders[0].longitude);

  if (!targetLat || !targetLng) return [];

  const riders = await getSuggestedRiders(targetLat, targetLng);
  const activeOrderCounts = await getActiveOrderCounts();

  return riders.map((rider) => ({
    ...rider,
    active_orders: activeOrderCounts[rider.id] || 0,
  }));
}

/**
 * Find riders who have active deliveries near a given location.
 * Returns riders with their active order's delivery address close to the target.
 */
export async function findNearbyActiveRiders(targetLat, targetLng, radiusKm = 3) {
  const [activeAssignments] = await pool.query(
    `SELECT 
      oa.rider_id, oa.order_id, oa.status AS assignment_status,
      r.name AS rider_name, r.phone AS rider_phone, r.vehicle_type,
      r.current_latitude AS rider_lat, r.current_longitude AS rider_lng,
      a.latitude AS delivery_lat, a.longitude AS delivery_lng,
      a.street, a.city
    FROM order_assignments oa
    JOIN riders r ON oa.rider_id = r.id
    JOIN orders o ON oa.order_id = o.id
    LEFT JOIN newaddresses a ON o.address_id = a.id
    WHERE oa.status IN ('accepted', 'picked_up', 'in_transit')
      AND r.status = 'active' AND r.is_online = 1
      AND a.latitude IS NOT NULL AND a.longitude IS NOT NULL`
  );

  const nearbyRiders = [];

  for (const assignment of activeAssignments) {
    const deliveryDistance = haversineDistance(
      parseFloat(assignment.delivery_lat),
      parseFloat(assignment.delivery_lng),
      targetLat,
      targetLng
    );

    if (deliveryDistance <= radiusKm) {
      const riderDistance = (assignment.rider_lat && assignment.rider_lng)
        ? haversineDistance(
            parseFloat(assignment.rider_lat),
            parseFloat(assignment.rider_lng),
            targetLat,
            targetLng
          )
        : null;

      nearbyRiders.push({
        rider_id: assignment.rider_id,
        rider_name: assignment.rider_name,
        rider_phone: assignment.rider_phone,
        vehicle_type: assignment.vehicle_type,
        current_order_id: assignment.order_id,
        current_delivery_address: `${assignment.street}, ${assignment.city}`,
        delivery_distance_km: Math.round(deliveryDistance * 100) / 100,
        rider_distance_km: riderDistance ? Math.round(riderDistance * 100) / 100 : null,
      });
    }
  }

  nearbyRiders.sort((a, b) => a.delivery_distance_km - b.delivery_distance_km);
  return nearbyRiders;
}

/**
 * Generate a 6-digit OTP for delivery verification
 */
export function generateDeliveryOTP() {
  return String(Math.floor(100000 + Math.random() * 900000));
}
