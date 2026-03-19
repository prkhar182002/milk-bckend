import pool from "../config.js";
import { TokenVerify } from "../helper/Jwttoken.js";

export const adminMiddleware = async (req, res, next) => {
  try {
    const adminToken = req.cookies.admin || req.headers.authorization?.split(" ")[1];

    // Check if cookie/token exists
    if (!adminToken) {
      return res.status(401).json({ 
        success: false, 
        message: "Authentication required. Please login first." 
      });
    }

    // Verify token
    const id = TokenVerify(adminToken);
    if (!id) {
      return res.status(401).json({ 
        success: false, 
        message: "Invalid or expired token" 
      });
    }

    // Get admin from database
    const [rows] = await pool.query(
      `SELECT id, name, email, created_at FROM admins WHERE id = ?`,
      [id]
    );

    if (rows.length === 0) {
      return res.status(401).json({ 
        success: false, 
        message: "Admin not found" 
      });
    }

    // Attach admin to request
    req.admin = rows[0];
    next();
  } catch (error) {
    console.error("Admin middleware error:", error);
    return res.status(401).json({ 
      success: false, 
      message: "Invalid or expired token" 
    });
  }
};
