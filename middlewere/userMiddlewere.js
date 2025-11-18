import pool from "../config.js";
import { TokenVerify } from "../helper/Jwttoken.js";

export const userMiddleware = async (req, res, next) => {
  try {
    const  user  = req.cookies.user || req.headers.authorization?.split(" ")[1] ;

    // Check if cookie exists
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
    return res.status(500).json({ success: false, message: "Server error" });
  }
};
