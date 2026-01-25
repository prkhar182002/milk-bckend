import pool from "../../config.js";




export const createAddress=async(req,res)=>{
    try  {
        const  user_id  = req.user.id;

         const { first_name,
      last_name,
      gender,
      email,
      phone,
      street,
      landmark,
      city,
      state,
      zip_code,
      country,
      address_type,
      is_default
    } = req.body;

    // Validate required fields
    if (!first_name || !last_name || !phone || !street || !city || !state || !zip_code || !country) {
      return res.status(400).json({ 
        success: false, 
        message: "Please fill in all required fields" 
      });
    }

    // If this address should be set as default, unset all other default addresses first
    const shouldSetAsDefault = is_default === 1 || is_default === true || is_default === "1";
    
    if (shouldSetAsDefault) {
      await pool.query("UPDATE newaddresses SET is_default = 0 WHERE site_user_id = ?", [user_id]);
    }

   const [result] = await pool.query(
  `INSERT INTO newaddresses 
   (site_user_id, first_name, last_name, gender, email, phone, street, landmark, city, state, zip_code, country, address_type, is_default) 
   VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  [
    user_id,
    first_name,
    last_name,
    gender || null,
    email || null,
    phone,
    street,
    landmark || null,
    city,
    state,
    zip_code,
    country,
    address_type || "home",
    shouldSetAsDefault ? 1 : 0,
  ]
); 
    return res.json({ success: true, message: "Address added successfully", id: result.insertId });
     } catch (error) {
      console.error("Error creating address:", error);
      console.error("Error details:", {
        message: error.message,
        code: error.code,
        sqlState: error.sqlState,
        sql: error.sql
      });
    res.status(500).json({ success: false, message: error.message || "Server error" });
    }
}


export const getAddress = async (req, res) => {
  try {
    const user_id = req.user.id;

    const [addresses] = await pool.query(
      "SELECT * FROM newaddresses WHERE site_user_id = ?",
      [user_id]
    );

    res.json({
      success: true,
       addresses,
    });
  } catch (error) {
    console.error("Error fetching addresses:", error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching addresses",
    });
  }
};

export const UpdatedefaultAddress = async (req, res) => {
  try {
    const user_id = req.user.id;
    const { address_id } = req.params;

    // Reset all addresses for this user
    await pool.query(
      "UPDATE newaddresses SET is_default = 0 WHERE site_user_id = ?",
      [user_id]
    );

    // Set selected address as default
    const [result] = await pool.query(
      "UPDATE newaddresses SET is_default = 1 WHERE id = ? AND site_user_id = ?",
      [address_id, user_id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: "Address not found or does not belong to this user",
      });
    }

    res.json({
      success: true,
      message: "Default address updated successfully",
    });
  } catch (error) {
    console.error("Error updating default address:", error);
    res.status(500).json({
      success: false,
      message: "Server error while updating default address",
    });
  }
};

