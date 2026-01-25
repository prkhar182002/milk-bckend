import {
  getPaymentLinkById,
  syncPaymentLinkStatus,
  cancelPaymentLink,
  createRefund,
} from "../../services/paymentLinkService.js";
import pool from "../../config.js";
import { razorpay } from "../../services/paymentLinkService.js";

/**
 * Get all payment links (Admin)
 */
export const getAllPaymentLinks = async (req, res) => {
  try {
    const {
      status,
      user_id,
      order_id,
      limit = 50,
      offset = 0,
      start_date,
      end_date,
    } = req.query;

    let query = `SELECT pl.*, u.name as user_name, u.email as user_email 
                 FROM payment_links pl
                 LEFT JOIN users u ON pl.site_user_id = u.id
                 WHERE 1=1`;
    const params = [];

    if (status) {
      query += ` AND pl.status = ?`;
      params.push(status);
    }

    if (user_id) {
      query += ` AND pl.site_user_id = ?`;
      params.push(user_id);
    }

    if (order_id) {
      query += ` AND pl.order_id = ?`;
      params.push(order_id);
    }

    if (start_date) {
      query += ` AND pl.created_at >= ?`;
      params.push(start_date);
    }

    if (end_date) {
      query += ` AND pl.created_at <= ?`;
      params.push(end_date);
    }

    query += ` ORDER BY pl.created_at DESC LIMIT ? OFFSET ?`;
    params.push(parseInt(limit), parseInt(offset));

    const [paymentLinks] = await pool.query(query, params);

    // Get total count
    let countQuery = `SELECT COUNT(*) as total 
                      FROM payment_links pl
                      WHERE 1=1`;
    const countParams = [];

    if (status) {
      countQuery += ` AND pl.status = ?`;
      countParams.push(status);
    }

    if (user_id) {
      countQuery += ` AND pl.site_user_id = ?`;
      countParams.push(user_id);
    }

    if (order_id) {
      countQuery += ` AND pl.order_id = ?`;
      countParams.push(order_id);
    }

    if (start_date) {
      countQuery += ` AND pl.created_at >= ?`;
      countParams.push(start_date);
    }

    if (end_date) {
      countQuery += ` AND pl.created_at <= ?`;
      countParams.push(end_date);
    }

    const [countResult] = await pool.query(countQuery, countParams);

    return res.json({
      success: true,
      data: {
        payment_links: paymentLinks,
        pagination: {
          total: countResult[0].total,
          limit: parseInt(limit),
          offset: parseInt(offset),
        },
      },
    });
  } catch (error) {
    console.error("❌ Error fetching payment links:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch payment links",
    });
  }
};

/**
 * Get payment link details (Admin)
 */
export const getAdminPaymentLink = async (req, res) => {
  try {
    const { id } = req.params;

    const paymentLink = await getPaymentLinkById(id);

    if (!paymentLink) {
      return res.status(404).json({
        success: false,
        message: "Payment link not found",
      });
    }

    // Sync status from Razorpay
    const syncedLink = await syncPaymentLinkStatus(
      paymentLink.razorpay_payment_link_id
    );

    // Get user details
    const [users] = await pool.query(
      `SELECT id, name, email, phone FROM users WHERE id = ?`,
      [paymentLink.site_user_id]
    );

    // Get order details if exists
    let order = null;
    if (paymentLink.order_id) {
      const [orders] = await pool.query(
        `SELECT * FROM orders WHERE id = ?`,
        [paymentLink.order_id]
      );
      order = orders[0] || null;
    }

    // Get transactions
    const [transactions] = await pool.query(
      `SELECT * FROM transactions 
       WHERE payment_link_id = ? 
       ORDER BY created_at DESC`,
      [paymentLink.id]
    );

    return res.json({
      success: true,
      data: {
        payment_link: {
          ...paymentLink,
          razorpay_status: syncedLink.status,
        },
        user: users[0] || null,
        order,
        transactions,
      },
    });
  } catch (error) {
    console.error("❌ Error fetching payment link:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch payment link",
    });
  }
};

/**
 * Cancel payment link (Admin)
 */
