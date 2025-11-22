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
import pool from "./config.js";


dotenv.config()
const app= express()

// Test database connection on startup
async function testDatabaseConnection() {
  try {
    const connection = await pool.getConnection();
    console.log("✅ Database connection successful!");
    console.log("   Database:", process.env.DB_NAME || "Not set");
    console.log("   Host:", process.env.DB_HOST || "127.0.0.1");
    connection.release();
    return true;
  } catch (error) {
    console.error("❌ Database connection failed!");
    console.error("   Error:", error.message);
    console.error("   Please check:");
    console.error("   1. MySQL/MariaDB is running");
    console.error("   2. .env file has correct DB credentials");
    console.error("   3. Database exists and is accessible");
    return false;
  }
}
// CORS configuration
// In development: allows all origins (including React Native apps which may not send origin)
// In production: uses process.env.url for strict origin control
app.use(
  cors({
    origin: (origin, callback) => {
      // In production, use strict origin check
      if (process.env.url) {
        if (origin === process.env.url || !origin) {
          callback(null, true);
        } else {
          callback(new Error("Not allowed by CORS"));
        }
      } else {
        // In development, allow all origins (including null for React Native)
        callback(null, true);
      }
    },
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true, 
  })
);
app.use(express.json()) 
app.use(cookieParser())
app.use("/uploads", express.static("uploads"));

// Health check endpoint - tests both server and database
app.get("/",async(req,res)=>{
  try {
    // Test database connection
    const connection = await pool.getConnection();
    await connection.query("SELECT 1");
    connection.release();
    
    return res.json({ 
      working: true,
      database: "connected",
      message: "Server and database are running"
    });
  } catch (error) {
    return res.status(500).json({ 
      working: true,
      database: "disconnected",
      error: error.message,
      message: "Server is running but database connection failed"
    });
  }
});

// Database health check endpoint
app.get("/health", async (req, res) => {
  try {
    const connection = await pool.getConnection();
    const [result] = await connection.query("SELECT 1 as test");
    connection.release();
    
    return res.json({
      status: "healthy",
      database: "connected",
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    return res.status(500).json({
      status: "unhealthy",
      database: "disconnected",
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

 


 //admin
app.use("/admin/category",CategoryRoute);
app.use("/admin/product",ProductRoute); 
app.use("/admin/banner",BannerRoutes);
app.use("/admin/blog",blogRoute)


//all
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

// Listen on all network interfaces (0.0.0.0) to allow connections from other devices
// This allows your phone to connect via your computer's IP address
app.listen(PORT, '0.0.0.0', async ()=>{
    console.log("===========================================");
    console.log(`🚀 Server starting on port ${PORT}...`);
    console.log(`   Local: http://localhost:${PORT}`);
    console.log(`   Network: http://192.168.1.11:${PORT}`);
    console.log("===========================================");
    
    // Test database connection
    const dbConnected = await testDatabaseConnection();
    
    console.log("===========================================");
    if (dbConnected) {
        console.log("✅ Server is ready!");
        console.log(`   Health check: http://localhost:${PORT}/health`);
    } else {
        console.log("⚠️  Server started but database is not connected!");
        console.log("   API endpoints may not work properly.");
    }
    console.log("   Make sure your phone and computer are on the same WiFi network");
    console.log("===========================================");
})

