import mysql from "mysql2";
import mysqlPromise from "mysql2/promise";
import dotenv from "dotenv";
dotenv.config();

// Create a connection to create the database if it doesn't exist
(async () => {
  try {
    const tempConnection = await mysqlPromise.createConnection({
      host: "localhost",
      user: "root",
      password: process.env.DB_PASSWORD || "",
    });
    await tempConnection.query("CREATE DATABASE IF NOT EXISTS admindb");
    console.log("✅ Database 'admindb' ready");
    await tempConnection.end();
  } catch (err) {
    console.log("❌ Database Creation Failed:", err.message);
  }
})();

const db = mysql.createPool({
  connectionLimit: 10,
  host: "localhost",
  user: "root",
  password: process.env.DB_PASSWORD || "",
  database: "admindb",
});

// Check DB connection
db.getConnection((err, connection) => {
  if (err) {
    console.log("❌ MySQL Connection Failed:", err.message);
  } else {
    console.log("✅ MySQL Connected Successfully!");
    connection.release();
  }
});

export default db;
