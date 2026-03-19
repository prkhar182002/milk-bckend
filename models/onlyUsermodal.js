import db from "../config/db.js";

export const getAllUsers = async () => {
  const connection = await db.getConnection();
  try {
    const [rows] = await connection.query("SELECT * FROM users ORDER BY id DESC");
    return rows;
  } finally {
    connection.release();
  }
};
