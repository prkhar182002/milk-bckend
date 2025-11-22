import pool from "../../config.js";

export const AddtoCart = async (req, res) => {
  try {
    const { user } = req; 
    const { product_id, price } = req.body;

    if (!user) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    if (!product_id || !price) {
      return res
        .status(400)
        .json({ success: false, message: "Product ID and price are required" });
    }


    const [existingCart] = await pool.query(`SELECT * FROM carts where product_id = ? 
      AND user_id = ? `,[product_id,user.id])
if(existingCart.length > 0){
    return res
        .json({ success: true, message: "Allready in cart" });
}
    await pool.execute(
      `INSERT INTO carts (product_id, price, user_id) VALUES (?, ?, ?)`,
      [product_id, price, user.id]
    );

    return res.json({
      success: true,
      message: "Product added to cart successfully",
    });
  } catch (error) {
    console.error("Add to cart error:", error);
    
    // Check if it's a database connection error
    if (error.code === 'ECONNREFUSED' || error.code === 'PROTOCOL_CONNECTION_LOST') {
      return res.status(503).json({
        success: false,
        message: "Database connection failed. Please check if MySQL is running.",
        error: "Database connection error"
      });
    }
    
    return res.status(500).json({
      success: false,
      message: "Something went wrong",
      error: error.message,
    });
  }
};

export const allReadyInCArt=async(req,res)=>{
try {
    const { user } = req; 
    const { product_id } = req.params;

    const [cartRows] = await pool.query(`SELECT * FROM carts WHERE product_id = ? AND  user_id = ?`,[product_id,user.id])

if(cartRows.length > 0){
  return res.json({success:true,message:"Allready in cart"})
}
else{
    return res.json({success:false,message:"Not in cart"})
}
} catch (error) {
    console.error("Error checking cart:", error);
    return res.json({success:false, message: error.message});
}




}


export const GetAllCart=async(req,res)=>{
try {
  const { user } = req;

  const [carts] = await pool.query(
    `SELECT 
        carts.id AS cart_id,
        carts.user_id,
        carts.product_id,
        carts.quantity,
        carts.price AS cart_price,
        (carts.quantity * carts.price) AS total_price,
        products.name,
        products.price AS product_price,
        products.images
     FROM carts
     INNER JOIN products ON carts.product_id = products.id
     WHERE carts.user_id = ?`,
    [user.id]
  );

  if (!carts.length) {
    return res.json({ success: false, message: "Cart is empty" });
  }

  // Parse images if stored as JSON string
  const parsedCarts = carts.map(cart => ({
    ...cart,
    images: typeof cart.images === 'string' ? JSON.parse(cart.images) : cart.images
  }));

  return res.json({ success: true, carts: parsedCarts });
} catch (error) {
  console.error("Error fetching cart:", error);
  
  // Check if it's a database connection error
  if (error.code === 'ECONNREFUSED' || error.code === 'PROTOCOL_CONNECTION_LOST') {
    return res.status(503).json({
      success: false,
      message: "Database connection failed. Please check if MySQL is running.",
      error: "Database connection error"
    });
  }
  
  return res.status(500).json({ success: false, message: "Server error" });
}


}


export const UpdateCart = async (req, res) => {
  try {
    const cartId = req.params.id;
    const { increment } = req.body;

    // 1. Fetch the current cart row
    const [cartRows] = await pool.execute(
      `SELECT * FROM carts WHERE id = ?`,
      [cartId]
    );

    if (cartRows.length === 0) {
      return res.status(404).json({ success: false, message: "Cart not found" });
    }

    const cart = cartRows[0];

    let newQuantity = cart.quantity;
    if (increment) {
      newQuantity += 1;
    } else {
      newQuantity = Math.max(1, newQuantity - 1); // prevent going below 1
    }

    // 3. Recalculate total price
    const totalPrice = (newQuantity * cart.price).toFixed(2);

    // 4. Update DB
    await pool.execute(
      `UPDATE carts SET quantity = ?, updated_at = NOW() WHERE id = ?`,
      [newQuantity, cartId]
    );

    return res.json({
      success: true,
      message: "Cart updated successfully",
      cart: {
        id: cartId,
        product_id: cart.product_id,
        quantity: newQuantity,
        unit_price: cart.price,
        total_price: totalPrice,
      },
    });
  } catch (error) {
    console.error("Error updating cart:", error);
    
    // Check if it's a database connection error
    if (error.code === 'ECONNREFUSED' || error.code === 'PROTOCOL_CONNECTION_LOST') {
      return res.status(503).json({
        success: false,
        message: "Database connection failed. Please check if MySQL is running.",
        error: "Database connection error"
      });
    }
    
    res.status(500).json({ success: false, message: "Server error" });
  }
};

export const deleteCart = async (req, res) => {
  try {
    const cartId = req.params.id;

    // Check if cart exists
    const [cartRows] = await pool.execute(
      `SELECT * FROM carts WHERE id = ?`,
      [cartId]
    );

    if (cartRows.length === 0) {
      return res.status(404).json({ success: false, message: "Cart not found" });
    }

    const cart = cartRows[0];

    // Delete cart row
    await pool.execute(`DELETE FROM carts WHERE id = ?`, [cartId]);

    return res.json({
      success: true,
      message: "Cart deleted successfully",
      deleted_cart: cart
    });
  } catch (error) {
    console.error("Error deleting cart:", error);
    
    // Check if it's a database connection error
    if (error.code === 'ECONNREFUSED' || error.code === 'PROTOCOL_CONNECTION_LOST') {
      return res.status(503).json({
        success: false,
        message: "Database connection failed. Please check if MySQL is running.",
        error: "Database connection error"
      });
    }
    
    res.status(500).json({ success: false, message: "Server error" });
  }
};

export const getSingleCart = async (req, res) => {
  try {
    const cartId = req.params.id;

    // Query cart with product details
   const [cartRows] = await pool.execute(
  `SELECT 
      carts.id AS cart_id,
      carts.user_id,
      carts.product_id,
      carts.quantity,
      carts.price AS cart_price,
      (carts.quantity * carts.price) AS total_price,
      products.id AS product_id,
      products.name,
      products.one_time,
      products.description,
      products.price AS product_price,
      products.images
   FROM carts
   INNER JOIN products ON carts.product_id = products.id
   WHERE carts.id = ?`,
  [cartId]
);


    if (cartRows.length === 0) {
      return res.status(404).json({ success: false, message: "Cart not found" });
    }

    const cart = cartRows[0];

    return res.json({ success: true, cart });
  } catch (error) {
    console.error("Error fetching cart:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};