export const cancelAdminPaymentLink = async (req, res) => {
  try {
    const { id } = req.params;

    const paymentLink = await getPaymentLinkById(id);

    if (!paymentLink) {
      return res.status(404).json({
        success: false,
        message: "Payment link not found",
      });
    }

    if (paymentLink.status === "paid") {
      return res.status(400).json({
        success: false,
        message: "Cannot cancel a paid payment link",
      });
    }

    if (paymentLink.status === "cancelled") {
      return res.json({
        success: true,
        message: "Payment link already cancelled",
      });
    }

    await cancelPaymentLink(paymentLink.razorpay_payment_link_id);

    return res.json({
      success: true,
      message: "Payment link cancelled successfully",
    });
  } catch (error) {
    console.error("❌ Error cancelling payment link:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to cancel payment link",
    });
  }
};

/**
 * Get all transactions (Admin)
 */
export const getAllTransactions = async (req, res) => {
  try {
    const {
      status,
      payment_method,
      user_id,
      order_id,
      limit = 50,
      offset = 0,
      start_date,
      end_date,
    } = req.query;

    let query = `SELECT t.*, u.name as user_name, u.email as user_email,
                        o.id as order_id_ref, o.total_amount as order_amount
                 FROM transactions t
                 LEFT JOIN users u ON t.site_user_id = u.id
                 LEFT JOIN orders o ON t.order_id = o.id
                 WHERE 1=1`;
    const params = [];

    if (status) {
      query += ` AND t.status = ?`;
      params.push(status);
    }

    if (payment_method) {
      query += ` AND t.payment_method = ?`;
      params.push(payment_method);
    }

    if (user_id) {
      query += ` AND t.site_user_id = ?`;
      params.push(user_id);
    }

    if (order_id) {
      query += ` AND t.order_id = ?`;
      params.push(order_id);
    }

    if (start_date) {
      query += ` AND t.created_at >= ?`;
      params.push(start_date);
    }

    if (end_date) {
      query += ` AND t.created_at <= ?`;
      params.push(end_date);
    }

    query += ` ORDER BY t.created_at DESC LIMIT ? OFFSET ?`;
    params.push(parseInt(limit), parseInt(offset));

    const [transactions] = await pool.query(query, params);

    // Get total count
    let countQuery = `SELECT COUNT(*) as total FROM transactions t WHERE 1=1`;
    const countParams = [];

    if (status) {
      countQuery += ` AND t.status = ?`;
      countParams.push(status);
    }

    if (payment_method) {
      countQuery += ` AND t.payment_method = ?`;
      countParams.push(payment_method);
    }

    if (user_id) {
      countQuery += ` AND t.site_user_id = ?`;
      countParams.push(user_id);
    }

    if (order_id) {
      countQuery += ` AND t.order_id = ?`;
      countParams.push(order_id);
    }

    if (start_date) {
      countQuery += ` AND t.created_at >= ?`;
      countParams.push(start_date);
    }

    if (end_date) {
      countQuery += ` AND t.created_at <= ?`;
      countParams.push(end_date);
    }

    const [countResult] = await pool.query(countQuery, countParams);

    return res.json({
      success: true,
      data: {
        transactions,
        pagination: {
          total: countResult[0].total,
          limit: parseInt(limit),
          offset: parseInt(offset),
        },
      },
    });
  } catch (error) {
    console.error("❌ Error fetching transactions:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch transactions",
    });
  }
};

/**
 * Get transaction details (Admin)
 */
export const getAdminTransaction = async (req, res) => {
  try {
    const { id } = req.params;

    const [transactions] = await pool.query(
      `SELECT t.*, u.name as user_name, u.email as user_email,
              pl.razorpay_payment_link_id, pl.payment_link_url,
              o.*
       FROM transactions t
       LEFT JOIN users u ON t.site_user_id = u.id
       LEFT JOIN payment_links pl ON t.payment_link_id = pl.id
       LEFT JOIN orders o ON t.order_id = o.id
       WHERE t.id = ? OR t.razorpay_payment_id = ?`,
      [id, id]
    );

    if (transactions.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Transaction not found",
      });
    }

    const transaction = transactions[0];

    // Get refunds for this transaction
    const [refunds] = await pool.query(
      `SELECT * FROM refunds WHERE transaction_id = ? ORDER BY created_at DESC`,
      [transaction.id]
    );

    return res.json({
      success: true,
      data: {
        transaction,
        refunds,
      },
    });
  } catch (error) {
    console.error("❌ Error fetching transaction:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch transaction",
    });
  }
};

/**
 * Create refund (Admin)
 */
