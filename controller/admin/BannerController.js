import pool from "../../config.js";


const addBannerImage=async(req,res)=>{
try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: "No file uploaded" });
    }

    const { filename } = req.file;

    await pool.execute(
      `INSERT INTO banners (image) VALUES (?)`,
      [filename]
    );

    res.json({ success: true, message: "Banner uploaded successfully", filename });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Error uploading banner" });
  }
}


const getBannner=async(req,res)=>{
    const [banners]= await pool.query(`SELECT * FROM banners`) 
    if(banners.length==0){
    return res.json({success:false})

    }

    return res.json({success:true,banners})
}




const deleteBanner = async (req, res) => {
  try {
    const { id } = req.params;

    // Run delete query
    const [result] = await pool.query(`DELETE FROM banners WHERE id = ?`, [id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Banner not found" });
    }

    return res.status(200).json({ message: "Banner deleted successfully" });
  } catch (error) {
    console.error("Error deleting banner:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};


export const banneController={
    addBannerImage,
    getBannner,
    deleteBanner
}

