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