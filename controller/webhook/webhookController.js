import {
  verifyWebhookSignature,
  syncPaymentLinkStatus,
} from "../../services/paymentLinkService.js";
import pool from "../../config.js";
import { razorpay } from "../../services/paymentLinkService.js";

/**
 * Razorpay Webhook Handler
 * Handles payment events securely with signature verification
 */
export const handleRazorpayWebhook = async (req, res) => {
  const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
  const signature = req.headers["x-razorpay-signature"];

  // Get raw body for signature verification
  // req.body is already parsed as Buffer when using express.raw()
  const webhookBody = req.body.toString();

  // Parse JSON body
  let event;
  try {
    event = JSON.parse(webhookBody);
  } catch (error) {
    console.error("❌ Invalid JSON in webhook body");
    return res.status(400).json({
      success: false,
      message: "Invalid JSON in webhook body",
    });
  }

  // Verify webhook signature
  if (!verifyWebhookSignature(webhookBody, signature, webhookSecret)) {
    console.error("❌ Invalid webhook signature");
    return res.status(401).json({
      success: false,
      message: "Invalid webhook signature",
    });
  }
  const eventType = event.event;
  const entity = event.payload?.payment_link?.entity || event.payload?.payment?.entity || event.payload?.refund?.entity;

  console.log(`📨 Webhook received: ${eventType}`);

  // Store webhook event for audit trail
  let webhookEventId;
  try {
    const [result] = await pool.query(
      `INSERT INTO webhook_events (
        event_id, event_type, entity_type, entity_id, payment_id, payment_link_id,
        order_id, amount, status, payload, signature_verified
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        event.id || `evt_${Date.now()}`,
        eventType,
        entity?.entity || "unknown",
        entity?.id || "unknown",
        entity?.id || null,
        entity?.id || null,
        null,
        entity?.amount ? entity.amount / 100 : null,
        entity?.status || null,
        JSON.stringify(event),
        true,
      ]
    );
    webhookEventId = result.insertId;
  } catch (error) {
    console.error("❌ Error storing webhook event:", error);
    // Continue processing even if storage fails
  }

  try {
    // Handle different event types
    switch (eventType) {
      case "payment_link.paid":
        await handlePaymentLinkPaid(event.payload);
        break;

      case "payment_link.expired":
        await handlePaymentLinkExpired(event.payload);
        break;

      case "payment_link.cancelled":
        await handlePaymentLinkCancelled(event.payload);
        break;

      case "payment.captured":
        await handlePaymentCaptured(event.payload);
        break;

      case "payment.failed":
        await handlePaymentFailed(event.payload);
        break;

      case "refund.created":
        await handleRefundCreated(event.payload);
        break;

      case "refund.processed":
        await handleRefundProcessed(event.payload);
        break;

      default:
        console.log(`⚠️ Unhandled webhook event: ${eventType}`);
    }

    // Mark webhook as processed
    if (webhookEventId) {
      await pool.query(
        `UPDATE webhook_events SET processed = true, processed_at = CURRENT_TIMESTAMP WHERE id = ?`,
        [webhookEventId]
      );
    }

    return res.json({ success: true, message: "Webhook processed" });
  } catch (error) {
    console.error(`❌ Error processing webhook ${eventType}:`, error);

    // Mark webhook with error
    if (webhookEventId) {
      await pool.query(
        `UPDATE webhook_events SET error_message = ? WHERE id = ?`,
        [error.message, webhookEventId]
      );
    }

    return res.status(500).json({
      success: false,
      message: "Webhook processing failed",
    });
  }
};

/**
 * Handle payment_link.paid event
 */
async function handlePaymentLinkPaid(payload) {
  const paymentLink = payload.payment_link.entity;
  const payment = payload.payment.entity;

  console.log(`✅ Payment link paid: ${paymentLink.id}`);

  // Update payment link status
  await pool.query(
    `UPDATE payment_links 
     SET status = 'paid', updated_at = CURRENT_TIMESTAMP
     WHERE razorpay_payment_link_id = ?`,
    [paymentLink.id]
  );

  // Get payment link from database
  const [paymentLinks] = await pool.query(
    `SELECT * FROM payment_links WHERE razorpay_payment_link_id = ?`,
    [paymentLink.id]
  );

  if (paymentLinks.length === 0) {
    console.error(`❌ Payment link not found in DB: ${paymentLink.id}`);
    return;
  }

  const dbPaymentLink = paymentLinks[0];

  // Create or update transaction
  await createOrUpdateTransaction(payment, dbPaymentLink.order_id, dbPaymentLink.id);

  // Update order status if order exists
  if (dbPaymentLink.order_id) {
    await pool.query(
      `UPDATE orders 
       SET payment_status = 'paid', status = 'processing', updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [dbPaymentLink.order_id]
    );
  }
}

