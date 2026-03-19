import db from './config/db.js';
import bcrypt from 'bcrypt';

const insertAdmin = async () => {
  try {
    const hashedPassword = await bcrypt.hash('admin123', 10); 
    const query = `INSERT INTO admins (name, email, password) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE name=VALUES(name), password=VALUES(password)`;
    db.query(query, ['Admin', 'admin@example.com', hashedPassword], (err, results) => {
      if (err) {
        console.error('Error inserting admin:', err);
      } else {
        console.log('Admin inserted or updated successfully');
      }
      process.exit(0);
    });
  } catch (error) {
    console.error('Error hashing password:', error);
    process.exit(1);
  }
};

insertAdmin();