export const createAdminRefund = async (req, res) => {
  try {
    const { payment_id, amount, speed = "normal", notes, receipt } = req.body;

    if (!payment_id) {
      return res.status(400).json({
        success: false,
        message: "Payment ID is required",
      });
    }

    // Get transaction details
    const [transactions] = await pool.query(
      `SELECT * FROM transactions WHERE razorpay_payment_id = ?`,
      [payment_id]
    );

    if (transactions.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Transaction not found",
      });
    }

    const transaction = transactions[0];

    // Validate refund amount
    const refundAmount = parseFloat(amount);
    const availableForRefund =
      parseFloat(transaction.amount) - parseFloat(transaction.amount_refunded || 0);

    if (refundAmount <= 0 || refundAmount > availableForRefund) {
      return res.status(400).json({
        success: false,
        message: `Invalid refund amount. Available: ${availableForRefund}`,
      });
    }

    // Create refund
    const refund = await createRefund({
      paymentId: payment_id,
      amount: refundAmount,
      speed,
      notes,
      receipt,
    });

    return res.json({
      success: true,
      message: "Refund initiated successfully",
      data: {
        refund,
      },
    });
  } catch (error) {
    console.error("❌ Error creating refund:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to create refund",
    });
  }
};

/**
 * Get all refunds (Admin)
 */
export const getAllRefunds = async (req, res) => {
  try {
    const {
      status,
      transaction_id,
      order_id,
      limit = 50,
      offset = 0,
      start_date,
      end_date,
    } = req.query;

    let query = `SELECT r.*, t.razorpay_payment_id, t.amount as transaction_amount,
                        o.id as order_id_ref, u.name as user_name, u.email as user_email
                 FROM refunds r
                 LEFT JOIN transactions t ON r.transaction_id = t.id
                 LEFT JOIN orders o ON r.order_id = o.id
                 LEFT JOIN users u ON t.site_user_id = u.id
                 WHERE 1=1`;
    const params = [];

    if (status) {
      query += ` AND r.status = ?`;
      params.push(status);
    }

    if (transaction_id) {
      query += ` AND r.transaction_id = ?`;
      params.push(transaction_id);
    }

    if (order_id) {
      query += ` AND r.order_id = ?`;
      params.push(order_id);
    }

    if (start_date) {
      query += ` AND r.created_at >= ?`;
      params.push(start_date);
    }

    if (end_date) {
      query += ` AND r.created_at <= ?`;
      params.push(end_date);
    }

    query += ` ORDER BY r.created_at DESC LIMIT ? OFFSET ?`;
    params.push(parseInt(limit), parseInt(offset));

    const [refunds] = await pool.query(query, params);

    // Get total count
    let countQuery = `SELECT COUNT(*) as total FROM refunds r WHERE 1=1`;
    const countParams = [];

    if (status) {
      countQuery += ` AND r.status = ?`;
      countParams.push(status);
    }

    if (transaction_id) {
      countQuery += ` AND r.transaction_id = ?`;
      countParams.push(transaction_id);
    }

    if (order_id) {
      countQuery += ` AND r.order_id = ?`;
      countParams.push(order_id);
    }

    if (start_date) {
      countQuery += ` AND r.created_at >= ?`;
      countParams.push(start_date);
    }

    if (end_date) {
      countQuery += ` AND r.created_at <= ?`;
      countParams.push(end_date);
    }

    const [countResult] = await pool.query(countQuery, countParams);

    return res.json({
      success: true,
      data: {
        refunds,
        pagination: {
          total: countResult[0].total,
          limit: parseInt(limit),
          offset: parseInt(offset),
        },
      },
    });
  } catch (error) {
    console.error("❌ Error fetching refunds:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch refunds",
    });
  }
};

/**
 * Get webhook events (Admin - Audit Trail)
 */
export const getWebhookEvents = async (req, res) => {
  try {
    const {
      event_type,
      processed,
      limit = 50,
      offset = 0,
      start_date,
      end_date,
    } = req.query;

    let query = `SELECT * FROM webhook_events WHERE 1=1`;
    const params = [];

    if (event_type) {
      query += ` AND event_type = ?`;
      params.push(event_type);
    }

    if (processed !== undefined) {
      query += ` AND processed = ?`;
      params.push(processed === "true");
    }

    if (start_date) {
      query += ` AND created_at >= ?`;
      params.push(start_date);
    }

    if (end_date) {
      query += ` AND created_at <= ?`;
      params.push(end_date);
    }

    query += ` ORDER BY created_at DESC LIMIT ? OFFSET ?`;
    params.push(parseInt(limit), parseInt(offset));

    const [events] = await pool.query(query, params);

    // Get total count
    let countQuery = `SELECT COUNT(*) as total FROM webhook_events WHERE 1=1`;
    const countParams = [];

    if (event_type) {
      countQuery += ` AND event_type = ?`;
      countParams.push(event_type);
    }

    if (processed !== undefined) {
      countQuery += ` AND processed = ?`;
      countParams.push(processed === "true");
    }

    if (start_date) {
      countQuery += ` AND created_at >= ?`;
      countParams.push(start_date);
    }

    if (end_date) {
      countQuery += ` AND created_at <= ?`;
      countParams.push(end_date);
    }

    const [countResult] = await pool.query(countQuery, countParams);

    return res.json({
      success: true,
      data: {
        events,
        pagination: {
          total: countResult[0].total,
          limit: parseInt(limit),
          offset: parseInt(offset),
        },
      },
    });
  } catch (error) {
    console.error("❌ Error fetching webhook events:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch webhook events",
    });
  }
};

