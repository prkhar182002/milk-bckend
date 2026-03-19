import Razorpay  from "razorpay";
import crypto from "crypto";
import pool from "../../config.js";

 const razorpay= new  Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
 })


 // Get Razorpay key for frontend
export const getRazorpayKey = async (req, res) => {
  try {
    return res.json({ 
      success: true, 
      key_id: process.env.RAZORPAY_KEY_ID 
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Failed to get Razorpay key" });
  }
}

export const createOrder= async (req,res)=>{
 try {
    const { amount } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({ 
        success: false, 
        message: "Invalid amount. Amount must be greater than 0." 
      });
    }

    const options = {
      amount: Math.round(amount * 100), // amount in paise, ensure it's an integer
      currency: "INR",
      receipt: "receipt_order_" + Math.floor(Math.random() * 10000),
    };

    console.log("Creating Razorpay order with options:", { ...options, amount: options.amount + " paise" });
    
    const order = await razorpay.orders.create(options);
    
    console.log("Razorpay order created:", order.id);
    
    return  res.json({ success: true, order });
  } catch (error) {
    console.error("Error creating Razorpay order:", error);
    res.status(500).json({ 
      success: false, 
      message: "Failed to create order",
      error: error.message || "Unknown error"
    });
  }
 }


export const createOrderDevBypass = async (req, res) => {
  try {
    const bypassEnabled =
      process.env.NODE_ENV !== "production" ||
      process.env.ENABLE_DEV_ORDER_BYPASS === "true";

    if (!bypassEnabled) {
      return res.status(403).json({
        success: false,
        message: "Dev bypass is disabled. Set ENABLE_DEV_ORDER_BYPASS=true to allow it.",
      });
    }

    const site_user_id = req.user.id;
    const { address_id, cart_items, total_amount, type, selectedDates } = req.body;

    if (!address_id) {
      return res.status(400).json({ success: false, message: "address_id is required" });
    }
    if (!Array.isArray(cart_items) || cart_items.length === 0) {
      return res.status(400).json({ success: false, message: "cart_items are required" });
    }
    if (!total_amount || Number(total_amount) <= 0) {
      return res.status(400).json({ success: false, message: "Invalid total_amount" });
    }

    const typeMapping = {
      one_time: "onetime",
      daily: "daily",
      alternative: "alternative",
      weekly: "weekly",
      monthly: "monthly",
    };
    const dbType = typeMapping[type] || "onetime";

    let alternativeDatesJson = null;
    if (dbType === "alternative") {
      if (!selectedDates || !Array.isArray(selectedDates) || selectedDates.length === 0) {
        return res.status(400).json({
          success: false,
          message: "Alternative orders must have at least one selected date",
        });
      }
      alternativeDatesJson = JSON.stringify(
        selectedDates.map((date) => {
          const d = new Date(date);
          const year = d.getFullYear();
          const month = String(d.getMonth() + 1).padStart(2, "0");
          const day = String(d.getDate()).padStart(2, "0");
          return `${year}-${month}-${day}`;
        })
      );
    }

    const [orderResult] = await pool.query(
      `INSERT INTO orders (site_user_id, address_id, total_amount, status, payment_status, type, alternative_dates)
       VALUES (?, ?, ?, 'processing', 'paid', ?, ?)`,
      [site_user_id, address_id, total_amount, dbType, alternativeDatesJson]
    );

    const orderId = orderResult.insertId;

    for (const item of cart_items) {
      await pool.query(
        `INSERT INTO order_items (order_id, product_id, quantity, price, start_date)
         VALUES (?, ?, ?, ?, CURDATE())`,
        [orderId, item.product_id, item.quantity, item.price]
      );
    }

    return res.json({
      success: true,
      message: "Order placed in development mode (payment bypassed)",
      order_id: orderId,
      payment_status: "paid",
      bypassed_payment: true,
    });
  } catch (error) {
    console.error("Error in createOrderDevBypass:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to place order in dev bypass mode",
    });
  }
};


 export const verifyOrder=async(req,res)=>{
   try {
const site_user_id= req.user.id;

    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      
      address_id,
      cart_items,
      total_amount,
      type,
      selectedDates
    } = req.body;

    // ✅ Verify Razorpay signature
    const sign = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSign = crypto
      .createHmac("sha256", razorpay.key_secret)
      .update(sign.toString())
      .digest("hex");

    if (razorpay_signature !== expectedSign) {
      return res.status(400).json({ success: false, message: "Invalid signature" });
    }

    // ✅ Map frontend type values to database enum values
    // Frontend sends: 'one_time', 'daily', 'alternative'
    // Database expects: 'onetime', 'daily', 'alternative'
    const typeMapping = {
      'one_time': 'onetime',
      'daily': 'daily',
      'alternative': 'alternative',
      'weekly': 'weekly',
      'monthly': 'monthly'
    };
    const dbType = typeMapping[type] || 'onetime'; // Default to 'onetime' if unknown

    //  Validate selectedDates for alternative orders
    let alternativeDatesJson = null;
    if (dbType === 'alternative') {
      if (!selectedDates || !Array.isArray(selectedDates) || selectedDates.length === 0) {
        return res.status(400).json({
          success: false,
          message: "Alternative orders must have at least one selected date"
        });
      }
      // Convert Date objects/ISO strings to ISO date format (YYYY-MM-DD) using local date
      alternativeDatesJson = JSON.stringify(
        selectedDates.map(date => {
          const d = new Date(date);
          // Use local date (not UTC) to avoid timezone shifts
          const year = d.getFullYear();
          const month = String(d.getMonth() + 1).padStart(2, '0');
          const day = String(d.getDate()).padStart(2, '0');
          return `${year}-${month}-${day}`;
        })
      );
    }

    // Insert into orders table with PENDING payment status
    // Webhook will update to 'paid' when payment is confirmed (source of truth)
    const [orderResult] = await pool.query(
      `INSERT INTO orders (site_user_id, address_id, total_amount, status, payment_status, type, alternative_dates)
       VALUES (?, ?, ?, 'pending', 'pending', ?, ?)`,
      [site_user_id, address_id, total_amount, dbType, alternativeDatesJson]
    );

    const orderId = orderResult.insertId;

    //  Insert each cart item into order_items table
    for (const item of cart_items) {
      await pool.query(
        `INSERT INTO order_items (order_id, product_id, quantity, price, start_date)
         VALUES (?, ?, ?, ?, CURDATE())`,
        [orderId, item.product_id, item.quantity, item.price]
      );
    }

    //  Create transaction record for webhook reconciliation
    // This ensures webhooks can link payments to orders
    try {
      // Check if transaction already exists (created by webhook)
      const [existing] = await pool.query(
        `SELECT id FROM transactions WHERE razorpay_payment_id = ?`,
        [razorpay_payment_id]
      );

      if (existing.length > 0) {
        // Update existing transaction with order_id (webhook created it first)
        await pool.query(
          `UPDATE transactions 
           SET order_id = ?, updated_at = CURRENT_TIMESTAMP
           WHERE razorpay_payment_id = ?`,
          [orderId, razorpay_payment_id]
        );
        console.log(` Transaction record updated for payment ${razorpay_payment_id} linked to order ${orderId}`);
        
        // If webhook already confirmed payment, update order status
        const [txn] = await pool.query(
          `SELECT status, captured FROM transactions WHERE razorpay_payment_id = ?`,
          [razorpay_payment_id]
        );
        if (txn.length > 0 && txn[0].captured && txn[0].status === 'captured') {
          await pool.query(
            `UPDATE orders SET payment_status = 'paid', status = 'processing' WHERE id = ?`,
            [orderId]
          );
          console.log(` Order ${orderId} status updated to paid (webhook already confirmed)`);
        } else {
          // Even if webhook hasn't confirmed yet, check if payment was captured
          // This handles cases where webhook is delayed or fails
          try {
            const paymentDetails = await razorpay.payments.fetch(razorpay_payment_id);
            if (paymentDetails.status === 'captured' || paymentDetails.captured === true) {
              await pool.query(
                `UPDATE orders SET payment_status = 'paid', status = 'processing' WHERE id = ?`,
                [orderId]
              );
              // Also update transaction
              await pool.query(
                `UPDATE transactions SET status = 'captured', captured = true WHERE razorpay_payment_id = ?`,
                [razorpay_payment_id]
              );
              console.log(` Order ${orderId} status updated to paid (payment verified via Razorpay API fallback)`);
            }
          } catch (apiError) {
            console.error("Error checking payment status from Razorpay:", apiError);
            // Non-critical, continue - webhook will update it later
          }
        }
      } else {
        // Create new transaction record (webhook hasn't arrived yet)
        // Status will be updated by webhook when payment.captured arrives
        await pool.query(
          `INSERT INTO transactions (
            razorpay_payment_id, razorpay_order_id, order_id, site_user_id,
            amount, currency, status, captured, payment_method
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            razorpay_payment_id,
            razorpay_order_id,
            orderId,
            site_user_id,
            total_amount,
            "INR",
            "authorized", // Will be updated to 'captured' by webhook
            false, // Will be updated to true by webhook
            null, // Payment method will be updated by webhook if available
          ]
        );
        console.log(` Transaction record created for payment ${razorpay_payment_id} linked to order ${orderId} (waiting for webhook confirmation)`);
        
        // Fallback: Check payment status directly from Razorpay API
        // This ensures order is updated even if webhook is delayed
        try {
          const paymentDetails = await razorpay.payments.fetch(razorpay_payment_id);
          if (paymentDetails.status === 'captured' || paymentDetails.captured === true) {
            await pool.query(
              `UPDATE orders SET payment_status = 'paid', status = 'processing' WHERE id = ?`,
              [orderId]
            );
            await pool.query(
              `UPDATE transactions SET status = 'captured', captured = true WHERE razorpay_payment_id = ?`,
              [razorpay_payment_id]
            );
            console.log(` Order ${orderId} status updated to paid (payment verified via Razorpay API fallback)`);
          }
        } catch (apiError) {
          console.error("Error checking payment status from Razorpay (non-critical):", apiError);
          // Non-critical, webhook will update it
        }
      }
    } catch (error) {
      console.error("⚠️ Error creating/updating transaction record (non-critical):", error);
      // Don't fail the order creation if transaction insert fails
    }

    return res.json({ 
      success: true, 
      message: "Order created. Payment confirmation pending via webhook.", 
      order_id: orderId,
      payment_status: "pending" // Webhook will update this to 'paid'
    });
  } catch (error) {
    console.error("❌ Error in verifyOrder:", error);
    // If order was created but error occurred later, still return order_id if available
    const orderId = error.orderId || null;
    res.status(500).json({ 
      success: false, 
      message: "Verification failed", 
      order_id: orderId 
    });
  }
 }


export const getOrder = async (req, res) => {
  try {
    const user_id = req.user.id;

    // 1. Get all orders for the user
    const [orders] = await pool.query(
      `SELECT o.*, a.first_name, a.last_name, a.street, a.city, a.state, a.zip_code, a.country
       FROM orders o
       LEFT JOIN newaddresses a ON o.address_id = a.id
       WHERE o.site_user_id = ?
       ORDER BY o.created_at DESC`,
      [user_id]
    );

    // 2. Fetch items + product details for each order
    const ordersWithItems = await Promise.all(
      orders.map(async (order) => {
        const [items] = await pool.query(
          `SELECT oi.*, p.name AS product_name, p.images AS product_image
           FROM order_items oi
           LEFT JOIN products p ON oi.product_id = p.id
           WHERE oi.order_id = ?`,
          [order.id]
        );

        return {
          ...order,
          address: {
            first_name: order.first_name,
            last_name: order.last_name,
            street: order.street,
            city: order.city,
            state: order.state,
            zip_code: order.zip_code,
            country: order.country,
          },
          items,
        };
      })
    );
console.log(ordersWithItems)
    return res.json({ success: true, orders: ordersWithItems });
  } catch (error) {
    console.error("Error fetching orders:", error);
    return res
      .status(500)
      .json({ success: false, message: "Failed to fetch orders" });
  }
};


export const getSingleOrder = async (req, res) => {
  const { id } = req.params;
  try {
    // 1. Get the order with address
    const [orders] = await pool.query(
      `SELECT o.*, a.first_name, a.last_name, a.street, a.city, a.state, a.zip_code, a.country, a.latitude, a.longitude
       FROM orders o
       LEFT JOIN newaddresses a ON o.address_id = a.id
       WHERE o.id = ?
       ORDER BY o.created_at DESC`,
      [id]
    );

    if (orders.length === 0) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }

    const order = orders[0]; // since we're fetching by ID, it's a single order

    // 2. Fetch items + product details for this order
    const [items] = await pool.query(
      `SELECT oi.*, p.name AS product_name, p.images AS product_image
       FROM order_items oi
       LEFT JOIN products p ON oi.product_id = p.id
       WHERE oi.order_id = ?`,
      [order.id]
    );

    // 3. Build the response
    const orderWithItems = {
      ...order,
      address: {
        first_name: order.first_name,
        last_name: order.last_name,
        street: order.street,
        city: order.city,
        state: order.state,
        zip_code: order.zip_code,
        country: order.country,
        latitude: order.latitude,
        longitude: order.longitude,
      },
      items,
    };

    return res.json({ success: true, order: orderWithItems });
  } catch (error) {
    console.error("Error fetching order:", error);
    return res
      .status(500)
      .json({ success: false, message: "Failed to fetch order" });
  }
};
