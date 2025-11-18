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
      address_type
    } = req.body;


      await pool.query("UPDATE newaddresses SET is_default = 0 WHERE site_user_id = ?", [user_id]);

   const [result] = await pool.query(
  `INSERT INTO newaddresses 
   (site_user_id, first_name, last_name, gender, email, phone, street, landmark, city, state, zip_code, country, address_type, is_default) 
   VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  [
    user_id,
    first_name,
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
    1, // default address
  ]
); return res.json({ success: true, message: "Address added successfully", id: result.insertId });
     } catch (error) {
      console.log(error.message)
    res.status(500).json({ success: false, message: "Server error" });
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