/**
 * Get payment statistics (Admin Dashboard)
 */
export const getPaymentStatistics = async (req, res) => {
  try {
    const { start_date, end_date } = req.query;

    let dateFilter = "";
    const params = [];

    if (start_date && end_date) {
      dateFilter = "WHERE created_at >= ? AND created_at <= ?";
      params.push(start_date, end_date);
    }

    // Total payment links
    const [totalLinks] = await pool.query(
      `SELECT COUNT(*) as total FROM payment_links ${dateFilter}`,
      params
    );

    // Paid payment links
    const paidLinksQuery = dateFilter 
      ? `SELECT COUNT(*) as total FROM payment_links WHERE status = 'paid' AND ${dateFilter.replace("WHERE ", "")}`
      : `SELECT COUNT(*) as total FROM payment_links WHERE status = 'paid'`;
    const [paidLinks] = await pool.query(paidLinksQuery, dateFilter ? params : []);

    // Total transactions
    const [totalTransactions] = await pool.query(
      `SELECT COUNT(*) as total FROM transactions ${dateFilter}`,
      params
    );

    // Successful transactions
    const successTransactionsQuery = dateFilter
      ? `SELECT COUNT(*) as total FROM transactions WHERE status IN ('captured', 'authorized') AND ${dateFilter.replace("WHERE ", "")}`
      : `SELECT COUNT(*) as total FROM transactions WHERE status IN ('captured', 'authorized')`;
    const [successTransactions] = await pool.query(successTransactionsQuery, dateFilter ? params : []);

    // Total revenue
    const revenueQuery = dateFilter
      ? `SELECT COALESCE(SUM(amount), 0) as total FROM transactions WHERE status IN ('captured', 'authorized') AND ${dateFilter.replace("WHERE ", "")}`
      : `SELECT COALESCE(SUM(amount), 0) as total FROM transactions WHERE status IN ('captured', 'authorized')`;
    const [revenue] = await pool.query(revenueQuery, dateFilter ? params : []);

    // Total refunds
    const refundsQuery = dateFilter
      ? `SELECT COUNT(*) as total, COALESCE(SUM(amount), 0) as amount FROM refunds WHERE status = 'processed' AND ${dateFilter.replace("WHERE ", "")}`
      : `SELECT COUNT(*) as total, COALESCE(SUM(amount), 0) as amount FROM refunds WHERE status = 'processed'`;
    const [refunds] = await pool.query(refundsQuery, dateFilter ? params : []);

    // Payment method breakdown
    const paymentMethodsQuery = dateFilter
      ? `SELECT payment_method, COUNT(*) as count, SUM(amount) as total 
         FROM transactions 
         WHERE status IN ('captured', 'authorized') AND ${dateFilter.replace("WHERE ", "")}
         GROUP BY payment_method`
      : `SELECT payment_method, COUNT(*) as count, SUM(amount) as total 
         FROM transactions 
         WHERE status IN ('captured', 'authorized')
         GROUP BY payment_method`;
    const [paymentMethods] = await pool.query(paymentMethodsQuery, dateFilter ? params : []);

    return res.json({
      success: true,
      data: {
        payment_links: {
          total: totalLinks[0].total,
          paid: paidLinks[0].total,
        },
        transactions: {
          total: totalTransactions[0].total,
          successful: successTransactions[0].total,
        },
        revenue: {
          total: parseFloat(revenue[0].total || 0),
        },
        refunds: {
          count: refunds[0].total,
          amount: parseFloat(refunds[0].amount || 0),
        },
        payment_methods: paymentMethods,
      },
    });
  } catch (error) {
    console.error("❌ Error fetching payment statistics:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch payment statistics",
    });
  }
};
