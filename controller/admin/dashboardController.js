import pool from "../../config.js";

/**
 * Get dashboard statistics for admin
 */
export const getDashboardStats = async (req, res) => {
  try {
    // Get today's date range (start and end of today)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayStart = today.toISOString().slice(0, 19).replace('T', ' ');
    const todayEnd = new Date(today);
    todayEnd.setHours(23, 59, 59, 999);
    const todayEndStr = todayEnd.toISOString().slice(0, 19).replace('T', ' ');

    // Total Users
    const [totalUsers] = await pool.query(`SELECT COUNT(*) as total FROM users`);
    const userCount = totalUsers[0].total;

    // Total Products
    const [totalProducts] = await pool.query(`SELECT COUNT(*) as total FROM products`);
    const productCount = totalProducts[0].total;

    // Total Orders
    const [totalOrders] = await pool.query(`SELECT COUNT(*) as total FROM orders`);
    const orderCount = totalOrders[0].total;

    // Today's Revenue (from orders with paid status created today)
    const [todayRevenue] = await pool.query(
      `SELECT COALESCE(SUM(total_amount), 0) as total 
       FROM orders 
       WHERE payment_status = 'paid' 
       AND DATE(created_at) = CURDATE()`
    );
    const todayRevenueAmount = parseFloat(todayRevenue[0].total || 0);

    // Order Status Breakdown
    const [orderStatusBreakdown] = await pool.query(
      `SELECT status, COUNT(*) as count 
       FROM orders 
       GROUP BY status`
    );
    
    // Convert to object for easier access
    const statusBreakdown = {
      pending: 0,
      processing: 0,
      "out for_delivery": 0,
      completed: 0,
      cancelled: 0,
    };
    
    orderStatusBreakdown.forEach((item) => {
      const status = item.status?.toLowerCase() || "pending";
      if (statusBreakdown.hasOwnProperty(status)) {
        statusBreakdown[status] = item.count;
      } else {
        statusBreakdown[status] = item.count;
      }
    });

    // Low Stock Products (stock <= 10)
    const [lowStockProducts] = await pool.query(
      `SELECT id, name, stock 
       FROM products 
       WHERE stock <= 10 AND stock >= 0
       ORDER BY stock ASC 
       LIMIT 10`
    );

    // Recent Orders (last 10 orders)
    const [recentOrders] = await pool.query(
      `SELECT 
        o.id,
        o.status,
        o.payment_status,
        o.total_amount,
        o.created_at,
        u.name AS user_name
       FROM orders o
       LEFT JOIN users u ON o.site_user_id = u.id
       ORDER BY o.created_at DESC
       LIMIT 10`
    );

    // Format recent orders
    const formattedRecentOrders = recentOrders.map((order) => ({
      id: order.id,
      status: order.status || "pending",
      payment_status: order.payment_status || "pending",
      amount: parseFloat(order.total_amount || 0),
      date: order.created_at,
      user_name: order.user_name || "N/A",
    }));

    return res.json({
      success: true,
      data: {
        totalUsers: userCount,
        totalProducts: productCount,
        totalOrders: orderCount,
        todayRevenue: todayRevenueAmount,
        orderStatusBreakdown: statusBreakdown,
        lowStockProducts: lowStockProducts.map((p) => ({
          id: p.id,
          name: p.name,
          stock: p.stock,
        })),
        recentOrders: formattedRecentOrders,
      },
    });
  } catch (error) {
    console.error("Error fetching dashboard stats:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch dashboard statistics",
    });
  }
};
