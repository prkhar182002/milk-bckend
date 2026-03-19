import db from "../config/db.js";
import { hashedpassword } from "../helper/hashing.js";
import dotenv from "dotenv";

dotenv.config();

async function createAdmin() {
  let connection;
  try {
    connection = await db.getConnection();
    
    // Get admin details from command line arguments or use defaults
    const args = process.argv.slice(2);
    const name = args[0] || "Gaualla Admin";
    const email = args[1] || "admin@gaualla.com";
    const password = args[2] || "StrongPassword123!";

    console.log("🚀 Creating admin user...");
    console.log(`Name: ${name}`);
    console.log(`Email: ${email}`);
    console.log(`Password: ${password}`);

    // Check if admin already exists
    const [existingAdmin] = await connection.query(
      `SELECT * FROM admins WHERE email = ?`,
      [email]
    );

    if (existingAdmin.length > 0) {
      console.log("❌ Admin with this email already exists!");
      return;
    }

    // Hash password
    const hashedPassword = await hashedpassword(password);

    // Insert admin
    const [result] = await connection.query(
      `INSERT INTO admins (name, email, password) VALUES (?, ?, ?)`,
      [name, email, hashedPassword]
    );

    console.log("✅ Admin created successfully!");
    console.log(`Admin ID: ${result.insertId}`);
    console.log(`Email: ${email}`);
    console.log("\n📝 You can now login with these credentials.");

  } catch (error) {
    console.error("❌ Error creating admin:", error);
  } finally {
    if (connection) {
      connection.release();
    }
    // db.end(); // Don't end the pool, server might need it
  }
}

createAdmin();