/**
 * Handle payment_link.expired event
 */
async function handlePaymentLinkExpired(payload) {
  const paymentLink = payload.payment_link.entity;

  console.log(`⏰ Payment link expired: ${paymentLink.id}`);

  await pool.query(
    `UPDATE payment_links 
     SET status = 'expired', expired_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
     WHERE razorpay_payment_link_id = ?`,
    [paymentLink.id]
  );
}

/**
 * Handle payment_link.cancelled event
 */
async function handlePaymentLinkCancelled(payload) {
  const paymentLink = payload.payment_link.entity;

  console.log(`🚫 Payment link cancelled: ${paymentLink.id}`);

  await pool.query(
    `UPDATE payment_links 
     SET status = 'cancelled', updated_at = CURRENT_TIMESTAMP
     WHERE razorpay_payment_link_id = ?`,
    [paymentLink.id]
  );
}

/**
 * Handle payment.captured event
 */
async function handlePaymentCaptured(payload) {
  const payment = payload.payment.entity;

  console.log(`💰 Payment captured: ${payment.id}`);

  // Update transaction
  await pool.query(
    `UPDATE transactions 
     SET status = 'captured', captured = true, updated_at = CURRENT_TIMESTAMP
     WHERE razorpay_payment_id = ?`,
    [payment.id]
  );
}

/**
 * Handle payment.failed event
 */
