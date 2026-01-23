import db from "../config/db.js";

async function migrate() {
  let connection;
  try {
    connection = await db.getConnection();
    await connection.beginTransaction();

    console.log("🚀 Running payment system migrations...");

    // Payment Links table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS payment_links (
        id BIGINT(20) UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        razorpay_payment_link_id VARCHAR(255) NOT NULL UNIQUE,
        order_id BIGINT(20) UNSIGNED DEFAULT NULL,
        site_user_id BIGINT(20) UNSIGNED NOT NULL,
        amount DECIMAL(12,2) NOT NULL ,
        currency VARCHAR(10) NOT NULL DEFAULT 'INR',
        description TEXT DEFAULT NULL,
        customer_name VARCHAR(255) DEFAULT NULL,
        customer_email VARCHAR(255) DEFAULT NULL,
        customer_contact VARCHAR(20) DEFAULT NULL,
        payment_link_url TEXT NOT NULL,
        short_url VARCHAR(255) DEFAULT NULL,
        status ENUM('created', 'paid', 'expired', 'cancelled') NOT NULL DEFAULT 'created',
        expire_by INT UNSIGNED DEFAULT NULL,
        expired_at TIMESTAMP NULL DEFAULT NULL,
        notes TEXT DEFAULT NULL,
        metadata JSON DEFAULT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

        -- Indexes
        INDEX idx_razorpay_id (razorpay_payment_link_id),
        INDEX idx_order (order_id),
        INDEX idx_user (site_user_id),
        INDEX idx_status (status),
        INDEX idx_expired_at (expired_at),

        -- Foreign keys
        CONSTRAINT fk_payment_link_order FOREIGN KEY (order_id) 
          REFERENCES orders(id) ON DELETE SET NULL,
        CONSTRAINT fk_payment_link_user FOREIGN KEY (site_user_id) 
          REFERENCES users(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);
    console.log("✅ payment_links table ready");

    // Transactions table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS transactions (
        id BIGINT(20) UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        razorpay_payment_id VARCHAR(255) DEFAULT NULL,
        razorpay_order_id VARCHAR(255) DEFAULT NULL,
        payment_link_id BIGINT(20) UNSIGNED DEFAULT NULL,
        order_id BIGINT(20) UNSIGNED DEFAULT NULL,
        site_user_id BIGINT(20) UNSIGNED NOT NULL,
        amount DECIMAL(12,2) NOT NULL,
        currency VARCHAR(10) NOT NULL DEFAULT 'INR',
        status ENUM('pending', 'authorized', 'captured', 'failed', 'refunded', 'partially_refunded') 
          NOT NULL DEFAULT 'pending',
        payment_method VARCHAR(50) DEFAULT NULL,
        payment_method_type VARCHAR(50) DEFAULT NULL,
        bank VARCHAR(100) DEFAULT NULL,
        wallet VARCHAR(100) DEFAULT NULL,
        vpa VARCHAR(255) DEFAULT NULL,
        card_id VARCHAR(255) DEFAULT NULL,
        invoice_id VARCHAR(255) DEFAULT NULL,
        international BOOLEAN DEFAULT FALSE,
        amount_refunded DECIMAL(12,2) DEFAULT 0,
        refund_status ENUM('null', 'partial', 'full') DEFAULT 'null',
        captured BOOLEAN DEFAULT FALSE,
        description TEXT DEFAULT NULL,
        fee DECIMAL(12,2) DEFAULT 0,
        tax DECIMAL(12,2) DEFAULT 0,
        error_code VARCHAR(50) DEFAULT NULL,
        error_description TEXT DEFAULT NULL,
        error_reason VARCHAR(255) DEFAULT NULL,
        error_source VARCHAR(50) DEFAULT NULL,
        error_step VARCHAR(50) DEFAULT NULL,
        razorpay_created_at INT UNSIGNED DEFAULT NULL,
        metadata JSON DEFAULT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

        -- Indexes
        INDEX idx_razorpay_payment_id (razorpay_payment_id),
        INDEX idx_razorpay_order_id (razorpay_order_id),
        INDEX idx_payment_link (payment_link_id),
        INDEX idx_order (order_id),
        INDEX idx_user (site_user_id),
        INDEX idx_status (status),
        INDEX idx_payment_method (payment_method),

        -- Foreign keys
        CONSTRAINT fk_transaction_payment_link FOREIGN KEY (payment_link_id) 
          REFERENCES payment_links(id) ON DELETE SET NULL,
        CONSTRAINT fk_transaction_order FOREIGN KEY (order_id) 
          REFERENCES orders(id) ON DELETE SET NULL,
        CONSTRAINT fk_transaction_user FOREIGN KEY (site_user_id) 
          REFERENCES users(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);
    console.log("✅ transactions table ready");

    // Refunds table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS refunds (
        id BIGINT(20) UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        razorpay_refund_id VARCHAR(255) NOT NULL UNIQUE,
        transaction_id BIGINT(20) UNSIGNED NOT NULL,
        payment_id VARCHAR(255) NOT NULL,
        order_id BIGINT(20) UNSIGNED DEFAULT NULL,
        amount DECIMAL(12,2) NOT NULL,
        currency VARCHAR(10) NOT NULL DEFAULT 'INR',
        status ENUM('pending', 'processed', 'failed') NOT NULL DEFAULT 'pending',
        speed VARCHAR(50) DEFAULT 'normal',
        notes TEXT DEFAULT NULL,
        receipt VARCHAR(255) DEFAULT NULL,
        batch_id VARCHAR(255) DEFAULT NULL,
        razorpay_created_at INT UNSIGNED DEFAULT NULL,
        metadata JSON DEFAULT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

        -- Indexes
        INDEX idx_razorpay_refund_id (razorpay_refund_id),
        INDEX idx_transaction (transaction_id),
        INDEX idx_payment_id (payment_id),
        INDEX idx_order (order_id),
        INDEX idx_status (status),

        -- Foreign keys
        CONSTRAINT fk_refund_transaction FOREIGN KEY (transaction_id) 
          REFERENCES transactions(id) ON DELETE CASCADE,
        CONSTRAINT fk_refund_order FOREIGN KEY (order_id) 
          REFERENCES orders(id) ON DELETE SET NULL
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);
    console.log("✅ refunds table ready");

    // Webhook Events table for audit trail
    await connection.query(`
      CREATE TABLE IF NOT EXISTS webhook_events (
        id BIGINT(20) UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        event_id VARCHAR(255) NOT NULL UNIQUE,
        event_type VARCHAR(100) NOT NULL,
        entity_type VARCHAR(50) NOT NULL,
        entity_id VARCHAR(255) NOT NULL,
        payment_id VARCHAR(255) DEFAULT NULL,
        payment_link_id VARCHAR(255) DEFAULT NULL,
        order_id BIGINT(20) UNSIGNED DEFAULT NULL,
        amount DECIMAL(12,2) DEFAULT NULL,
        status VARCHAR(50) DEFAULT NULL,
        payload JSON NOT NULL,
        signature_verified BOOLEAN DEFAULT FALSE,
        processed BOOLEAN DEFAULT FALSE,
        error_message TEXT DEFAULT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        processed_at TIMESTAMP NULL DEFAULT NULL,

        -- Indexes
        INDEX idx_event_id (event_id),
        INDEX idx_event_type (event_type),
        INDEX idx_entity_type (entity_type),
        INDEX idx_payment_id (payment_id),
        INDEX idx_payment_link_id (payment_link_id),
        INDEX idx_order (order_id),
        INDEX idx_processed (processed),
        INDEX idx_created_at (created_at)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);
    console.log("✅ webhook_events table ready");

    await connection.commit();
    console.log("✅ Payment system migrations completed successfully!");
  } catch (error) {
    if (connection) {
      await connection.rollback();
    }
    console.error("❌ Migration failed:", error);
    throw error;
  } finally {
    if (connection) {
      connection.release();
    }
  }
}

// Run migration if this file is executed directly
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
