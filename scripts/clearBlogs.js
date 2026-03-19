import db from "../config/db.js";

function hasForceFlag() {
  return process.argv.includes("--force");
}

async function clearBlogs() {
  let connection;
  try {
    if (!hasForceFlag()) {
      console.log("❌ Refusing to delete blogs without confirmation.");
      console.log("Run with: node scripts/clearBlogs.js --force");
      console.log("Or via npm: npm run clear:blogs -- --force");
      process.exitCode = 1;
      return;
    }

    const host = process.env.DB_HOST || "localhost";
    const port = process.env.DB_PORT || "3306";
    const dbName = process.env.DB_NAME || "";
    const dbUser = process.env.DB_USER || "";
    console.log(`🔌 DB config: host=${host} port=${port} db=${dbName || "(missing)"} user=${dbUser || "(missing)"}`);
    console.log("⚠️ Deleting ALL rows from `blogs`...");

    connection = await db.getConnection();
    await connection.beginTransaction();

    // Prefer TRUNCATE (fast + resets auto_increment). Fallback to DELETE if needed.
    try {
      await connection.query("TRUNCATE TABLE blogs");
      console.log("✅ blogs table truncated");
    } catch (e) {
      console.warn("⚠️ TRUNCATE failed, falling back to DELETE:", e.message);
      const [result] = await connection.query("DELETE FROM blogs");
      console.log(`✅ Deleted ${result.affectedRows ?? 0} rows from blogs`);
    }

    await connection.commit();
  } catch (err) {
    if (connection) await connection.rollback();
    console.error("❌ Failed to clear blogs:", err);
    process.exitCode = 1;
  } finally {
    if (connection) connection.release();
  }
}

clearBlogs();


