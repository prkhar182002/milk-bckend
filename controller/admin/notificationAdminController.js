import pool from "../../config.js";

export const getAdminNotifications = async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    const [notifications] = await pool.query(
      `SELECT * FROM notifications WHERE recipient_type = 'admin' ORDER BY created_at DESC LIMIT ? OFFSET ?`,
      [parseInt(limit), offset]
    );

    const [unread] = await pool.query(
      `SELECT COUNT(*) as count FROM notifications WHERE recipient_type = 'admin' AND is_read = 0`
    );

    return res.json({ success: true, notifications, unread_count: unread[0].count });
  } catch (error) {
    console.error("Get admin notifications error:", error);
    return res.status(500).json({ success: false, message: "Failed to fetch notifications" });
  }
};

export const markAdminNotificationsRead = async (req, res) => {
  try {
    await pool.query(`UPDATE notifications SET is_read = 1 WHERE recipient_type = 'admin'`);
    return res.json({ success: true, message: "Notifications marked as read" });
  } catch (error) {
    console.error("Mark notifications error:", error);
    return res.status(500).json({ success: false, message: "Failed to update" });
  }
};
