const supabase = require('../config/supabase');

// @GET /api/cart - Retrieves all active items in a user's shopping basket safely
const getCart = async (req, res, next) => {
  try {
    const userId = req.user.id;

    // 1. Fetch flat rows from the cart table
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

    // 2. Query the products table to match details
    const productIds = rawCart.map(item => item.product_id);
    const { data: products, error: productError } = await supabase
      .from('products') 
      .select('id, name, price, image_url')
      .in('id', productIds);

    // 3. Map values into BOTH singular and plural fields to prevent frontend compilation mismatch
    const cartItems = rawCart.map(item => {
      const matchedProduct = products?.find(p => p.id === item.product_id) || null;
      return {
        ...item,
        product: matchedProduct,  // 🌸 Cover singular frontend mapping cases
        products: matchedProduct  // 🌸 Cover plural frontend mapping cases
      };
    });

    // 4. Calculate grand total aggregates using numbers cleanly
    const total = cartItems.reduce((sum, item) => {
      const price = Number(item.product?.price || item.products?.price) || 0;
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
    
    // Accept productId, product_id, or simply id from the frontend request body
    const productId = req.body.productId || req.body.product_id || req.body.id;
    const quantity = req.body.quantity || 1;

    if (!productId) {
      return res.status(400).json({ 
        error: 'Product ID is required', 
        receivedData: req.body // This helps us debug by showing exactly what frontend sent
      });
    }

    // Check if the item is already in the user's cart table
    const { data: existingItem, error: fetchError } = await supabase
      .from('cart')
      .select('id, quantity')
      .eq('user_id', userId)
      .eq('product_id', productId)
      .maybeSingle();

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
      return res.json({ success: true, message: 'Cart updated successfully', data });
    } else {
      // If it doesn't exist, insert a fresh row
      const { data, error } = await supabase
        .from('cart')
        .insert([{ user_id: userId, product_id: productId, quantity: Number(quantity) }])
        .select();

      if (error) return res.status(400).json({ error: error.message });
      return res.status(201).json({ success: true, message: 'Added to cart successfully', data });
    }
  } catch (error) {
    next(error);
  }
};

module.exports = { getCart, addToCart };