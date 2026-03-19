import db from "../config/db.js";

async function columnInfo(connection, tableName, columnName) {
  const [rows] = await connection.query(
    `
    SELECT
      COLUMN_NAME,
      IS_NULLABLE,
      COLUMN_DEFAULT,
      COLUMN_TYPE
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = ?
      AND COLUMN_NAME = ?
    LIMIT 1
    `,
    [tableName, columnName]
  );
  return rows[0] || null;
}

async function hasIndex(connection, tableName, indexName) {
  const [rows] = await connection.query(
    `
    SELECT 1
    FROM INFORMATION_SCHEMA.STATISTICS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = ?
      AND INDEX_NAME = ?
    LIMIT 1
    `,
    [tableName, indexName]
  );
  return rows.length > 0;
}

async function addColumnIfMissing(connection, tableName, columnName, addSqlFragment) {
  const info = await columnInfo(connection, tableName, columnName);
  if (info) return false;
  await connection.query(`ALTER TABLE \`${tableName}\` ADD COLUMN ${addSqlFragment}`);
  return true;
}

async function migrateBlogs() {
  let connection;
  try {
    const host = process.env.DB_HOST || "localhost";
    const port = process.env.DB_PORT || "3306";
    const dbName = process.env.DB_NAME || "";
    const dbUser = process.env.DB_USER || "";

    console.log(`🔌 DB config: host=${host} port=${port} db=${dbName || "(missing)"} user=${dbUser || "(missing)"}`);
    if (!dbName || !dbUser) {
      console.warn("⚠️ Missing DB_NAME / DB_USER in environment. Check your .env before running migrations.");
    }

    connection = await db.getConnection();
    await connection.beginTransaction();

    console.log("🚀 Running blogs migration...");

    // Base table for the current API (supports title/writer/full_description/tag/readtime)
    await connection.query(`
      CREATE TABLE IF NOT EXISTS blogs (
        id INT AUTO_INCREMENT PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        writer VARCHAR(255) NOT NULL,
        full_description LONGTEXT NOT NULL,
        tag VARCHAR(255) DEFAULT NULL,
        readtime VARCHAR(50) DEFAULT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // If an older table exists (with slug/type/etc.), ensure the new fields exist.
    const added = [];
    if (await addColumnIfMissing(connection, "blogs", "tag", "`tag` VARCHAR(255) DEFAULT NULL")) {
      added.push("tag");
    }
    if (await addColumnIfMissing(connection, "blogs", "readtime", "`readtime` VARCHAR(50) DEFAULT NULL")) {
      added.push("readtime");
    }

    // If legacy schema has `slug` as NOT NULL with no default, inserts that don't provide slug will fail.
    // Make it nullable (unique indexes allow multiple NULLs).
    const slugInfo = await columnInfo(connection, "blogs", "slug");
    if (slugInfo && slugInfo.IS_NULLABLE === "NO" && slugInfo.COLUMN_DEFAULT === null) {
      await connection.query("ALTER TABLE `blogs` MODIFY COLUMN `slug` VARCHAR(255) NULL");
      console.log("✅ Updated `blogs.slug` to allow NULL (compat with API that doesn't send slug)");
    }

    // Ensure timestamps exist for older minimal schemas (best-effort).
    await addColumnIfMissing(
      connection,
      "blogs",
      "created_at",
      "`created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP"
    );
    await addColumnIfMissing(
      connection,
      "blogs",
      "updated_at",
      "`updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP"
    );

    // Optional: if slug exists, ensure it has a unique index (matches common frontend usage)
    const hasSlug = await columnInfo(connection, "blogs", "slug");
    if (hasSlug) {
      const slugUniqueIndexName = "slug";
      if (!(await hasIndex(connection, "blogs", slugUniqueIndexName))) {
        // This may fail if there are duplicates; we don't want to hard-fail migration.
        try {
          await connection.query("CREATE UNIQUE INDEX `slug` ON `blogs` (`slug`)");
          console.log("✅ Added unique index on `blogs.slug`");
        } catch (e) {
          console.warn("⚠️ Could not add unique index on blogs.slug (maybe duplicates already exist):", e.message);
        }
      }
    }

    await connection.commit();

    if (added.length) {
      console.log(`✅ blogs migration complete. Added columns: ${added.join(", ")}`);
    } else {
      console.log("✅ blogs migration complete. No changes needed.");
    }
  } catch (err) {
    if (connection) {
      await connection.rollback();
    }
    console.error("❌ blogs migration failed:", err);
    process.exitCode = 1;
  } finally {
    if (connection) connection.release();
  }
}

migrateBlogs();


