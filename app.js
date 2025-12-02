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
import db from "./config/db.js"   

dotenv.config()
const app= express()

app.use(
  cors({
    origin: [process.env.url, "http://localhost:3000", "http://localhost:3001"],
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  })
);

app.use(express.json()) 
app.use(cookieParser())
app.use("/uploads", express.static("uploads"));

app.get("/",async(req,res)=>{
  return res.json({ working:true})
})

import adminRoutes from "./Route/adminRoutes.js"

// admin
app.use("/admin", adminRoutes);
app.use("/admin/category",CategoryRoute);
app.use("/admin/product",ProductRoute);
app.use("/admin/banner",BannerRoutes);
app.use("/admin/blog",blogRoute)

// all
app.use("/api/user/category",CategoryRoute)
app.use("/api/user/getproduct",ProductRoute)
app.use("/api/user/banner",BannerRoutes)

app.use("/api/user/",loginSignup)

// users
app.use("/api/user/cart",CartRoute)
app.use("/api/user/address",AddressRoute)
app.use("/api/user/order",orderRoute)

app.use('/api/user/razorpay', razorpayRoutes);

const PORT = process.env.PORT || 9002;

app.listen(PORT,()=>{
    console.log(`http://localhost:${PORT}`)
})
