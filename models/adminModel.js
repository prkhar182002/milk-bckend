import db from "../config/db.js";

export const findAdminByEmail = (email) => {
  return new Promise((resolve, reject) => {
    const query = "SELECT * FROM admins WHERE email = ?";
    db.query(query, [email], (err, results) => {
      if (err) {
        reject(err);
      } else {
        resolve(results[0]); // Return the first result or undefined
      }
    });
  });
};

export const createAdmin = (name, email, hashedPassword) => {
  return new Promise((resolve, reject) => {
    const query = "INSERT INTO admins (name, email, password) VALUES (?, ?, ?)";
    db.query(query, [name, email, hashedPassword], (err, results) => {
      if (err) {
        reject(err);
      } else {
        resolve(results.insertId);
      }
    });
  });
};

export const findAdminById = (id) => {
  return new Promise((resolve, reject) => {
    const query = "SELECT * FROM admins WHERE id = ?";
    db.query(query, [id], (err, results) => {
      if (err) {
        reject(err);
      } else {
        resolve(results[0]);
      }
    });
  });
};
