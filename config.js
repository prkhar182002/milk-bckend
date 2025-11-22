import mysql from "mysql2/promise";
import dotenv from "dotenv"
dotenv.config()

// Validate required environment variables
const requiredEnvVars = ['DB_USER', 'DB_PASSWORD', 'DB_NAME'];
const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);

if (missingVars.length > 0) {
  console.error("❌ Missing required environment variables:");
  missingVars.forEach(varName => {
    console.error(`   - ${varName}`);
  });
  console.error("\n📝 Please create a .env file with the following variables:");
  console.error("   DB_HOST=127.0.0.1");
  console.error("   DB_PORT=3306");
  console.error("   DB_USER=your_mysql_username");
  console.error("   DB_PASSWORD=your_mysql_password");
  console.error("   DB_NAME=your_database_name");
  console.error("\n⚠️  Database connection will fail until .env is configured!\n");
}

const pool = mysql.createPool({
  host: process.env.DB_HOST || "127.0.0.1",
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  // Add connection timeout and retry settings
  connectTimeout: 10000, // 10 seconds
  acquireTimeout: 10000,
  timeout: 60000, // 60 seconds
  // Better error handling
  enableKeepAlive: true,
  keepAliveInitialDelay: 0,
});

// Test connection on module load (optional, but helpful for debugging)
pool.getConnection()
  .then(connection => {
    console.log("✅ Database pool created successfully");
    connection.release();
  })
  .catch(error => {
    console.error("❌ Failed to create database connection pool:");
    console.error("   Error:", error.message);
    if (error.code === 'ECONNREFUSED') {
      console.error("   → MySQL server is not running or not accessible");
    } else if (error.code === 'ER_ACCESS_DENIED_ERROR') {
      console.error("   → Invalid username or password");
    } else if (error.code === 'ER_BAD_DB_ERROR') {
      console.error("   → Database does not exist");
    } else if (missingVars.length > 0) {
      console.error("   → Missing environment variables (check .env file)");
    }
  });

export default pool;
