import pool from "../../config.js";

export const getEarningsSummary = async (req, res) => {
  try {
    const riderId = req.rider.id;
    const today = new Date().toISOString().split("T")[0];

    const startOfWeek = new Date();
    startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
    const weekStart = startOfWeek.toISOString().split("T")[0];

    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    const monthStart = startOfMonth.toISOString().split("T")[0];

    const [daily] = await pool.query(
      `SELECT COALESCE(SUM(delivery_fee), 0) AS delivery_earnings,
              COALESCE(SUM(cod_amount), 0) AS cod_collected,
              COUNT(*) AS deliveries
       FROM rider_earnings WHERE rider_id = ? AND DATE(created_at) = ?`,
      [riderId, today]
    );

    const [weekly] = await pool.query(
      `SELECT COALESCE(SUM(delivery_fee), 0) AS delivery_earnings,
              COALESCE(SUM(cod_amount), 0) AS cod_collected,
              COUNT(*) AS deliveries
       FROM rider_earnings WHERE rider_id = ? AND DATE(created_at) >= ?`,
      [riderId, weekStart]
    );

    const [monthly] = await pool.query(
      `SELECT COALESCE(SUM(delivery_fee), 0) AS delivery_earnings,
              COALESCE(SUM(cod_amount), 0) AS cod_collected,
              COUNT(*) AS deliveries
       FROM rider_earnings WHERE rider_id = ? AND DATE(created_at) >= ?`,
      [riderId, monthStart]
    );

    const [unsettled] = await pool.query(
      `SELECT COALESCE(SUM(cod_amount), 0) AS amount
       FROM rider_earnings WHERE rider_id = ? AND cod_settled = 0 AND cod_amount > 0`,
      [riderId]
    );

    return res.json({
      success: true,
      earnings: {
        daily: daily[0],
        weekly: weekly[0],
        monthly: monthly[0],
        unsettled_cod: unsettled[0].amount,
      },
    });
  } catch (error) {
    console.error("Get earnings summary error:", error);
    return res.status(500).json({ success: false, message: "Failed to fetch earnings" });
  }
};

export const getEarningsHistory = async (req, res) => {
  try {
    const riderId = req.rider.id;
    const { page = 1, limit = 20 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    const [earnings] = await pool.query(
      `SELECT re.*, oa.order_id, o.total_amount
       FROM rider_earnings re
       JOIN order_assignments oa ON re.order_assignment_id = oa.id
       JOIN orders o ON oa.order_id = o.id
       WHERE re.rider_id = ?
       ORDER BY re.created_at DESC
       LIMIT ? OFFSET ?`,
      [riderId, parseInt(limit), offset]
    );

    const [countResult] = await pool.query(
      `SELECT COUNT(*) as total FROM rider_earnings WHERE rider_id = ?`,
      [riderId]
    );

    return res.json({
      success: true,
      earnings,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: countResult[0].total,
        totalPages: Math.ceil(countResult[0].total / parseInt(limit)),
      },
    });
  } catch (error) {
    console.error("Get earnings history error:", error);
    return res.status(500).json({ success: false, message: "Failed to fetch earnings history" });
  }
};
