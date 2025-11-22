import dotenv from "dotenv";
dotenv.config()
import pool from "../../config.js";
import { compairPassword, hashedpassword } from "../../helper/hashing.js";
import { createToken } from "../../helper/Jwttoken.js";


export const SignupUser = async (req, res) => {
  try {
    const { name, email, phone, password } = req.body;

    // Validate all fields are provided
    if (!name || !email || !phone || !password) {
      return res.status(400).json({ success:false, message: "All fields are required" });
    }

    // Validate name (minimum 2 characters)
    if (name.trim().length < 2) {
      return res.status(400).json({ success:false, message: "Name must be at least 2 characters long" });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      return res.status(400).json({ success:false, message: "Please enter a valid email address" });
    }

    // Validate phone (should be 10 digits, can include country code)
    const phoneRegex = /^[+]?[(]?[0-9]{1,4}[)]?[-\s.]?[(]?[0-9]{1,4}[)]?[-\s.]?[0-9]{1,9}$/;
    if (!phoneRegex.test(phone.trim())) {
      return res.status(400).json({ success:false, message: "Please enter a valid phone number" });
    }

    // Validate password (minimum 6 characters)
    if (password.length < 6) {
      return res.status(400).json({ success:false, message: "Password must be at least 6 characters long" });
    }

    const [existingUser] = await pool.query(
      `SELECT * FROM users WHERE email = ? OR phone = ?`,
      [email.trim(), phone.trim()]
    );

    if (existingUser.length > 0) {
      return res.status(400).json({success:false, message: "User already exists with this email or phone" });
    }


    const hashedPassword = await  hashedpassword(password)

const [result]=    await pool.query(
      `INSERT INTO users (name, email, phone, password) VALUES (?, ?, ?, ?)`,
      [name.trim(), email.trim().toLowerCase(), phone.trim(), hashedPassword]
    );

    const userId = result.insertId;

const token = createToken(userId);

res.cookie("user", token, {
 path:'/',
        httpOnly:true,
        expires: new Date(Date.now() + 86400 * 1000 * 5), // 5 days in milliseconds
        sameSite:'none',
      secure:true,
})









    return res.status(201).json({success:true, token , message: "User registered successfully" });
  } catch (error) {
    console.error("Signup error:", error);
    
    // Check if it's a database connection error
    if (error.code === 'ECONNREFUSED' || error.code === 'PROTOCOL_CONNECTION_LOST') {
      return res.status(500).json({
        success: false,
        message: "Database connection failed. Please check if MySQL is running.",
        error: "Database connection error"
      });
    }
    
    // Check for duplicate entry error
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({
        success: false,
        message: "User already exists with this email or phone"
      });
    }
    
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};













export const LoginUser = async (req, res) => {
  try {
    const { email, phone, password } = req.body;

    // Validate required fields
    if ((!email && !phone) || !password) {
      return res.status(400).json({ success: false, message: "Email/Phone and password are required" });
    }

    // Validate password is not empty
    if (password.trim().length === 0) {
      return res.status(400).json({ success: false, message: "Password cannot be empty" });
    }

    // If email is provided, validate format
    if (email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email.trim())) {
        return res.status(400).json({ success: false, message: "Please enter a valid email address" });
      }
    }

    // If phone is provided, validate format
    if (phone) {
      const phoneRegex = /^[+]?[(]?[0-9]{1,4}[)]?[-\s.]?[(]?[0-9]{1,4}[)]?[-\s.]?[0-9]{1,9}$/;
      if (!phoneRegex.test(phone.trim())) {
        return res.status(400).json({ success: false, message: "Please enter a valid phone number" });
      }
    }

    // find user by email OR phone
    const searchValue = email ? email.trim().toLowerCase() : phone.trim();
    const [user] = await pool.query(
      `SELECT * FROM users WHERE email = ? OR phone = ? LIMIT 1`,
      [searchValue, searchValue]
    );

    if (user.length === 0) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    const existingUser = user[0];

    // check password
    const isMatch = await compairPassword(password, existingUser.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: "Invalid credentials" });
    }

    // generate token
    const token = createToken(existingUser.id);

    // set cookie
    res.cookie("user", token, {
     path:'/',
        httpOnly:true,
        expires: new Date(Date.now() + 86400 * 1000 * 5), // 5 days in milliseconds
        sameSite:'none',
      secure:true,
    });

    return res.status(200).json({
      success: true,token,
      message: "Login successful",
      
    });
  } catch (error) {
    console.error("Login error:", error);
    
    // Check if it's a database connection error
    if (error.code === 'ECONNREFUSED' || error.code === 'PROTOCOL_CONNECTION_LOST') {
      return res.status(500).json({
        success: false,
        message: "Database connection failed. Please check if MySQL is running.",
        error: "Database connection error"
      });
    }
    
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

export const logoutUser=async (req,res)=>{
  res.cookie("user", "", {
      path: "/",
      httpOnly: true,
      expires: new Date(Date.now()), // 90 days
      sameSite: "none",
      secure: true, 
    });

    return res.status(200).json({
      success: true,
      message: "Logout successful",
      
    });
}

const getUser= async(req,res)=>{
  const {user}=req;
  return res.json({user,success:true})
}







export const userController={
    SignupUser,
    LoginUser,
    logoutUser,
    getUser
}




