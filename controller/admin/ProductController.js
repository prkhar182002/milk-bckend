import pool from "../../config.js";
import fs from "fs"
import path from "path";
import { fileURLToPath } from "url";


const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);






const createCategory = async (req, res) => {
  try {
    console.log("req.body 👉", req.body);
    console.log("req.file 👉", req.file);

    const { category } = req.body;  // ✅ Multer populates this
    const { filename } = req.file;  // ✅ uploaded image file

    if (!category || !filename) {
      return res.status(400).json({ error: "Category and Image are required" });
    }

    const [store] = await pool.execute(
      `INSERT INTO categories (name, image) VALUES (?, ?)`,
      [category.toLowerCase(), filename]
    );

    return res.json({
      message: "✅ Category added successfully",
      success:true
    });

  } catch (error) {
    console.error("❌ Error:", error);
    res.status(500).json({ error: "Something went wrong" });
  }
};



const getCategory = async(req,res)=>{
  try {
    const [category]= await pool.query(`SELECT * FROM categories`)
    if(category.length ===0){
      return res.json({success:false, message: "No categories found"})
    }

    return res.json({success:true,category});
  } catch (error) {
    console.error("Get Category Error:", error);
    
    // Check if it's a database connection error
    if (error.code === 'ECONNREFUSED' || error.code === 'PROTOCOL_CONNECTION_LOST') {
      return res.status(500).json({
        success: false,
        message: "Database connection failed. Please check if MySQL is running.",
        error: "Database connection error"
      });
    }
    
    return res.status(500).json({
      success: false,
      message: "Error fetching categories",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}



export const deleteCategory = async (req, res) => {
  try {
    const { id } = req.params;

    // 1. Get category details
    const [rows] = await pool.execute(`SELECT image FROM categories WHERE id = ?`, [id]);
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: "Category not found" });
    }

    const category = rows[0];

    // 2. Delete from DB
    await pool.execute(`DELETE FROM categories WHERE id = ?`, [id]);

    // 3. Delete image file
    const imagePath = path.join(__dirname, "../../uploads", category.image);
    fs.unlink(imagePath, (err) => {
      if (err) console.error("Image delete error:", err.message);
    });

    return res.status(200).json({ success: true, message: "Category deleted successfully" });

  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};




export const creatProduct= async(req,res)=>{
  try {
    const {
      category_id,
      name,
      slug,
      description,
      price,
      old_price,
      stock,
      unit_quantity,
      details,
      one_time,
    } = req.body;

    // store multiple filenames
    const imageFiles = req.files.map((file) => file.filename);
    const images = JSON.stringify(imageFiles); // store as JSON in DB

    await pool.execute(
      `INSERT INTO products 
      (category_id, name, slug, description, price, old_price, stock, unit_quantity, details, one_time, images) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        category_id,
        name,
        slug,
        description,
        price,
        old_price || null,
        stock,
        unit_quantity || null,
        details || null,
        one_time ? 1 : 0,
        images,
      ]
    );

    return res.json({ success: true, message: "Product created successfully" });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
}

  export const getallProduct=async(req,res)=>{
try {

const [product]= await pool.query(`
      SELECT 
        p.id,
        p.name,
        p.slug,
        p.description,
        p.price,
        p.old_price,
        p.stock,
        p.images,
        p.one_time,
        p.details,
        p.unit_quantity,
        p.created_at,
        p.updated_at,
        c.name AS category
      FROM products p
      JOIN categories c ON p.category_id = c.id
      ORDER BY p.created_at DESC
    `);
if(product.length ==0){
  return res.json({success:false, message: "No products found"})
}

    // Parse images for each product
    const parsedProducts = product.map(p => ({
      ...p,
      images: safeParseJSON(p.images)
    }));

    return res.json({success:true, product: parsedProducts})

  
} catch (error) {
    console.error("Get All Products Error:", error);
    
    // Check if it's a database connection error
    if (error.code === 'ECONNREFUSED' || error.code === 'PROTOCOL_CONNECTION_LOST') {
      return res.status(500).json({
        success: false,
        message: "Database connection failed. Please check if MySQL is running.",
        error: "Database connection error"
      });
    }
    
    return res.status(500).json({
      success: false,
      message: "Error fetching products",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
}
  }



const getProductByCategory = async (req, res) => {
  try {
    const { category } = req.params;

    if (category === "all") {
      const [product] = await pool.query(`
        SELECT 
          p.id,
          p.name,
          p.slug,
          p.description,
          p.price,
          p.old_price,
          p.stock,
          p.images,
          p.one_time,
          p.details,
          p.unit_quantity,
          p.created_at,
          p.updated_at,
          c.name AS category
        FROM products p
        JOIN categories c ON p.category_id = c.id
        
      `);

      if (product.length === 0) {
        return res.json({ success: false });
      }

      // ✅ Parse images
      const parsedProducts = product.map(p => ({
        ...p,
        images: safeParseJSON(p.images)
      }));

      return res.json({ success: true, product: parsedProducts });
    } else {
      // 1. Find category
      const [categoryRows] = await pool.query(
        `SELECT * FROM categories WHERE name = ?`,
        [category]
      );

      if (categoryRows.length === 0) {
        return res.json({ success: false, message: "Category not found" });
      }

      const cate = categoryRows[0];

      
      const [products] = await pool.query(
        `SELECT 
            p.id,
            p.name,
            p.slug,
            p.description,
            p.price,
            p.old_price,
            p.stock,
            p.images,
            p.one_time,
            p.details,
            p.unit_quantity,
            p.created_at,
            p.updated_at,
            c.name AS category
          FROM products p
          JOIN categories c ON p.category_id = c.id
          WHERE p.category_id = ?
          `,
        [cate.id]
      );

      if (products.length === 0) {
        return res.json({ success: false, message: "No products found" });
      }

      // ✅ Parse images
      const parsedProducts = products.map(p => ({
        ...p,
        images: safeParseJSON(p.images)
      }));

      return res.json({ success: true, product: parsedProducts });
    }
  } catch (error) {
    console.error("Get Product By Category Error:", error);
    
    // Check if it's a database connection error
    if (error.code === 'ECONNREFUSED' || error.code === 'PROTOCOL_CONNECTION_LOST') {
      return res.status(500).json({
        success: false,
        message: "Database connection failed. Please check if MySQL is running.",
        error: "Database connection error"
      });
    }
    
    return res.status(500).json({
      success: false,
      message: "Error fetching products",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};
 
// Helper function to safely parse JSON
function safeParseJSON(str) {
  try {
    return JSON.parse(str);
  } catch (e) {
    return []; // fallback if invalid JSON
  }
}

const getSinglePRoduct=async(req,res)=>{
try {
  const {slug}=req.params;

  const [rows] = await pool.query(`SELECT * FROM products WHERE slug = ?`,[slug]);
  if(rows.length === 0){
    return res.json({success:false, message: "Product not found"})
  }
  
  const product = rows[0];
  // Parse images if stored as JSON string
  if (product.images && typeof product.images === 'string') {
    product.images = safeParseJSON(product.images);
  }
  
  return res.json({success:true,product});
} catch (error) {
  console.error("Error fetching product:", error);
  return res.json({success:false, message: error.message});
}


}




// Search products by name
const searchProduct = async (req, res) => {
  try {
    const { search } = req.params;

    if (!search) {
      return res.status(400).json({ message: "Search term is required" });
    }

    const [products] = await pool.query(
      "SELECT * FROM products WHERE name LIKE ?",
      [`%${search}%`]
    );

    if (products.length === 0) {
      return res.status(404).json({ message: "No products found" });
    }

    return res.json({
      success: true,
      count: products.length,
      data: products,
    });
  } catch (error) {
    console.error("Error searching products:", error);
    return res.status(500).json({ message: "Server error" });
  }
};










export const Categorycontroler={
   createCategory ,
   getCategory,
   deleteCategory,
   creatProduct,
   getallProduct,
   getProductByCategory,
   getSinglePRoduct,
   searchProduct,
}

