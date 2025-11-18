import Razorpay  from "razorpay";
import crypto from "crypto";
import pool from "../../config.js";

 const razorpay= new  Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
 })


 export const createOrder= async (req,res)=>{
 try {
    const { amount } = req.body;

    const options = {
      amount: amount * 100, // amount in paise
      currency: "INR",
      receipt: "receipt_order_" + Math.floor(Math.random() * 10000),
    };

    const order = await razorpay.orders.create(options);
    return  res.json({ success: true, order });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Failed to create order" });
  }
 }


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
      type
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

    // ✅ Insert into orders table
    const [orderResult] = await pool.query(
      `INSERT INTO orders (site_user_id, address_id, total_amount, status, payment_status, type)
       VALUES (?, ?, ?, 'processing', 'paid', ?)`,
      [site_user_id, address_id, total_amount, type]
    );

    const orderId = orderResult.insertId;

    // ✅ Insert each cart item into order_items table
    for (const item of cart_items) {
      await pool.query(
        `INSERT INTO order_items (order_id, product_id, quantity, price, start_date)
         VALUES (?, ?, ?, ?, CURDATE())`,
        [orderId, item.product_id, item.quantity, item.price]
      );
    }

    return res.json({ success: true, message: "Payment verified & Order Created", order_id: orderId });
  } catch (error) {
    console.error("❌ Error in verifyOrder:", error);
    res.status(500).json({ success: false, message: "Verification failed" });
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
      `SELECT o.*, a.first_name, a.last_name, a.street, a.city, a.state, a.zip_code, a.country
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


