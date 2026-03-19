import {
  verifyWebhookSignature,
  syncPaymentLinkStatus,
} from "../../services/paymentLinkService.js";
import pool from "../../config.js";
import { razorpay } from "../../services/paymentLinkService.js";
import crypto from "crypto";

/**
 * Razorpay Webhook Handler
 * Handles payment events securely with signature verification
 */
export const handleRazorpayWebhook = async (req, res) => {
  const timestamp = new Date().toISOString();
  console.log(`\n${"=".repeat(80)}`);
  console.log(`🔔 WEBHOOK REQUEST RECEIVED at ${timestamp}`);
  console.log(`${"=".repeat(80)}`);
  console.log(`📍 Endpoint: ${req.method} ${req.path || req.url}`);
  console.log(`🌐 IP Address: ${req.ip || req.connection.remoteAddress}`);
  console.log(`📋 Headers:`, JSON.stringify(req.headers, null, 2));

  const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
  const signature = req.headers["x-razorpay-signature"];

  // Get raw body for signature verification
  // req.body is already parsed as Buffer when using express.raw()
  const webhookBody = req.body.toString();
  
  console.log(`📦 Raw Body Length: ${webhookBody.length} characters`);
  console.log(`🔐 Signature Header: ${signature ? "Present" : "MISSING"}`);
  if (signature) {
    console.log(`🔐 Signature Value: ${signature.substring(0, 20)}... (truncated for security)`);
  }
  console.log(`🔑 Webhook Secret: ${webhookSecret ? "Configured" : "NOT CONFIGURED"}`);
  if (webhookSecret) {
    console.log(`🔑 Webhook Secret Length: ${webhookSecret.length} characters`);
    console.log(`🔑 Webhook Secret Preview: ${webhookSecret.substring(0, 10)}...${webhookSecret.substring(webhookSecret.length - 5)} (masked)`);
    console.log(`🔑 Webhook Secret Type: ${typeof webhookSecret}`);
  } else {
    console.error(`❌ RAZORPAY_WEBHOOK_SECRET is undefined or empty`);
    console.error(`❌ Available env vars with 'WEBHOOK':`, Object.keys(process.env).filter(key => key.includes('WEBHOOK')));
    console.error(`❌ Available env vars with 'RAZORPAY':`, Object.keys(process.env).filter(key => key.includes('RAZORPAY')));
  }

  if (!webhookSecret) {
    console.error("❌ RAZORPAY_WEBHOOK_SECRET not configured");
    console.log(`${"=".repeat(80)}\n`);
    return res.status(500).json({
      success: false,
      message: "Webhook secret not configured",
    });
  }

  // Parse JSON body
  let event;
  try {
    event = JSON.parse(webhookBody);
    console.log(`✅ JSON Parsed Successfully`);
    console.log(`📄 Event Structure:`, {
      event: event.event,
      contains: {
        payment_link: !!event.payload?.payment_link,
        payment: !!event.payload?.payment,
        refund: !!event.payload?.refund,
      }
    });
  } catch (error) {
    console.error("❌ Invalid JSON in webhook body");
    console.error("❌ Parse Error:", error.message);
    console.log(`📦 Body Preview (first 500 chars):`, webhookBody.substring(0, 500));
    console.log(`${"=".repeat(80)}\n`);
    return res.status(400).json({
      success: false,
      message: "Invalid JSON in webhook body",
    });
  }

  // Verify webhook signature
  const signatureValid = verifyWebhookSignature(webhookBody, signature, webhookSecret);
  console.log(`🔐 Signature Verification: ${signatureValid ? "✅ VALID" : "❌ INVALID"}`);
  
  if (!signatureValid) {
    console.error("❌ Invalid webhook signature");
    console.error("❌ Expected signature based on body and secret");
    console.log(`📦 Body (first 200 chars):`, webhookBody.substring(0, 200));
    console.log(`${"=".repeat(80)}\n`);
    return res.status(401).json({
      success: false,
      message: "Invalid webhook signature",
    });
  }

  const eventType = event.event;
  const paymentLinkEntity = event.payload?.payment_link?.entity || null;
  const paymentEntity = event.payload?.payment?.entity || null;
  const refundEntity = event.payload?.refund?.entity || null;
  const entity = paymentLinkEntity || paymentEntity || refundEntity;

  console.log(`📨 Webhook Event Type: ${eventType}`);
  console.log(`🆔 Event ID: ${event.id || "N/A"}`);
  if (paymentEntity) {
    console.log(`💳 Payment ID: ${paymentEntity.id || "N/A"}`);
    console.log(`💰 Payment Amount: ${paymentEntity.amount ? paymentEntity.amount / 100 : "N/A"}`);
    console.log(`📊 Payment Status: ${paymentEntity.status || "N/A"}`);
  }
  if (paymentLinkEntity) {
    console.log(`🔗 Payment Link ID: ${paymentLinkEntity.id || "N/A"}`);
  }
  if (refundEntity) {
    console.log(`🔄 Refund ID: ${refundEntity.id || "N/A"}`);
  }

  // Store webhook event for audit trail
  let webhookEventId;
  try {
    console.log(`💾 Storing webhook event in database...`);
    const headerEventId =
      req.headers["x-razorpay-event-id"] ||
      req.headers["x-razorpay-eventid"] ||
      req.headers["x-razorpay-webhook-id"];
    const stableBodyId = crypto
      .createHash("sha256")
      .update(webhookBody)
      .digest("hex")
      .slice(0, 32);
    const eventId = event.id || headerEventId || `evt_${stableBodyId}`;

    const entityType = entity?.entity || (paymentLinkEntity ? "payment_link" : paymentEntity ? "payment" : refundEntity ? "refund" : "unknown");
    const entityId = entity?.id || "unknown";
    const paymentId = paymentEntity?.id || null;
    const paymentLinkId = paymentLinkEntity?.id || null;
    const amount =
      typeof entity?.amount === "number" ? entity.amount / 100 : null;
    const status = entity?.status || null;

    console.log(`📝 Event Details for DB:`, {
      eventId,
      eventType,
      entityType,
      entityId,
      paymentId,
      paymentLinkId,
      amount,
      status,
    });

    const [result] = await pool.query(
      `INSERT INTO webhook_events (
        event_id, event_type, entity_type, entity_id, payment_id, payment_link_id,
        order_id, amount, status, payload, signature_verified
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        eventId,
        eventType,
        entityType,
        entityId,
        paymentId,
        paymentLinkId,
        null, // local order_id (only available for payment_links flow right now)
        amount,
        status,
        JSON.stringify(event),
        true,
      ]
    );
    webhookEventId = result.insertId;
    console.log(`✅ Webhook event stored in database with ID: ${webhookEventId}`);
  } catch (error) {
    console.error("❌ Error storing webhook event:", error);
    console.error("❌ Error details:", {
      message: error.message,
      code: error.code,
      sqlState: error.sqlState,
    });
    // Continue processing even if storage fails
  }

  try {
    console.log(`🔄 Processing webhook event: ${eventType}`);
    
    // Handle different event types
    switch (eventType) {
      case "payment_link.paid":
        console.log(`📞 Calling handlePaymentLinkPaid...`);
        await handlePaymentLinkPaid(event.payload);
        console.log(`✅ handlePaymentLinkPaid completed`);
        break;

      case "payment_link.expired":
        console.log(`📞 Calling handlePaymentLinkExpired...`);
        await handlePaymentLinkExpired(event.payload);
        console.log(`✅ handlePaymentLinkExpired completed`);
        break;

      case "payment_link.cancelled":
        console.log(`📞 Calling handlePaymentLinkCancelled...`);
        await handlePaymentLinkCancelled(event.payload);
        console.log(`✅ handlePaymentLinkCancelled completed`);
        break;

      case "payment.authorized":
        console.log(`📞 Calling handlePaymentAuthorized...`);
        await handlePaymentAuthorized(event.payload);
        console.log(`✅ handlePaymentAuthorized completed`);
        break;

      case "payment.captured":
        console.log(`📞 Calling handlePaymentCaptured...`);
        await handlePaymentCaptured(event.payload);
        console.log(`✅ handlePaymentCaptured completed`);
        break;

      case "payment.failed":
        console.log(`📞 Calling handlePaymentFailed...`);
        await handlePaymentFailed(event.payload);
        console.log(`✅ handlePaymentFailed completed`);
        break;

      case "order.paid":
        console.log(`📞 Calling handleOrderPaid...`);
        await handleOrderPaid(event.payload);
        console.log(`✅ handleOrderPaid completed`);
        break;

      case "refund.created":
        console.log(`📞 Calling handleRefundCreated...`);
        await handleRefundCreated(event.payload);
        console.log(`✅ handleRefundCreated completed`);
        break;

      case "refund.processed":
        console.log(`📞 Calling handleRefundProcessed...`);
        await handleRefundProcessed(event.payload);
        console.log(`✅ handleRefundProcessed completed`);
        break;

      default:
        console.log(`⚠️ Unhandled webhook event: ${eventType}`);
        console.log(`⚠️ Full event payload:`, JSON.stringify(event, null, 2));
    }

    // Mark webhook as processed
    if (webhookEventId) {
      await pool.query(
        `UPDATE webhook_events SET processed = true, processed_at = CURRENT_TIMESTAMP WHERE id = ?`,
        [webhookEventId]
      );
      console.log(`✅ Webhook event marked as processed in database`);
    }

    console.log(`✅ Webhook processing completed successfully`);
    console.log(`${"=".repeat(80)}\n`);
    
    return res.json({ success: true, message: "Webhook processed" });
  } catch (error) {
    console.error(`❌ Error processing webhook ${eventType}:`, error);
    console.error(`❌ Error stack:`, error.stack);

    // Mark webhook with error
    if (webhookEventId) {
      await pool.query(
        `UPDATE webhook_events SET error_message = ?, processed = false WHERE id = ?`,
        [error.message, webhookEventId]
      );
      console.log(`❌ Webhook event marked with error in database`);
    }

    console.log(`${"=".repeat(80)}\n`);
    
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
 * Handle payment.authorized event
 */
async function handlePaymentAuthorized(payload) {
  const payment = payload.payment.entity;

  console.log(`\n${"-".repeat(80)}`);
  console.log(`💳 Processing payment.authorized event`);
  console.log(`💳 Payment ID: ${payment.id}`);
  console.log(`📊 Payment Status: ${payment.status}`);
  console.log(`💰 Amount: ${payment.amount ? payment.amount / 100 : "N/A"}`);
  console.log(`🔑 Razorpay Order ID: ${payment.order_id || "N/A"}`);

  // Check if transaction exists
  console.log(`🔍 Checking for existing transaction with payment_id: ${payment.id}`);
  const [existingTransactions] = await pool.query(
    `SELECT id, order_id, site_user_id, razorpay_order_id FROM transactions WHERE razorpay_payment_id = ?`,
    [payment.id]
  );

  console.log(`📊 Found ${existingTransactions.length} existing transaction(s)`);

  if (existingTransactions.length > 0) {
    const transaction = existingTransactions[0];
    console.log(`📝 Existing Transaction Details:`, {
      id: transaction.id,
      order_id: transaction.order_id,
      site_user_id: transaction.site_user_id,
      razorpay_order_id: transaction.razorpay_order_id,
    });
    
    // Update existing transaction status to authorized
    console.log(`🔄 Updating transaction status to 'authorized'...`);
    await pool.query(
      `UPDATE transactions 
       SET status = 'authorized', updated_at = CURRENT_TIMESTAMP
       WHERE razorpay_payment_id = ?`,
      [payment.id]
    );
    console.log(`✅ Transaction updated successfully`);
  } else {
    console.log(`⚠️ No existing transaction found. Will be created when payment is captured or verifyOrder runs.`);
  }
  console.log(`${"-".repeat(80)}\n`);
}

/**
 * Handle payment.captured event
 */
async function handlePaymentCaptured(payload) {
  const payment = payload.payment.entity;

  console.log(`\n${"-".repeat(80)}`);
  console.log(`💰 Processing payment.captured event`);
  console.log(`💳 Payment ID: ${payment.id}`);
  console.log(`📊 Payment Status: ${payment.status}`);
  console.log(`💰 Amount: ${payment.amount ? payment.amount / 100 : "N/A"}`);
  console.log(`🔑 Razorpay Order ID: ${payment.order_id || "N/A"}`);

  // Check if transaction exists
  console.log(`🔍 Checking for existing transaction with payment_id: ${payment.id}`);
  const [existingTransactions] = await pool.query(
    `SELECT id, order_id, site_user_id, razorpay_order_id FROM transactions WHERE razorpay_payment_id = ?`,
    [payment.id]
  );

  console.log(`📊 Found ${existingTransactions.length} existing transaction(s)`);

  if (existingTransactions.length > 0) {
    const transaction = existingTransactions[0];
    console.log(`📝 Existing Transaction Details:`, {
      id: transaction.id,
      order_id: transaction.order_id,
      site_user_id: transaction.site_user_id,
      razorpay_order_id: transaction.razorpay_order_id,
    });
    
    // Update existing transaction
    console.log(`🔄 Updating transaction status to 'captured'...`);
    await pool.query(
      `UPDATE transactions 
       SET status = 'captured', captured = true, updated_at = CURRENT_TIMESTAMP
       WHERE razorpay_payment_id = ?`,
      [payment.id]
    );
    console.log(`✅ Transaction updated successfully`);

    // Update order status if linked to an order
    if (transaction.order_id) {
      console.log(`🔄 Updating order ${transaction.order_id} status...`);
      await pool.query(
        `UPDATE orders 
         SET payment_status = 'paid', status = 'processing', updated_at = CURRENT_TIMESTAMP
         WHERE id = ?`,
        [transaction.order_id]
      );
      console.log(`✅ Order ${transaction.order_id} updated to paid status via webhook`);
    } else if (transaction.razorpay_order_id) {
      console.log(`🔍 Transaction has razorpay_order_id but no order_id. Searching for linked order...`);
      console.log(`🔑 Razorpay Order ID: ${transaction.razorpay_order_id}`);
      
      // Try to find order by razorpay_order_id from transactions table
      // This handles the case where webhook arrives before verifyOrder links the order
      const [ordersByRazorpayOrder] = await pool.query(
        `SELECT o.id FROM orders o
         INNER JOIN transactions t ON t.razorpay_order_id = ?
         WHERE t.razorpay_payment_id = ?
         LIMIT 1`,
        [transaction.razorpay_order_id, payment.id]
      );
      
      console.log(`📊 Found ${ordersByRazorpayOrder.length} order(s) by razorpay_order_id query`);
      
      if (ordersByRazorpayOrder.length > 0) {
        const orderId = ordersByRazorpayOrder[0].id;
        console.log(`✅ Found order ${orderId}. Linking transaction and updating order...`);
        // Update transaction with order_id
        await pool.query(
          `UPDATE transactions SET order_id = ? WHERE razorpay_payment_id = ?`,
          [orderId, payment.id]
        );
        // Update order status
        await pool.query(
          `UPDATE orders 
           SET payment_status = 'paid', status = 'processing', updated_at = CURRENT_TIMESTAMP
           WHERE id = ?`,
          [orderId]
        );
        console.log(`✅ Order ${orderId} found and updated to paid status via webhook (by razorpay_order_id)`);
      } else {
        console.log(`⚠️ No order found by direct razorpay_order_id match. Trying alternative search...`);
        // Try to find order by matching razorpay_order_id in transactions
        // Look for any transaction with this razorpay_order_id that has an order_id
        const [linkedOrders] = await pool.query(
          `SELECT DISTINCT order_id FROM transactions 
           WHERE razorpay_order_id = ? AND order_id IS NOT NULL
           LIMIT 1`,
          [transaction.razorpay_order_id]
        );
        
        console.log(`📊 Found ${linkedOrders.length} linked order(s) by matching razorpay_order_id`);
        
        if (linkedOrders.length > 0) {
          const orderId = linkedOrders[0].order_id;
          console.log(`✅ Found linked order ${orderId}. Updating transaction and order...`);
          // Update this transaction with order_id
          await pool.query(
            `UPDATE transactions SET order_id = ? WHERE razorpay_payment_id = ?`,
            [orderId, payment.id]
          );
          // Update order status
          await pool.query(
            `UPDATE orders 
             SET payment_status = 'paid', status = 'processing', updated_at = CURRENT_TIMESTAMP
             WHERE id = ?`,
            [orderId]
          );
          console.log(`✅ Order ${orderId} found and updated to paid status via webhook (by matching razorpay_order_id)`);
        } else {
          console.log(`⚠️ No order found with matching razorpay_order_id. Order will be linked when verifyOrder runs.`);
        }
      }
    } else {
      console.log(`⚠️ Transaction has no order_id or razorpay_order_id. Will be linked when verifyOrder runs.`);
    }
  } else {
      // Transaction doesn't exist - create it (webhook arrived before verifyOrder)
      // This ensures all payment data is stored even if verifyOrder hasn't run yet
      console.log(`⚠️ No existing transaction found. Creating new transaction record...`);
      const amount = payment.amount ? payment.amount / 100 : 0;
      
      // Try to find site_user_id from existing transactions with same razorpay_order_id
      let siteUserId = null;
      if (payment.order_id) {
        console.log(`🔍 Looking for site_user_id from existing transactions with razorpay_order_id: ${payment.order_id}`);
        const [existingTxns] = await pool.query(
          `SELECT site_user_id FROM transactions 
           WHERE razorpay_order_id = ? AND site_user_id IS NOT NULL
           LIMIT 1`,
          [payment.order_id]
        );
        
        if (existingTxns.length > 0) {
          siteUserId = existingTxns[0].site_user_id;
          console.log(`✅ Found site_user_id: ${siteUserId} from existing transaction`);
        } else {
          // Try to find from orders table using razorpay_order_id
          console.log(`🔍 Looking for site_user_id from orders table...`);
          // Note: We can't directly match razorpay_order_id to orders, but we can check if verifyOrder has run
          // For now, we'll skip creating the transaction and let verifyOrder handle it
          console.log(`⚠️ Cannot find site_user_id. Transaction will be created by verifyOrder.`);
          console.log(`${"-".repeat(80)}\n`);
          return; // Exit early, verifyOrder will create the transaction
        }
      }
      
      if (!siteUserId) {
        console.log(`⚠️ Cannot create transaction without site_user_id. Will be created when verifyOrder runs.`);
        console.log(`${"-".repeat(80)}\n`);
        return; // Exit early, verifyOrder will create the transaction
      }
      
      try {
        console.log(`📝 Creating transaction with data:`, {
          razorpay_payment_id: payment.id,
          razorpay_order_id: payment.order_id || null,
          site_user_id: siteUserId,
          amount,
          currency: payment.currency || "INR",
          status: "captured",
        });
        
        const [result] = await pool.query(
          `INSERT INTO transactions (
            razorpay_payment_id, razorpay_order_id, site_user_id,
            amount, currency, status, captured, payment_method, payment_method_type,
            bank, wallet, vpa, description, razorpay_created_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            payment.id,
            payment.order_id || null,
            siteUserId, // Use found site_user_id
            amount,
            payment.currency || "INR",
            "captured",
            true,
            payment.method || null,
            payment.method || null,
            payment.bank || null,
            payment.wallet || null,
            payment.vpa || null,
            payment.description || null,
            payment.created_at || null,
          ]
        );
        console.log(`✅ Transaction record created with ID: ${result.insertId} for payment ${payment.id}`);
      
      // Try to find and update order if razorpay_order_id matches
      if (payment.order_id) {
        // Look for transactions with this razorpay_order_id that have order_id
        const [linkedOrders] = await pool.query(
          `SELECT DISTINCT order_id FROM transactions 
           WHERE razorpay_order_id = ? AND order_id IS NOT NULL
           LIMIT 1`,
          [payment.order_id]
        );
        
        if (linkedOrders.length > 0) {
          const orderId = linkedOrders[0].order_id;
          // Update this new transaction with order_id
          await pool.query(
            `UPDATE transactions SET order_id = ? WHERE id = ?`,
            [orderId, result.insertId]
          );
          // Update order status
          await pool.query(
            `UPDATE orders 
             SET payment_status = 'paid', status = 'processing', updated_at = CURRENT_TIMESTAMP
             WHERE id = ?`,
            [orderId]
          );
          console.log(`✅ Order ${orderId} found and updated to paid status via webhook (new transaction linked)`);
        } else {
          console.log(`⏳ No order found yet. Will be linked when verifyOrder runs.`);
        }
      }
    } catch (error) {
      console.error(`❌ Error creating transaction for payment ${payment.id}:`, error);
      console.error(`❌ Error details:`, {
        message: error.message,
        code: error.code,
        sqlState: error.sqlState,
      });
    }
    console.log(`${"-".repeat(80)}\n`);
  }
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
 * Handle order.paid event
 */
