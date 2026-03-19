import bcrypt from "bcrypt";
import { findAdminByEmail, findAdminById } from "../../models/adminModel.js";
import { createToken } from "../../helper/Jwttoken.js";

export const adminLogin = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    // Find admin by email
    const admin = await findAdminByEmail(email);
    if (!admin) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, admin.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    // Generate JWT
    const token = createToken(admin.id);

    // Set httpOnly cookie
    res.cookie("adminToken", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production", 
      sameSite: "strict",
      maxAge: 90 * 24 * 60 * 60 * 1000, 
    });

    // Return success response
    res.status(200).json({
      message: "Login successful",
      admin: {
        id: admin.id,
        name: admin.name,
        email: admin.email,
      },
    });
  } catch (error) {
    console.error("Admin login error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const verifyAdmin = async (req, res) => {
  try {
    const token = req.cookies.adminToken;
    if (!token) {
      return res.status(401).json({ message: "No token provided" });
    }

    const { TokenVerify } = await import("../../helper/Jwttoken.js");
    const adminId = TokenVerify(token);
    if (!adminId) {
      return res.status(401).json({ message: "Invalid token" });
    }

    // Fetch admin details
    const admin = await findAdminById(adminId);
    if (!admin) {
      return res.status(401).json({ message: "Admin not found" });
    }

    res.status(200).json({ message: "Authenticated", admin: { id: admin.id, name: admin.name, email: admin.email } });
  } catch (error) {
    console.error("Admin verify error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};