async function handlePaymentFailed(payload) {
  const payment = payload.payment.entity;

  console.log(`❌ Payment failed: ${payment.id}`);

  // Update transaction
  await pool.query(
    `UPDATE transactions 
     SET status = 'failed', 
         error_code = ?, 
         error_description = ?, 
         error_reason = ?,
         error_source = ?,
         error_step = ?,
         updated_at = CURRENT_TIMESTAMP
     WHERE razorpay_payment_id = ?`,
    [
      payment.error_code || null,
      payment.error_description || null,
      payment.error_reason || null,
      payment.error_source || null,
      payment.error_step || null,
      payment.id,
    ]
  );

  // Update order status if exists
  const [transactions] = await pool.query(
    `SELECT order_id FROM transactions WHERE razorpay_payment_id = ?`,
    [payment.id]
  );

  if (transactions.length > 0 && transactions[0].order_id) {
    await pool.query(
      `UPDATE orders 
       SET payment_status = 'failed', updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [transactions[0].order_id]
    );
  }
}

/**
 * Handle refund.created event
 */
async function handleRefundCreated(payload) {
  const refund = payload.refund.entity;

  console.log(`🔄 Refund created: ${refund.id}`);

  // Refund record should already exist, just update status
  await pool.query(
    `UPDATE refunds 
     SET status = 'pending', updated_at = CURRENT_TIMESTAMP
     WHERE razorpay_refund_id = ?`,
    [refund.id]
  );
}

/**
 * Handle refund.processed event
 */
async function handleRefundProcessed(payload) {
  const refund = payload.refund.entity;

  console.log(`✅ Refund processed: ${refund.id}`);

  await pool.query(
    `UPDATE refunds 
     SET status = 'processed', updated_at = CURRENT_TIMESTAMP
     WHERE razorpay_refund_id = ?`,
    [refund.id]
  );
}

/**
 * Create or update transaction record
 */
async function createOrUpdateTransaction(payment, orderId, paymentLinkId) {
  try {
    // Check if transaction already exists
    const [existing] = await pool.query(
      `SELECT id FROM transactions WHERE razorpay_payment_id = ?`,
      [payment.id]
    );

    const transactionData = {
      razorpay_payment_id: payment.id,
      razorpay_order_id: payment.order_id || null,
      payment_link_id: paymentLinkId || null,
      order_id: orderId || null,
      site_user_id: null, // Will be set from payment link if available
      amount: payment.amount ? payment.amount / 100 : 0,
      currency: payment.currency || "INR",
      status: payment.status || "pending",
      payment_method: payment.method || null,
      payment_method_type: payment.method || null,
      bank: payment.bank || null,
      wallet: payment.wallet || null,
      vpa: payment.vpa || null,
      card_id: payment.card_id || null,
      invoice_id: payment.invoice_id || null,
      international: payment.international || false,
      amount_refunded: payment.amount_refunded ? payment.amount_refunded / 100 : 0,
      refund_status: payment.amount_refunded === payment.amount ? "full" :
                     payment.amount_refunded > 0 ? "partial" : "null",
      captured: payment.captured || false,
      description: payment.description || null,
      fee: payment.fee ? payment.fee / 100 : 0,
      tax: payment.tax ? payment.tax / 100 : 0,
      error_code: payment.error_code || null,
      error_description: payment.error_description || null,
      error_reason: payment.error_reason || null,
      error_source: payment.error_source || null,
      error_step: payment.error_step || null,
      razorpay_created_at: payment.created_at || null,
      metadata: payment.notes ? JSON.stringify(payment.notes) : null,
    };

    // Get user_id from payment link if available
    if (paymentLinkId) {
      const [paymentLinks] = await pool.query(
        `SELECT site_user_id FROM payment_links WHERE id = ?`,
        [paymentLinkId]
      );
      if (paymentLinks.length > 0) {
        transactionData.site_user_id = paymentLinks[0].site_user_id;
      }
    }

    if (existing.length > 0) {
      // Update existing transaction
      await pool.query(
        `UPDATE transactions SET 
          razorpay_order_id = ?, payment_link_id = ?, order_id = ?,
          amount = ?, status = ?, payment_method = ?, payment_method_type = ?,
          bank = ?, wallet = ?, vpa = ?, card_id = ?, invoice_id = ?,
          international = ?, amount_refunded = ?, refund_status = ?,
          captured = ?, description = ?, fee = ?, tax = ?,
          error_code = ?, error_description = ?, error_reason = ?,
          error_source = ?, error_step = ?, razorpay_created_at = ?,
          metadata = ?, updated_at = CURRENT_TIMESTAMP
         WHERE razorpay_payment_id = ?`,
        [
          transactionData.razorpay_order_id,
          transactionData.payment_link_id,
          transactionData.order_id,
          transactionData.amount,
          transactionData.status,
          transactionData.payment_method,
          transactionData.payment_method_type,
          transactionData.bank,
          transactionData.wallet,
          transactionData.vpa,
          transactionData.card_id,
          transactionData.invoice_id,
          transactionData.international,
          transactionData.amount_refunded,
          transactionData.refund_status,
          transactionData.captured,
          transactionData.description,
          transactionData.fee,
          transactionData.tax,
          transactionData.error_code,
          transactionData.error_description,
          transactionData.error_reason,
          transactionData.error_source,
          transactionData.error_step,
          transactionData.razorpay_created_at,
          transactionData.metadata,
          payment.id,
        ]
      );
    } else {
      // Create new transaction
      await pool.query(
        `INSERT INTO transactions (
          razorpay_payment_id, razorpay_order_id, payment_link_id, order_id,
          site_user_id, amount, currency, status, payment_method, payment_method_type,
          bank, wallet, vpa, card_id, invoice_id, international,
          amount_refunded, refund_status, captured, description, fee, tax,
          error_code, error_description, error_reason, error_source, error_step,
          razorpay_created_at, metadata
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          transactionData.razorpay_payment_id,
          transactionData.razorpay_order_id,
          transactionData.payment_link_id,
          transactionData.order_id,
          transactionData.site_user_id,
          transactionData.amount,
          transactionData.currency,
          transactionData.status,
          transactionData.payment_method,
          transactionData.payment_method_type,
          transactionData.bank,
          transactionData.wallet,
          transactionData.vpa,
          transactionData.card_id,
          transactionData.invoice_id,
          transactionData.international,
          transactionData.amount_refunded,
          transactionData.refund_status,
          transactionData.captured,
          transactionData.description,
          transactionData.fee,
          transactionData.tax,
          transactionData.error_code,
          transactionData.error_description,
          transactionData.error_reason,
          transactionData.error_source,
          transactionData.error_step,
          transactionData.razorpay_created_at,
          transactionData.metadata,
        ]
      );
    }
  } catch (error) {
    console.error("❌ Error creating/updating transaction:", error);
    throw error;
  }
}
