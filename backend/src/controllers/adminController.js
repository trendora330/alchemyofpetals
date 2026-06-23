const supabase = require('../config/supabase');

// 🌿 Main controller function defined clearly
const getAdminMetrics = async (req, res, next) => {
  try {
    // 1. Fetch all products to safely calculate stock valuation metrics
    const { data: products, error: productError } = await supabase
      .from('products')
      .select('price, stock_quantity');

    if (productError) {
      return res.status(400).json({ error: productError.message });
    }

    const safeProducts = products || [];

    const totalInventoryValue = safeProducts.reduce((sum, p) => {
      const price = Number(p.price) || 0;
      const qty = Number(p.stock_quantity) || 0;
      return sum + (price * qty);
    }, 0);

    const outOfStockCount = safeProducts.filter(p => (Number(p.stock_quantity) || 0) === 0).length;
    const totalCatalogItems = safeProducts.length;

    // 2. Fetch real live incoming customer orders from the orders database table
    const { data: orders, error: orderError } = await supabase
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false });

    if (orderError) {
      return res.status(400).json({ error: orderError.message });
    }

    // 3. Optional analytics metrics fallback placeholders
    const estimatedVisits = 1480; 
    const salesTrendData = [45, 37, 33, 22, 28, 35, 30, 56, 40, 23, 35, 40]; 

    res.json({
      success: true,
      metrics: {
        totalInventoryValue,
        estimatedVisits,
        totalCatalogItems,
        outOfStockCount,
        salesTrendData,
        recentOrders: orders || []
      }
    });
  } catch (error) {
    next(error);
  }
};

// 🧠 CRITICAL EXPORT LAYER: This matches exactly what the router destructures!
module.exports = { getAdminMetrics };