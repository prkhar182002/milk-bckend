import pool from "../config.js";
import { TokenVerify } from "../helper/Jwttoken.js";

export const userMiddleware = async (req, res, next) => {
  try {
    let user = req.cookies.user;
    
    // If no cookie, try to get from authorization header
    if (!user && req.headers.authorization) {
      const authHeader = req.headers.authorization;
      user = authHeader.startsWith("Bearer ") ? authHeader.split(" ")[1] : authHeader;
    }

    // Check if token exists
    if (!user) {
      return res.json({ success: false, message: "Login first" });
    }

    // Verify token
    const id = TokenVerify(user);
    if (!id) {
      return res.json({ success: false, message: "Invalid or expired token" });
    }

    const [rows] = await pool.query(`SELECT * FROM users WHERE id = ?`, [id]);

    if (rows.length === 0) {
      return res.json({ success: false, message: "User not found" });
    }
  req.user= rows[0];
next()
  } catch (error) {
    console.error("User middleware error:", error);
    
    // Check if it's a database connection error
    if (error.code === 'ECONNREFUSED' || error.code === 'PROTOCOL_CONNECTION_LOST') {
      return res.status(503).json({ 
        success: false, 
        message: "Database connection failed. Please check if MySQL is running." 
      });
    }
    
    return res.status(500).json({ success: false, message: "Server error" });
  }
};
