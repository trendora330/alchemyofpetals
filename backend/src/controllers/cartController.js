const supabase = require('../config/supabase');

// @GET /api/cart - Retrieves all active items in a user's shopping basket safely
const getCart = async (req, res, next) => {
  try {
    const userId = req.user.id;

    // 1. Try a completely flat fetch first to ensure we don't break authentication loops
    const { data: rawCart, error: fetchError } = await supabase
      .from('cart')
      .select('id, quantity, product_id')
      .eq('user_id', userId);

    if (fetchError) {
      return res.status(400).json({ error: fetchError.message });
    }

    if (!rawCart || rawCart.length === 0) {
      return res.json({ success: true, cartItems: [], total: 0 });
    }

    // 2. Fetch all products matching the product IDs in the cart manually to bypass strict relation foreign key naming bugs
    const productIds = rawCart.map(item => item.product_id);
    const { data: products, error: productError } = await supabase
      .from('products') // 👈 If your table is singular, change this to 'product'
      .select('id, name, price, image_url')
      .in('id', productIds);

    // 3. Combine them manually in Javascript
    const cartItems = rawCart.map(item => {
      const matchedProduct = products?.find(p => p.id === item.product_id) || null;
      return {
        ...item,
        products: matchedProduct
      };
    });

    // 4. Calculate total aggregates safely
    const total = cartItems.reduce((sum, item) => {
      const price = Number(item.products?.price) || 0;
      const qty = Number(item.quantity) || 0;
      return sum + (price * qty);
    }, 0);

    return res.json({ success: true, cartItems, total });
  } catch (error) {
    next(error);
  }
};

// @POST /api/cart - Adds an item to the shopping basket or increments its quantity
const addToCart = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { productId, quantity = 1 } = req.body;

    if (!productId) {
      return res.status(400).json({ error: 'Product ID is required' });
    }

    // Check if the item is already in the user's cart
    const { data: existingItem, error: fetchError } = await supabase
      .from('cart')
      .select('id, quantity')
      .eq('user_id', userId)
      .eq('product_id', productId)
      .maybeSingle(); // Safely handle single row selection

    if (fetchError) {
      return res.status(400).json({ error: fetchError.message });
    }

    if (existingItem) {
      // If it exists, increment the quantity
      const { data, error } = await supabase
        .from('cart')
        .update({ quantity: existingItem.quantity + Number(quantity) })
        .eq('id', existingItem.id)
        .select();

      if (error) return res.status(400).json({ error: error.message });
      return res.json({ success: true, message: 'Cart updated', data });
    } else {
      // If it doesn't exist, insert a fresh row
      const { data, error } = await supabase
        .from('cart')
        .insert([{ user_id: userId, product_id: productId, quantity: Number(quantity) }])
        .select();

      if (error) return res.status(400).json({ error: error.message });
      return res.status(201).json({ success: true, message: 'Added to cart', data });
    }
  } catch (error) {
    next(error);
  }
};

module.exports = { getCart, addToCart };