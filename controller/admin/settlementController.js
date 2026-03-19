import pool from "../../config.js";

export const getPendingSettlements = async (req, res) => {
  try {
    const [settlements] = await pool.query(
      `SELECT 
        r.id AS rider_id, r.name AS rider_name, r.phone AS rider_phone,
        COUNT(re.id) AS pending_deliveries,
        COALESCE(SUM(re.cod_amount), 0) AS total_unsettled
      FROM rider_earnings re
      JOIN riders r ON re.rider_id = r.id
      WHERE re.cod_settled = 0 AND re.cod_amount > 0
      GROUP BY r.id
      ORDER BY total_unsettled DESC`
    );

    return res.json({ success: true, settlements });
  } catch (error) {
    console.error("Get pending settlements error:", error);
    return res.status(500).json({ success: false, message: "Failed to fetch settlements" });
  }
};

export const settlePayment = async (req, res) => {
  try {
    const { rider_id, amount, settlement_date } = req.body;

    if (!rider_id || !amount) {
      return res.status(400).json({ success: false, message: "Rider ID and amount required" });
    }

    const date = settlement_date || new Date().toISOString().split("T")[0];

    // Mark oldest unsettled earnings as settled, up to the amount
    const [unsettled] = await pool.query(
      `SELECT id, cod_amount FROM rider_earnings WHERE rider_id = ? AND cod_settled = 0 AND cod_amount > 0 ORDER BY created_at ASC`,
      [rider_id]
    );

    let remaining = parseFloat(amount);
    const settledIds = [];

    for (const earning of unsettled) {
      if (remaining <= 0) break;
      settledIds.push(earning.id);
      remaining -= parseFloat(earning.cod_amount);
    }

    if (settledIds.length > 0) {
      await pool.query(
        `UPDATE rider_earnings SET cod_settled = 1, settlement_date = ? WHERE id IN (${settledIds.map(() => "?").join(",")})`,
        [date, ...settledIds]
      );

      await pool.query(
        `UPDATE order_assignments SET cod_settled = 1 
         WHERE id IN (SELECT order_assignment_id FROM rider_earnings WHERE id IN (${settledIds.map(() => "?").join(",")}))`,
        settledIds
      );
    }

    return res.json({
      success: true,
      message: `Settled ₹${amount} for rider`,
      settled_count: settledIds.length,
    });
  } catch (error) {
    console.error("Settle payment error:", error);
    return res.status(500).json({ success: false, message: "Failed to settle payment" });
  }
};

export const getSettlementHistory = async (req, res) => {
  try {
    const { rider_id, page = 1, limit = 20 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    let query = `
      SELECT re.*, r.name AS rider_name, r.phone AS rider_phone, oa.order_id
      FROM rider_earnings re
      JOIN riders r ON re.rider_id = r.id
      JOIN order_assignments oa ON re.order_assignment_id = oa.id
      WHERE re.cod_settled = 1
    `;
    const params = [];

    if (rider_id) {
      query += ` AND re.rider_id = ?`;
      params.push(rider_id);
    }

    query += ` ORDER BY re.settlement_date DESC LIMIT ? OFFSET ?`;
    params.push(parseInt(limit), offset);

    const [history] = await pool.query(query, params);

    return res.json({ success: true, history });
  } catch (error) {
    console.error("Get settlement history error:", error);
    return res.status(500).json({ success: false, message: "Failed to fetch history" });
  }
};
