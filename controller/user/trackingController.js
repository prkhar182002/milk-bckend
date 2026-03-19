import pool from "../../config.js";

export const getOrderTracking = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const [orders] = await pool.query(
      `SELECT o.id, o.status, o.delivery_status, o.delivery_otp, o.estimated_delivery_time,
              o.payment_status, o.total_amount, o.type, o.created_at
       FROM orders o WHERE o.id = ? AND o.site_user_id = ?`,
      [id, userId]
    );

    if (orders.length === 0) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }

    const order = orders[0];

    let rider = null;
    let assignment = null;

    if (order.delivery_status !== "unassigned") {
      const [assignments] = await pool.query(
        `SELECT oa.status AS assignment_status, oa.assigned_at, oa.accepted_at,
                oa.picked_up_at, oa.delivered_at, oa.estimated_time_minutes,
                r.id AS rider_id, r.name AS rider_name, r.phone AS rider_phone,
                r.avatar AS rider_avatar, r.vehicle_type, r.vehicle_number,
                r.current_latitude, r.current_longitude
         FROM order_assignments oa
         JOIN riders r ON oa.rider_id = r.id
         WHERE oa.order_id = ? AND oa.status NOT IN ('rejected', 'failed')
         ORDER BY oa.assigned_at DESC LIMIT 1`,
        [id]
      );

      if (assignments.length > 0) {
        const a = assignments[0];
        rider = {
          name: a.rider_name,
          phone: a.rider_phone ? a.rider_phone.replace(/(\d{2})\d{6}(\d{2})/, "$1******$2") : null,
          avatar: a.rider_avatar,
          vehicle_type: a.vehicle_type,
          vehicle_number: a.vehicle_number,
          latitude: ["in_transit", "picked_up"].includes(a.assignment_status) ? a.current_latitude : null,
          longitude: ["in_transit", "picked_up"].includes(a.assignment_status) ? a.current_longitude : null,
        };
        assignment = {
          status: a.assignment_status,
          assigned_at: a.assigned_at,
          accepted_at: a.accepted_at,
          picked_up_at: a.picked_up_at,
          delivered_at: a.delivered_at,
          estimated_time_minutes: a.estimated_time_minutes,
        };
      }
    }

    return res.json({
      success: true,
      tracking: {
        order_id: order.id,
        order_status: order.status,
        delivery_status: order.delivery_status,
        payment_status: order.payment_status,
        delivery_otp: order.delivery_status === "in_transit" ? order.delivery_otp : null,
        rider,
        assignment,
      },
    });
  } catch (error) {
    console.error("Get tracking error:", error);
    return res.status(500).json({ success: false, message: "Failed to get tracking info" });
  }
};

export const getNotifications = async (req, res) => {
  try {
    const userId = req.user.id;
    const { page = 1, limit = 20 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    const [notifications] = await pool.query(
      `SELECT * FROM notifications WHERE recipient_type = 'user' AND recipient_id = ? ORDER BY created_at DESC LIMIT ? OFFSET ?`,
      [userId, parseInt(limit), offset]
    );

    const [unread] = await pool.query(
      `SELECT COUNT(*) as count FROM notifications WHERE recipient_type = 'user' AND recipient_id = ? AND is_read = 0`,
      [userId]
    );

    return res.json({
      success: true,
      notifications,
      unread_count: unread[0].count,
    });
  } catch (error) {
    console.error("Get notifications error:", error);
    return res.status(500).json({ success: false, message: "Failed to fetch notifications" });
  }
};

export const markNotificationsRead = async (req, res) => {
  try {
    const userId = req.user.id;
    await pool.query(
      `UPDATE notifications SET is_read = 1 WHERE recipient_type = 'user' AND recipient_id = ?`,
      [userId]
    );
    return res.json({ success: true, message: "Notifications marked as read" });
  } catch (error) {
    console.error("Mark notifications error:", error);
    return res.status(500).json({ success: false, message: "Failed to update notifications" });
  }
};
