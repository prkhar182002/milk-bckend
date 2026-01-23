import Razorpay from "razorpay";
import pool from "../config.js";
import crypto from "crypto";

// Initialize Razorpay instance
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

/**
 * Create a UPI-first Razorpay Payment Link
 * @param {Object} params - Payment link parameters
 * @returns {Promise<Object>} Payment link details
 */
export async function createPaymentLink(params) {
  const {
    amount,
    currency = "INR",
    description,
    customer,
    orderId = null,
    userId,
    expireBy = null,
    notes = null,
    metadata = {},
  } = params;

  try {
    // Calculate expire_by timestamp if provided (in seconds from now)
    let expireByTimestamp = null;
    if (expireBy) {
      expireByTimestamp = Math.floor(Date.now() / 1000) + expireBy;
    }

    // Prepare payment link options with UPI as primary method
    const paymentLinkOptions = {
      amount: Math.round(amount * 100), // Convert to paise
      currency: currency.toUpperCase(),
      description: description || "Payment for order",
      customer: {
        name: customer?.name || "Customer",
        email: customer?.email || null,
        contact: customer?.contact || null,
      },
      notify: {
        sms: true,
        email: true,
      },
      reminder_enable: true,
      expire_by: expireByTimestamp,
      notes: notes ? { notes } : {},
      ...metadata,
    };

    // Create payment link via Razorpay API
    const paymentLink = await razorpay.paymentLink.create(paymentLinkOptions);

    // Store payment link in database
    const [result] = await pool.query(
      `INSERT INTO payment_links (
        razorpay_payment_link_id, order_id, site_user_id, amount, currency,
        description, customer_name, customer_email, customer_contact,
        payment_link_url, short_url, status, expire_by, expired_at, notes, metadata
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        paymentLink.id,
        orderId,
        userId,
        amount,
        currency,
        description || null,
        customer?.name || null,
        customer?.email || null,
        customer?.contact || null,
        paymentLink.short_url || paymentLink.url,
        paymentLink.short_url || null,
        "created",
        expireByTimestamp,
        expireByTimestamp ? new Date(expireByTimestamp * 1000) : null,
        notes,
        JSON.stringify(metadata),
      ]
    );

    const paymentLinkId = result.insertId;

    // Log payment link creation
    console.log(`✅ Payment link created: ${paymentLink.id} for user ${userId}`);

    return {
      id: paymentLinkId,
      razorpay_payment_link_id: paymentLink.id,
      payment_link_url: paymentLink.short_url || paymentLink.url,
      short_url: paymentLink.short_url,
      amount,
      currency,
      status: "created",
      order_id: orderId,
      created_at: new Date(),
    };
  } catch (error) {
    console.error("❌ Error creating payment link:", error);
    throw new Error(
      `Failed to create payment link: ${error.message || error.error?.description || "Unknown error"}`
    );
  }
}

/**
 * Get payment link details by ID
 */
export async function getPaymentLinkById(paymentLinkId) {
  try {
    const [rows] = await pool.query(
      `SELECT * FROM payment_links WHERE id = ? OR razorpay_payment_link_id = ?`,
      [paymentLinkId, paymentLinkId]
    );

    if (rows.length === 0) {
      return null;
    }

    return rows[0];
  } catch (error) {
    console.error("❌ Error fetching payment link:", error);
    throw error;
  }
}

/**
 * Get payment link details from Razorpay and sync with database
 */
export async function syncPaymentLinkStatus(razorpayPaymentLinkId) {
  try {
    // Fetch from Razorpay
    const paymentLink = await razorpay.paymentLink.fetch(razorpayPaymentLinkId);

    // Update database
    const status = paymentLink.status === "paid" ? "paid" : 
                   paymentLink.status === "expired" ? "expired" :
                   paymentLink.status === "cancelled" ? "cancelled" : "created";

    await pool.query(
      `UPDATE payment_links 
       SET status = ?, updated_at = CURRENT_TIMESTAMP
       WHERE razorpay_payment_link_id = ?`,
      [status, razorpayPaymentLinkId]
    );

    return paymentLink;
  } catch (error) {
    console.error("❌ Error syncing payment link:", error);
    throw error;
  }
}

/**
 * Cancel a payment link
 */
export async function cancelPaymentLink(razorpayPaymentLinkId) {
  try {
    // Cancel via Razorpay API
    const paymentLink = await razorpay.paymentLink.cancel(razorpayPaymentLinkId);

    // Update database
    await pool.query(
      `UPDATE payment_links 
       SET status = 'cancelled', updated_at = CURRENT_TIMESTAMP
       WHERE razorpay_payment_link_id = ?`,
      [razorpayPaymentLinkId]
    );

    return paymentLink;
  } catch (error) {
    console.error("❌ Error cancelling payment link:", error);
    throw error;
  }
}

/**
 * Create a refund for a payment
 */
export async function createRefund(params) {
  const { paymentId, amount, speed = "normal", notes = null, receipt = null } = params;

  try {
    const refundOptions = {
      amount: Math.round(amount * 100), // Convert to paise
      speed: speed, // 'normal' or 'optimum'
      notes: notes ? { notes } : {},
      receipt: receipt || undefined,
    };

    // Create refund via Razorpay
    const refund = await razorpay.payments.refund(paymentId, refundOptions);

    // Get transaction details
    const [transactions] = await pool.query(
      `SELECT id, order_id FROM transactions WHERE razorpay_payment_id = ?`,
      [paymentId]
    );

    if (transactions.length > 0) {
      const transaction = transactions[0];

      // Store refund in database
      await pool.query(
        `INSERT INTO refunds (
          razorpay_refund_id, transaction_id, payment_id, order_id,
          amount, currency, status, speed, notes, receipt, razorpay_created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          refund.id,
          transaction.id,
          paymentId,
          transaction.order_id,
          amount,
          "INR",
          refund.status === "processed" ? "processed" : "pending",
          speed,
          notes,
          receipt,
          refund.created_at,
        ]
      );

      // Update transaction refund status
      const refundAmount = parseFloat(amount);
      const [txn] = await pool.query(
        `SELECT amount, amount_refunded FROM transactions WHERE id = ?`,
        [transaction.id]
      );

      if (txn.length > 0) {
        const totalRefunded = parseFloat(txn[0].amount_refunded || 0) + refundAmount;
        const totalAmount = parseFloat(txn[0].amount);
        const refundStatus =
          totalRefunded >= totalAmount ? "full" : totalRefunded > 0 ? "partial" : "null";

        await pool.query(
          `UPDATE transactions 
           SET amount_refunded = ?, refund_status = ?, 
               status = CASE WHEN ? >= amount THEN 'refunded' 
                             WHEN amount_refunded > 0 THEN 'partially_refunded' 
                             ELSE status END,
               updated_at = CURRENT_TIMESTAMP
           WHERE id = ?`,
          [totalRefunded, refundStatus, totalRefunded, transaction.id]
        );

        // Update order payment status if fully refunded
        if (refundStatus === "full" && transaction.order_id) {
          await pool.query(
            `UPDATE orders 
             SET payment_status = 'refunded', status = 'refunded', updated_at = CURRENT_TIMESTAMP
             WHERE id = ?`,
            [transaction.order_id]
          );
        }
      }
    }

    return refund;
  } catch (error) {
    console.error("❌ Error creating refund:", error);
    throw new Error(
      `Failed to create refund: ${error.message || error.error?.description || "Unknown error"}`
    );
  }
}

/**
 * Verify Razorpay webhook signature
 */
export function verifyWebhookSignature(webhookBody, signature, secret) {
  try {
    if (!secret || !signature || !webhookBody) return false;
    const expectedSignature = crypto
      .createHmac("sha256", secret)
      .update(webhookBody)
      .digest("hex");

    const sigBuf = Buffer.from(String(signature));
    const expectedBuf = Buffer.from(expectedSignature);
    if (sigBuf.length !== expectedBuf.length) return false;
    return crypto.timingSafeEqual(sigBuf, expectedBuf);
  } catch (error) {
    console.error("❌ Error verifying webhook signature:", error);
    return false;
  }
}

export { razorpay };
