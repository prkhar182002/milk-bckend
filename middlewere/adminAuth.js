// middleware/adminAuth.js
import pool from "../config.js";
import { TokenVerify } from "../helper/Jwttoken.js";

export const authMiddleware = async (req, res, next) => {
  try {
    // Get token from cookies or Authorization header
    const token = req.cookies.admin || req.headers.authorization?.split(" ")[1];

    if (!token) {
      return res.status(401).json({ success: false, message: "Admin login required" });
    }

    // Verify token
    const adminId = TokenVerify(token);
    if (!adminId) {
      return res.status(401).json({ success: false, message: "Invalid or expired token" });
    }

    // Check admin in DB
    const [rows] = await pool.query(`SELECT * FROM admins WHERE id = ?`, [adminId]);

    if (rows.length === 0) {
      return res.status(401).json({ success: false, message: "Admin not found" });
    }

    req.admin = rows[0]; // attach admin info to request
    next();
  } catch (error) {
    console.error("Admin middleware error:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};
