import pool from "../../config.js";
import { hashedpassword } from "../../helper/hashing.js";

export const createRider = async (req, res) => {
  try {
    const { name, phone, password, email, vehicle_type, vehicle_number } = req.body;

    if (!name || !phone || !password) {
      return res.status(400).json({ success: false, message: "Name, phone, and password are required" });
    }

    const [existing] = await pool.query(`SELECT id FROM riders WHERE phone = ?`, [phone]);
    if (existing.length > 0) {
      return res.status(400).json({ success: false, message: "Rider with this phone already exists" });
    }

    const hashed = await hashedpassword(password);

    const [result] = await pool.query(
      `INSERT INTO riders (name, phone, password, email, vehicle_type, vehicle_number) VALUES (?, ?, ?, ?, ?, ?)`,
      [name, phone, hashed, email || null, vehicle_type || "bike", vehicle_number || null]
    );

    return res.status(201).json({
      success: true,
      message: "Rider created successfully",
      rider: { id: result.insertId, name, phone, email, vehicle_type, vehicle_number },
    });
  } catch (error) {
    console.error("Create rider error:", error);
    return res.status(500).json({ success: false, message: "Failed to create rider" });
  }
};

export const getAllRiders = async (req, res) => {
  try {
    const { status, search, is_online, page = 1, limit = 20 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    let query = `
      SELECT r.id, r.name, r.email, r.phone, r.avatar, r.status, r.is_online,
             r.vehicle_type, r.vehicle_number, r.current_latitude, r.current_longitude,
             r.last_location_update, r.created_at,
             (SELECT COUNT(*) FROM order_assignments oa WHERE oa.rider_id = r.id AND oa.status IN ('pending','accepted','picked_up','in_transit')) AS active_orders,
             (SELECT COUNT(*) FROM order_assignments oa WHERE oa.rider_id = r.id AND oa.status = 'delivered' AND DATE(oa.delivered_at) = CURDATE()) AS today_deliveries
      FROM riders r WHERE 1=1
    `;
    const params = [];

    if (status && status !== "all") {
      query += ` AND r.status = ?`;
      params.push(status);
    }

    if (is_online !== undefined && is_online !== "") {
      query += ` AND r.is_online = ?`;
      params.push(parseInt(is_online));
    }

    if (search) {
      query += ` AND (r.name LIKE ? OR r.phone LIKE ? OR r.email LIKE ?)`;
      const s = `%${search}%`;
      params.push(s, s, s);
    }

    query += ` ORDER BY r.created_at DESC LIMIT ? OFFSET ?`;
    params.push(parseInt(limit), offset);

    const [riders] = await pool.query(query, params);

    let countQuery = `SELECT COUNT(*) as total FROM riders r WHERE 1=1`;
    const countParams = [];
    if (status && status !== "all") { countQuery += ` AND r.status = ?`; countParams.push(status); }
    if (is_online !== undefined && is_online !== "") { countQuery += ` AND r.is_online = ?`; countParams.push(parseInt(is_online)); }
    if (search) {
      countQuery += ` AND (r.name LIKE ? OR r.phone LIKE ? OR r.email LIKE ?)`;
      const s = `%${search}%`;
      countParams.push(s, s, s);
    }

    const [countResult] = await pool.query(countQuery, countParams);

    return res.json({
      success: true,
      riders,
      pagination: {
        page: parseInt(page), limit: parseInt(limit),
        total: countResult[0].total,
        totalPages: Math.ceil(countResult[0].total / parseInt(limit)),
      },
    });
  } catch (error) {
    console.error("Get riders error:", error);
    return res.status(500).json({ success: false, message: "Failed to fetch riders" });
  }
};

export const getRiderById = async (req, res) => {
  try {
    const { id } = req.params;

    const [riders] = await pool.query(
      `SELECT id, name, email, phone, avatar, status, is_online, vehicle_type, vehicle_number,
              current_latitude, current_longitude, last_location_update, created_at
       FROM riders WHERE id = ?`,
      [id]
    );

    if (riders.length === 0) {
      return res.status(404).json({ success: false, message: "Rider not found" });
    }

    const [stats] = await pool.query(
      `SELECT 
        COUNT(CASE WHEN status = 'delivered' THEN 1 END) AS total_deliveries,
        COUNT(CASE WHEN status IN ('pending','accepted','picked_up','in_transit') THEN 1 END) AS active_orders,
        AVG(CASE WHEN status = 'delivered' THEN TIMESTAMPDIFF(MINUTE, accepted_at, delivered_at) END) AS avg_delivery_minutes,
        SUM(CASE WHEN cod_collected = 1 THEN cod_amount ELSE 0 END) AS total_cod_collected,
        SUM(CASE WHEN cod_collected = 1 AND cod_settled = 0 THEN cod_amount ELSE 0 END) AS unsettled_cod
      FROM order_assignments WHERE rider_id = ?`,
      [id]
    );

    return res.json({
      success: true,
      rider: riders[0],
      stats: stats[0],
    });
  } catch (error) {
    console.error("Get rider error:", error);
    return res.status(500).json({ success: false, message: "Failed to fetch rider" });
  }
};

export const updateRider = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, phone, vehicle_type, vehicle_number, status, password } = req.body;

    const updates = [];
    const params = [];

    if (name) { updates.push("name = ?"); params.push(name); }
    if (email !== undefined) { updates.push("email = ?"); params.push(email || null); }
    if (phone) { updates.push("phone = ?"); params.push(phone); }
    if (vehicle_type) { updates.push("vehicle_type = ?"); params.push(vehicle_type); }
    if (vehicle_number !== undefined) { updates.push("vehicle_number = ?"); params.push(vehicle_number || null); }
    if (status) { updates.push("status = ?"); params.push(status); }

    if (password) {
      if (password.length < 6) {
        return res.status(400).json({ success: false, message: "Password must be at least 6 characters" });
      }
      const hashed = await hashedpassword(password);
      updates.push("password = ?");
      params.push(hashed);
    }

    if (updates.length === 0) {
      return res.status(400).json({ success: false, message: "No fields to update" });
    }

    params.push(id);
    await pool.query(`UPDATE riders SET ${updates.join(", ")} WHERE id = ?`, params);

    return res.json({ success: true, message: "Rider updated" });
  } catch (error) {
    console.error("Update rider error:", error);
    return res.status(500).json({ success: false, message: "Failed to update rider" });
  }
};

