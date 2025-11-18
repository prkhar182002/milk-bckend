import pool from "../../config.js";
import fs from "fs";
import path from "path";

export const createBlog = async (req, res) => {
  try {
   

  

    const {
      title,
      writer,
      short_description, 
      yt_link,
      type,
      full_description,
    } = req.body;

    const slug = title
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");



  if (req.file) {
      console.log("Uploaded file:", req.file); // debug
    const  imgpath = req.file.filename;
       const [result] = await pool.execute(
      `INSERT INTO blogs 
      (img, title, slug, writer, short_description, yt_link, type, full_description) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        imgpath,
        title,
        slug,
        writer,
        short_description,
        yt_link || null,
        type,
        full_description,
      ]
    );
     res.status(201).json({
      success: true,
      message: "Blog created successfully",
      blogId: result.insertId,
    });
    }else{
         const [result] = await pool.execute(
      `INSERT INTO blogs 
      (img, title, slug, writer, short_description, yt_link, type, full_description) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        null,
        title,
        slug,
        writer,
        short_description,
        yt_link || null,
        type,
        full_description,
      ]
    );
     res.status(201).json({
      success: true,
      message: "Blog created successfully",
      blogId: result.insertId,
    });
    }

   

   
  } catch (error) {
    console.error("Error creating blog:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

export const getAllBlog = async (req, res) => {
  try {
    const [blogs] = await pool.query(`SELECT * FROM blogs ORDER BY created_at DESC`);

    res.status(200).json({
      success: true,
      count: blogs.length,
      blogs: blogs,
    });
  } catch (error) {
    console.error("Error fetching blogs:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};




export const deleteBlog = async (req, res) => {
  try {
    const blogId = req.params.id;

    // check blog exists
    const [blogs] = await pool.query(`SELECT * FROM blogs WHERE id = ?`, [
      blogId,
    ]);
    if (blogs.length === 0) {
      return res.status(404).json({ success: false, message: "Blog not found" });
    }

    const blog = blogs[0];

    // if blog has an image, delete from uploads
    if (blog.img) {
      const filePath = path.join(process.cwd(), "uploads", blog.img);

      try {
        await fs.promises.unlink(filePath);
      } catch (err) {
        console.warn("Could not delete file:", filePath, err.message);
      }
    }

    // delete blog from DB
    await pool.query(`DELETE FROM blogs WHERE id = ?`, [blogId]);

    res.json({ success: true, message: "Blog deleted successfully" });
  } catch (error) {
    console.error("Error deleting blog:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

