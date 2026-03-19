import pool from "../../config.js";
import { compairPassword, hashedpassword } from "../../helper/hashing.js";
import { createToken, TokenVerify } from "../../helper/Jwttoken.js";

export const adminLogin = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ 
        success: false, 
        message: "Email and password are required" 
      });
    }

    // Find admin by email
    const [admin] = await pool.query(
      `SELECT * FROM admins WHERE email = ? LIMIT 1`,
      [email]
    );

    if (admin.length === 0) {
      return res.status(401).json({ 
        success: false, 
        message: "Invalid credentials" 
      });
    }

    const existingAdmin = admin[0];

    // Check password
    const isMatch = await compairPassword(password, existingAdmin.password);
    if (!isMatch) {
      return res.status(401).json({ 
        success: false, 
        message: "Invalid credentials" 
      });
    }

    // Generate token
    const token = createToken(existingAdmin.id);

    // Set cookie
    res.cookie("admin", token, {
      path: '/',
      httpOnly: true,
      expires: new Date(Date.now() + 7000 * 86400 * 5), // 90 days
      sameSite: 'none',
      secure: true,
    });

    // Remove password from response
    const { password: _, ...adminData } = existingAdmin;

    return res.status(200).json({
      success: true,
      token,
      admin: adminData,
      message: "Login successful",
    });
  } catch (error) {
    console.error("Admin login error:", error);
    return res.status(500).json({ 
      success: false, 
      message: "Internal server error" 
    });
  }
};

export const adminVerify = async (req, res) => {
  try {
    const adminToken = req.cookies.admin || req.headers.authorization?.split(" ")[1];

    if (!adminToken) {
      return res.status(401).json({ 
        success: false, 
        message: "Not authenticated" 
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
    const [admin] = await pool.query(
      `SELECT id, name, email, created_at FROM admins WHERE id = ?`,
      [id]
    );

    if (admin.length === 0) {
      return res.status(401).json({ 
        success: false, 
        message: "Admin not found" 
      });
    }

    return res.status(200).json({
      success: true,
      admin: admin[0],
    });
  } catch (error) {
    console.error("Admin verify error:", error);
    return res.status(401).json({ 
      success: false, 
      message: "Invalid or expired token" 
    });
  }
};

export const adminLogout = async (req, res) => {
  try {
    res.cookie("admin", "", {
      path: "/",
      httpOnly: true,
      expires: new Date(Date.now()),
      sameSite: "none",
      secure: true,
    });

    return res.status(200).json({
      success: true,
      message: "Logout successful",
    });
  } catch (error) {
    console.error("Admin logout error:", error);
    return res.status(500).json({ 
      success: false, 
      message: "Internal server error" 
    });
  }
};

export const getAdmin = async (req, res) => {
  try {
    const { admin } = req;
    // Remove password if it exists
    const { password: _, ...adminData } = admin;
    return res.json({ 
      admin: adminData, 
      success: true 
    });
  } catch (error) {
    console.error("Get admin error:", error);
    return res.status(500).json({ 
      success: false, 
      message: "Internal server error" 
    });
  }
};

export const updateAdminPassword = async (req, res) => {
  try {
    const { admin } = req;
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ 
        success: false, 
        message: "Current password and new password are required" 
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ 
        success: false, 
        message: "New password must be at least 6 characters" 
      });
    }

    // Get full admin data with password
    const [adminData] = await pool.query(
      `SELECT * FROM admins WHERE id = ?`,
      [admin.id]
    );

    if (adminData.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: "Admin not found" 
      });
    }

    const existingAdmin = adminData[0];

    // Verify current password
    const isMatch = await compairPassword(currentPassword, existingAdmin.password);
    if (!isMatch) {
      return res.status(401).json({ 
        success: false, 
        message: "Current password is incorrect" 
      });
    }

    // Hash new password
    const hashedPassword = await hashedpassword(newPassword);

    // Update password
    await pool.query(
      `UPDATE admins SET password = ? WHERE id = ?`,
      [hashedPassword, admin.id]
    );

    return res.status(200).json({
      success: true,
      message: "Password updated successfully",
    });
  } catch (error) {
    console.error("Update admin password error:", error);
    return res.status(500).json({ 
      success: false, 
      message: "Internal server error" 
    });
  }
};

export const adminController = {
  adminLogin,
  adminVerify,
  adminLogout,
  getAdmin,
  updateAdminPassword,
};
