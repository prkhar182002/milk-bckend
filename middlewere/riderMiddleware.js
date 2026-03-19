import pool from "../config.js";
import { TokenVerify } from "../helper/Jwttoken.js";

export const riderMiddleware = async (req, res, next) => {
  try {
    const riderToken = req.cookies.rider || req.headers.authorization?.split(" ")[1];

    if (!riderToken) {
      return res.status(401).json({
        success: false,
        message: "Authentication required. Please login first.",
      });
    }

    const id = TokenVerify(riderToken);
    if (!id) {
      return res.status(401).json({
        success: false,
        message: "Invalid or expired token",
      });
    }

    const [rows] = await pool.query(
      `SELECT id, name, email, phone, avatar, status, is_online, vehicle_type, vehicle_number,
              current_latitude, current_longitude, created_at
       FROM riders WHERE id = ?`,
      [id]
    );

    if (rows.length === 0) {
      return res.status(401).json({
        success: false,
        message: "Rider not found",
      });
    }

    if (rows[0].status === "suspended") {
      return res.status(403).json({
        success: false,
        message: "Your account has been suspended. Contact admin.",
      });
    }

    req.rider = rows[0];
    next();
  } catch (error) {
    console.error("Rider middleware error:", error);
    return res.status(401).json({
      success: false,
      message: "Invalid or expired token",
    });
  }
};
