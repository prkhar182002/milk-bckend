import dotenv from "dotenv";
dotenv.config()
import pool from "../../config.js";
import { compairPassword, hashedpassword } from "../../helper/hashing.js";
import { createToken } from "../../helper/Jwttoken.js";


export const SignupUser = async (req, res) => {
  try {
    const { name, email, phone, password } = req.body;

    if (!name || !email || !phone || !password) {
      return res.status(400).json({ success:false, message: "All fields are required" });
    }

    const [existingUser] = await pool.query(
      `SELECT * FROM users WHERE email = ? OR phone = ?`,
      [email, phone]
    );

    if (existingUser.length > 0) {
      return res.status(400).json({success:false, message: "User already exists with this email or phone" });
    }


    const hashedPassword = await  hashedpassword(password)

const [result]=    await pool.query(
      `INSERT INTO users (name, email, phone, password) VALUES (?, ?, ?, ?)`,
      [name, email, phone, hashedPassword]
    );

    const userId = result.insertId;

const token = createToken(userId);

res.cookie("user", token, {
 path:'/',
        httpOnly:true,
        expires: new Date(Date.now()+7000 *86400*5),
        sameSite:'none',
      secure:true,
})









    return res.status(201).json({success:true, token , message: "User registered successfully" });
  } catch (error) {
    console.error("Signup error:", error);
    return res.status(500).json({success:false,  message: "Internal server error" });
  }
};













export const LoginUser = async (req, res) => {
  try {
    const { email, phone, password } = req.body;

    if ((!email && !phone) || !password) {
      return res.status(400).json({ success: false, message: "Email/Phone and password are required" });
    }

    // find user by email OR phone
    const [user] = await pool.query(
      `SELECT * FROM users WHERE email = ? OR phone = ? LIMIT 1`,
      [email, phone]
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
        expires: new Date(Date.now()+7000 *86400*5),
        sameSite:'none',
      secure:true,
    });

    return res.status(200).json({
      success: true,token,
      message: "Login successful",
      
    });
  } catch (error) {
    console.error("Login error:", error);
    return res.status(500).json({ success: false, message: "Internal server error" });
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




