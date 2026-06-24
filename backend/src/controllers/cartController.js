const supabase = require('../config/supabase');

// @GET /api/cart - Safe mapping that covers all frontend schema variations
const getCart = async (req, res, next) => {
  try {
    const userId = req.user.id;

    const { data: rawCart, error: fetchError } = await supabase
      .from('cart')
      .select('*') // Pull all raw columns including id, user_id, product_id, created_at
      .eq('user_id', userId);

    if (fetchError) {
      return res.status(400).json({ error: fetchError.message });
    }

    if (!rawCart || rawCart.length === 0) {
      return res.json({ success: true, cartItems: [], total: 0 });
    }

    const productIds = rawCart.map(item => item.product_id || item.productId);
    const { data: products, error: productError } = await supabase
      .from('products') 
      .select('*'); // Pull all columns to catch description, name, price, imageUrl, image_url

    const cartItems = rawCart.map(item => {
      const currentProductId = item.product_id || item.productId;
      const dbProduct = products?.find(p => p.id === currentProductId) || null;

      // Create a unified product object that satisfies both snake_case and camelCase
      const unifiedProduct = dbProduct ? {
        ...dbProduct,
        id: dbProduct.id,
        _id: dbProduct.id,
        productId: dbProduct.id,
        product_id: dbProduct.id,
        name: dbProduct.name || dbProduct.title,
        price: Number(dbProduct.price) || 0,
        image_url: dbProduct.image_url || dbProduct.imageUrl,
        imageUrl: dbProduct.imageUrl || dbProduct.image_url
      } : null;

      // Return the item row with every possible structure your frontend array filters might search for
      return {
        ...item,
        id: item.id,            // Unique cart row ID
        _id: item.id,           // Fallback MongoDB style ID
        product_id: currentProductId,
        productId: currentProductId,
        quantity: Number(item.quantity) || 1,
        product: unifiedProduct,  // Singular fallback
        products: unifiedProduct  // Plural fallback
      };
    });

    const total = cartItems.reduce((sum, item) => {
      const targetProduct = item.product || item.products;
      const price = Number(targetProduct?.price) || 0;
      const qty = Number(item.quantity) || 0;
      return sum + (price * qty);
    }, 0);

    return res.json({ success: true, cartItems, total });
  } catch (error) {
    next(error);
  }
};

// @POST /api/cart - Handles dynamic additions, increments, and decrements safely
const addToCart = async (req, res, next) => {
  try {
    const userId = req.user.id;
    
    const productId = req.body.productId || req.body.product_id || req.body.id;
    // Intercept quantity or target incoming value overrides
    let quantityDelta = req.body.quantity !== undefined ? Number(req.body.quantity) : 1;

    if (!productId) {
      return res.status(400).json({ error: 'Product ID is required' });
    }

    // Check if the item already exists in the user's cart table
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
      // 🌸 SMART LOGIC: 
      // If frontend sends an absolute high target total (like 3) instead of a change (-1),
      // we check if they passed an action parameter, otherwise we add the delta safely.
      let newQuantity = existingItem.quantity + quantityDelta;

      // Handle edge cases where frontend sends the exact intended absolute value directly
      if (req.body.action === 'decrease' || quantityDelta === -1) {
        newQuantity = existingItem.quantity - 1;
      } else if (req.body.action === 'increase' || quantityDelta === 1) {
        newQuantity = existingItem.quantity + 1;
      }

      // If quantity drops to 0 or less, completely strip it from the database instead of breaking
      if (newQuantity <= 0) {
        await supabase
          .from('cart')
          .delete()
          .eq('id', existingItem.id);
        return res.json({ success: true, message: 'Item stripped from basket array due to zero count' });
      }

      // Otherwise, save the updated count row
      const { data, error } = await supabase
        .from('cart')
        .update({ quantity: newQuantity })
        .eq('id', existingItem.id)
        .select();

      if (error) return res.status(400).json({ error: error.message });
      return res.json({ success: true, message: 'Cart updated successfully', data });
    } else {
      // If item doesn't exist yet, make sure we don't insert negative items
      const initialQty = quantityDelta > 0 ? quantityDelta : 1;
      
      const { data, error } = await supabase
        .from('cart')
        .insert([{ user_id: userId, product_id: productId, quantity: initialQty }])
        .select();

      if (error) return res.status(400).json({ error: error.message });
      return res.status(201).json({ success: true, message: 'Added to cart successfully', data });
    }
  } catch (error) {
    next(error);
  }
};

// @PUT /api/cart/:id - Modifies the quantity of a specific item inside the basket
const updateCartQuantity = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const cartItemId = req.params.id; // Reads the ID directly from the URL path
    const { quantity } = req.body;

    if (!quantity || Number(quantity) < 1) {
      return res.status(400).json({ error: 'Valid quantity is required' });
    }

    const { data, error } = await supabase
      .from('cart')
      .update({ quantity: Number(quantity) })
      .eq('id', cartItemId)
      .eq('user_id', userId) // Security check: Ensure this cart item belongs to the logged-in user
      .select();

    if (error) return res.status(400).json({ error: error.message });
    return res.json({ success: true, message: 'Quantity modified successfully', data });
  } catch (error) {
    next(error);
  }
};

// @DELETE /api/cart/:id - Completely drops a specific item row from the basket matrix
const removeFromCart = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const cartItemId = req.params.id;

    const { error } = await supabase
      .from('cart')
      .delete()
      .eq('id', cartItemId)
      .eq('user_id', userId);

    if (error) return res.status(400).json({ error: error.message });
    return res.json({ success: true, message: 'Item stripped from basket array successfully' });
  } catch (error) {
    next(error);
  }
};


// Make sure to append these to your module.exports!
module.exports = { getCart, addToCart, updateCartQuantity, removeFromCart };
