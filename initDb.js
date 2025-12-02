import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import db from './config/db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const sqlFilePath = path.join(__dirname, 'admindb.sql');

fs.readFile(sqlFilePath, 'utf8', (err, sql) => {
  if (err) {
    console.error('Error reading SQL file:', err);
    process.exit(1);
  }

  // Split the SQL into individual statements
  const statements = sql.split(';').map(stmt => stmt.trim()).filter(stmt => stmt.length > 0);

  // Execute each statement
  let completed = 0;
  statements.forEach((statement, index) => {
    db.query(statement, (err, results) => {
      if (err) {
        console.error(`Error executing statement ${index + 1}:`, err);
      } else {
        console.log(`Statement ${index + 1} executed successfully`);
      }
      completed++;
      if (completed === statements.length) {
        console.log('Database initialization completed');
        process.exit(0);
      }
    });
  });
});
