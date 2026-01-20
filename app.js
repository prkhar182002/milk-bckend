import express from "express"
import dotenv  from "dotenv";
import cors from "cors"
import CategoryRoute from "./Route/CategoryRouters.js"
import ProductRoute from "./Route/ProductRouters.js"
import BannerRoutes from "./Route/BannerRoutes.js"
import loginSignup from "./Route/signupinRoutes.js"
import CartRoute from "./Route/cartRoutes.js"
import cookieParser from "cookie-parser";
import AddressRoute from "./Route/addressRoutes.js"
import orderRoute from "./Route/orderRoutes.js"
import blogRoute from "./Route/blogRoute.js"
import razorpayRoutes from "./Route/Razerpay.js"
import paymentLinkRoutes from "./Route/paymentLinkRoutes.js"
import webhookRoutes from "./Route/webhookRoutes.js"
import paymentAdminRoutes from "./Route/paymentAdminRoutes.js"
import db from "./config/db.js"   
import adminRoutes from "./Route/adminRoutes.js"

import userRoutes from "./Route/userRoutes.js";


dotenv.config()
const app= express()

app.use(
  cors({
    // Allow all origins (reflect request origin). Works with `credentials: true`.
    origin: (origin, callback) => callback(null, true),
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  })
);

// Webhook routes need raw body for signature verification
// Must be registered before express.json() middleware
app.use("/api/webhooks", express.raw({ type: "application/json" }), webhookRoutes);

app.use(express.json())
app.use(cookieParser())
app.use("/uploads", express.static("uploads"));

app.get("/",async(req,res)=>{
  return res.json({ working:true})
})


 //admin authentication routes
app.use("/admin", adminRoutes);

//admin protected routes (add middleware later if needed)
app.use("/admin/category",CategoryRoute);
app.use("/admin/product",ProductRoute);
app.use("/admin/banner",BannerRoutes);
app.use("/admin/blog",blogRoute)
app.use("/admin/payments", paymentAdminRoutes);

// all
app.use("/api/user/category",CategoryRoute)
app.use("/api/user/getproduct",ProductRoute)
app.use("/api/user/banner",BannerRoutes)

app.use("/api/user/",loginSignup)

// users
app.use("/api/user/cart",CartRoute)
app.use("/api/user/address",AddressRoute)
app.use("/api/user/order",orderRoute)
app.use("/api/user/payment-links", paymentLinkRoutes);

app.use('/api/user/razorpay', razorpayRoutes);

app.use("/api/users", userRoutes);

const PORT = process.env.PORT || 9002;

app.listen(PORT,()=>{
    console.log(`http://localhost:${PORT}`)
})
