const supabase = require('../config/supabase');

// @GET /api/cart - Retrieves all active items in a user's shopping basket
const getCart = async (req, res, next) => {
  try {
    const userId = req.user.id;

    // 1. Try fetching with 'products' (plural) foreign key relationship mapping
    let { data: cartItems, error } = await supabase
      .from('cart')
      .select(`
        id,
        quantity,
        product_id,
        products (
          id,
          name,
          price
        )
      `)
      .eq('user_id', userId);

    // 2. Fallback: If plural fails, instantly try singular 'product' relationship mapping
    if (error) {
      const fallback = await supabase
        .from('cart')
        .select(`
          id,
          quantity,
          product_id,
          product (
            id,
            name,
            price
          )
        `)
        .eq('user_id', userId);
      
      if (!fallback.error) {
        // Normalize the key name so the frontend always sees '.products'
        cartItems = (fallback.data || []).map(item => ({
          ...item,
          products: item.product
        }));
        error = null;
      }
    }

    // If both lookups fail completely, pass the true database error message back
    if (error) {
      return res.status(400).json({ error: error.message });
    }

    // 3. Calculate subtotal aggregates safely
    const total = (cartItems || []).reduce((sum, item) => {
      const price = Number(item.products?.price) || 0;
      const qty = Number(item.quantity) || 0;
      return sum + (price * qty);
    }, 0);

    res.json({ success: true, cartItems: cartItems || [], total });
  } catch (error) {
    next(error);
  }
};

module.exports = { getCart };