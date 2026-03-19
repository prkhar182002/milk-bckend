import { getAllUsers } from "../../models/onlyUsermodal.js";
import db from "../../config/db.js";

export const fetchUsers = async (req, res) => {
  try {
    const users = await getAllUsers();

    // Fetch addresses for each user
    const userIds = users.map(user => user.id);
    const addresses = await getUserAddresses(userIds);

    const usersWithProfileStatus = users.map((user) => {
      const userAddress = addresses.find(addr => addr.site_user_id === user.id);
      const addressString = userAddress
        ? `${userAddress.street}, ${userAddress.city}, ${userAddress.state}, ${userAddress.zip_code}, ${userAddress.country}`
        : "N/A";

      return {
        _id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        address: addressString,
        profile: user.name && user.phone ? "complete" : "incomplete",
        createdAt: user.created_at,
      };
    });

    res.json({ success: true, users: usersWithProfileStatus });
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

const getUserAddresses = async (userIds) => {
  if (userIds.length === 0) return [];
  const connection = await db.getConnection();
  try {
    const placeholders = userIds.map(() => '?').join(',');
    const [rows] = await connection.query(
      `SELECT site_user_id, street, city, state, zip_code, country FROM newaddresses WHERE site_user_id IN (${placeholders}) AND is_default = 1`,
      userIds
    );
    return rows;
  } finally {
    connection.release();
  }
};
