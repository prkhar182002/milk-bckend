import db from "../config/db.js";

async function migrate() {
  let connection;
  try {
    connection = await db.getConnection();
    await connection.beginTransaction();

    console.log("Running rider system migrations...");

    await connection.query(`
      CREATE TABLE IF NOT EXISTS riders (
        id BIGINT(20) UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) DEFAULT NULL UNIQUE,
        phone VARCHAR(20) NOT NULL UNIQUE,
        password VARCHAR(255) NOT NULL,
        avatar VARCHAR(255) DEFAULT NULL,
        status ENUM('active', 'inactive', 'suspended') NOT NULL DEFAULT 'active',
        is_online TINYINT(1) NOT NULL DEFAULT 0,
        vehicle_type ENUM('bike', 'scooter', 'bicycle', 'van') DEFAULT 'bike',
        vehicle_number VARCHAR(50) DEFAULT NULL,
        current_latitude DECIMAL(10,8) DEFAULT NULL,
        current_longitude DECIMAL(11,8) DEFAULT NULL,
        last_location_update TIMESTAMP NULL DEFAULT NULL,
        fcm_token TEXT DEFAULT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

        INDEX idx_status (status),
        INDEX idx_online (is_online),
        INDEX idx_phone (phone),
        INDEX idx_location (current_latitude, current_longitude)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);
    console.log("riders table ready");

    await connection.query(`
      CREATE TABLE IF NOT EXISTS order_assignments (
        id BIGINT(20) UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        order_id BIGINT(20) UNSIGNED NOT NULL,
        rider_id BIGINT(20) UNSIGNED NOT NULL,
        status ENUM('pending', 'accepted', 'rejected', 'picked_up', 'in_transit', 'delivered', 'failed') 
          NOT NULL DEFAULT 'pending',
        assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        accepted_at TIMESTAMP NULL DEFAULT NULL,
        picked_up_at TIMESTAMP NULL DEFAULT NULL,
        delivered_at TIMESTAMP NULL DEFAULT NULL,
        rejection_reason TEXT DEFAULT NULL,
        delivery_proof VARCHAR(255) DEFAULT NULL,
        cod_amount DECIMAL(10,2) DEFAULT 0,
        cod_collected TINYINT(1) NOT NULL DEFAULT 0,
        cod_settled TINYINT(1) NOT NULL DEFAULT 0,
        distance_km DECIMAL(6,2) DEFAULT NULL,
        estimated_time_minutes INT DEFAULT NULL,
        admin_notes TEXT DEFAULT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

        INDEX idx_order (order_id),
        INDEX idx_rider (rider_id),
        INDEX idx_status (status),
        INDEX idx_assigned_at (assigned_at),

        CONSTRAINT fk_assignment_order FOREIGN KEY (order_id)
          REFERENCES orders(id) ON DELETE CASCADE,
        CONSTRAINT fk_assignment_rider FOREIGN KEY (rider_id)
          REFERENCES riders(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);
    console.log("order_assignments table ready");

    await connection.query(`
      CREATE TABLE IF NOT EXISTS rider_location_history (
        id BIGINT(20) UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        rider_id BIGINT(20) UNSIGNED NOT NULL,
        latitude DECIMAL(10,8) NOT NULL,
        longitude DECIMAL(11,8) NOT NULL,
        speed DECIMAL(6,2) DEFAULT NULL,
        heading DECIMAL(5,2) DEFAULT NULL,
        recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

        INDEX idx_rider_time (rider_id, recorded_at),

        CONSTRAINT fk_location_rider FOREIGN KEY (rider_id)
          REFERENCES riders(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);
    console.log("rider_location_history table ready");

    await connection.query(`
      CREATE TABLE IF NOT EXISTS notifications (
        id BIGINT(20) UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        recipient_type ENUM('admin', 'rider', 'user') NOT NULL,
        recipient_id BIGINT(20) UNSIGNED NOT NULL,
        title VARCHAR(255) NOT NULL,
        body TEXT DEFAULT NULL,
        data JSON DEFAULT NULL,
        type ENUM('new_order', 'order_assigned', 'order_accepted', 'order_delivered', 
                  'rider_nearby', 'payment_collected', 'general') NOT NULL DEFAULT 'general',
        is_read TINYINT(1) NOT NULL DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

        INDEX idx_recipient (recipient_type, recipient_id),
        INDEX idx_read (is_read),
        INDEX idx_type (type),
        INDEX idx_created_at (created_at)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);
    console.log("notifications table ready");

    await connection.query(`
      CREATE TABLE IF NOT EXISTS rider_earnings (
        id BIGINT(20) UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        rider_id BIGINT(20) UNSIGNED NOT NULL,
        order_assignment_id BIGINT(20) UNSIGNED NOT NULL,
        delivery_fee DECIMAL(10,2) NOT NULL DEFAULT 0,
        cod_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
        cod_settled TINYINT(1) NOT NULL DEFAULT 0,
        settlement_date DATE DEFAULT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

        INDEX idx_rider (rider_id),
        INDEX idx_assignment (order_assignment_id),
        INDEX idx_settled (cod_settled),
        INDEX idx_settlement_date (settlement_date),

        CONSTRAINT fk_earning_rider FOREIGN KEY (rider_id)
          REFERENCES riders(id) ON DELETE CASCADE,
        CONSTRAINT fk_earning_assignment FOREIGN KEY (order_assignment_id)
          REFERENCES order_assignments(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);
    console.log("rider_earnings table ready");

    // Alter orders table to add delivery-related columns
    const [cols] = await connection.query(`SHOW COLUMNS FROM orders LIKE 'delivery_status'`);
    if (cols.length === 0) {
      await connection.query(`
        ALTER TABLE orders
          ADD COLUMN assigned_rider_id BIGINT(20) UNSIGNED DEFAULT NULL,
          ADD COLUMN delivery_status ENUM('unassigned','assigned','accepted','picked_up','in_transit','delivered','failed')
            NOT NULL DEFAULT 'unassigned',
          ADD COLUMN estimated_delivery_time TIMESTAMP NULL DEFAULT NULL,
          ADD COLUMN delivery_otp VARCHAR(6) DEFAULT NULL,
          ADD INDEX idx_rider (assigned_rider_id),
          ADD INDEX idx_delivery_status (delivery_status),
          ADD CONSTRAINT fk_order_rider FOREIGN KEY (assigned_rider_id)
            REFERENCES riders(id) ON DELETE SET NULL
      `);
      console.log("orders table altered with delivery columns");
    } else {
      console.log("orders table already has delivery columns, skipping");
    }

    await connection.commit();
    console.log("Rider system migrations completed successfully!");
  } catch (error) {
    if (connection) {
      await connection.rollback();
    }
    console.error("Migration failed:", error);
    throw error;
  } finally {
    if (connection) {
      connection.release();
    }
  }
}

migrate()
  .then(() => {
    console.log("Migration completed");
    process.exit(0);
  })
  .catch((error) => {
    console.error("Migration error:", error);
    process.exit(1);
  });

export default migrate;