export const updateRiderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const valid = ["active", "inactive", "suspended"];
    if (!valid.includes(status)) {
      return res.status(400).json({ success: false, message: `Status must be: ${valid.join(", ")}` });
    }

    await pool.query(`UPDATE riders SET status = ? WHERE id = ?`, [status, id]);

    if (status === "suspended") {
      await pool.query(`UPDATE riders SET is_online = 0 WHERE id = ?`, [id]);
    }

    return res.json({ success: true, message: "Rider status updated" });
  } catch (error) {
    console.error("Update rider status error:", error);
    return res.status(500).json({ success: false, message: "Failed to update status" });
  }
};

export const deleteRider = async (req, res) => {
  try {
    const { id } = req.params;

    const [active] = await pool.query(
      `SELECT COUNT(*) as c FROM order_assignments WHERE rider_id = ? AND status IN ('pending','accepted','picked_up','in_transit')`,
      [id]
    );

    if (active[0].c > 0) {
      return res.status(400).json({ success: false, message: "Cannot delete rider with active orders. Suspend instead." });
    }

    await pool.query(`UPDATE riders SET status = 'inactive' WHERE id = ?`, [id]);

    return res.json({ success: true, message: "Rider deactivated" });
  } catch (error) {
    console.error("Delete rider error:", error);
    return res.status(500).json({ success: false, message: "Failed to delete rider" });
  }
};

export const getOnlineRiders = async (req, res) => {
  try {
    const [riders] = await pool.query(
      `SELECT r.id, r.name, r.phone, r.vehicle_type, r.vehicle_number,
              r.current_latitude, r.current_longitude, r.last_location_update,
              (SELECT COUNT(*) FROM order_assignments oa WHERE oa.rider_id = r.id AND oa.status IN ('pending','accepted','picked_up','in_transit')) AS active_orders
       FROM riders r
       WHERE r.status = 'active' AND r.is_online = 1`
    );

    return res.json({ success: true, riders });
  } catch (error) {
    console.error("Get online riders error:", error);
    return res.status(500).json({ success: false, message: "Failed to fetch online riders" });
  }
};

export const getLiveLocations = async (req, res) => {
  try {
    const [riders] = await pool.query(
      `SELECT r.id, r.name, r.phone, r.vehicle_type, r.is_online,
              r.current_latitude, r.current_longitude, r.last_location_update,
              oa.order_id AS active_order_id, oa.status AS assignment_status,
              a.street AS delivery_street, a.city AS delivery_city,
              a.latitude AS delivery_lat, a.longitude AS delivery_lng
       FROM riders r
       LEFT JOIN order_assignments oa ON oa.rider_id = r.id AND oa.status IN ('accepted','picked_up','in_transit')
       LEFT JOIN orders o ON oa.order_id = o.id
       LEFT JOIN newaddresses a ON o.address_id = a.id
       WHERE r.status = 'active' AND r.is_online = 1
         AND r.current_latitude IS NOT NULL`
    );

    return res.json({ success: true, riders });
  } catch (error) {
    console.error("Get live locations error:", error);
    return res.status(500).json({ success: false, message: "Failed to fetch locations" });
  }
};

export const getRiderAssignments = async (req, res) => {
  try {
    const { rider_id } = req.query;
    const limit = parseInt(req.query.limit) || 10;

    if (!rider_id) {
      return res.status(400).json({ success: false, message: "rider_id is required" });
    }

    const [assignments] = await pool.query(
      `SELECT oa.id, oa.order_id, oa.status, oa.assigned_at, oa.accepted_at,
              oa.picked_up_at, oa.delivered_at, oa.cod_amount, oa.cod_collected,
              oa.cod_settled, oa.distance_km, oa.rejection_reason,
              o.total_amount, o.payment_status,
              a.street, a.city
       FROM order_assignments oa
       LEFT JOIN orders o ON oa.order_id = o.id
       LEFT JOIN newaddresses a ON o.address_id = a.id
       WHERE oa.rider_id = ?
       ORDER BY oa.assigned_at DESC
       LIMIT ?`,
      [rider_id, limit]
    );

    return res.json({ success: true, assignments });
  } catch (error) {
    console.error("Get rider assignments error:", error);
    return res.status(500).json({ success: false, message: "Failed to fetch assignments" });
  }
};