async function handleOrderPaid(payload) {
  const payment = payload.payment?.entity;
  const order = payload.order?.entity;

  console.log(`\n${"-".repeat(80)}`);
  console.log(`✅ Processing order.paid event`);
  if (order) {
    console.log(`📦 Razorpay Order ID: ${order.id}`);
    console.log(`💰 Order Amount: ${order.amount ? order.amount / 100 : "N/A"}`);
    console.log(`📊 Order Status: ${order.status}`);
  }
  if (payment) {
    console.log(`💳 Payment ID: ${payment.id}`);
    console.log(`📊 Payment Status: ${payment.status}`);
  }

  // Find our local order by matching razorpay_order_id in transactions
  if (order && payment) {
    console.log(`🔍 Looking for local order linked to Razorpay order: ${order.id}`);
    
    // Find transaction with this razorpay_order_id
    const [transactions] = await pool.query(
      `SELECT order_id, site_user_id FROM transactions 
       WHERE razorpay_order_id = ? AND order_id IS NOT NULL
       LIMIT 1`,
      [order.id]
    );

    if (transactions.length > 0) {
      const localOrderId = transactions[0].order_id;
      console.log(`✅ Found local order ${localOrderId}. Updating status...`);
      
      // Update order status
      await pool.query(
        `UPDATE orders 
         SET payment_status = 'paid', status = 'processing', updated_at = CURRENT_TIMESTAMP
         WHERE id = ?`,
        [localOrderId]
      );
      console.log(`✅ Order ${localOrderId} updated to paid status via order.paid webhook`);
    } else {
      console.log(`⚠️ No local order found for Razorpay order ${order.id}. Will be linked when verifyOrder runs.`);
    }
  }
  console.log(`${"-".repeat(80)}\n`);
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
