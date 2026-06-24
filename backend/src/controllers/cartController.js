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

// @POST /api/cart - Ultimate flexible handler for addition, absolute updates, and decrements
const addToCart = async (req, res, next) => {
  try {
    const userId = req.user.id;
    
    // 1. Identify product reference keys
    const productId = req.body.productId || req.body.product_id || req.body.id;
    if (!productId) {
      return res.status(400).json({ error: 'Product ID is required' });
    }

    // 2. Extract potential quantity or operational signals from the frontend payload
    const rawQuantity = req.body.quantity;
    const actionSignal = req.body.action || req.body.type || req.body.operation;

    // Check if the item already exists in the user's database cart table
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
      let targetQuantity = existingItem.quantity + 1; // Default fallback action fallback: increment

      // CASE A: Frontend explicitly told us to decrease/decrement via strings
      if (
        actionSignal === 'decrease' || 
        actionSignal === 'decrement' || 
        actionSignal === 'minus' || 
        rawQuantity === -1
      ) {
        targetQuantity = existingItem.quantity - 1;
      }
      // CASE B: Frontend explicitly told us to increase/increment via strings
      else if (actionSignal === 'increase' || actionSignal === 'increment' || actionSignal === 'plus') {
        targetQuantity = existingItem.quantity + 1;
      }
      // CASE C: Frontend is passing an ABSOLUTE target number (e.g., current is 4, click minus, sends 3)
      else if (rawQuantity !== undefined && Number(rawQuantity) !== 1) {
        targetQuantity = Number(rawQuantity);
      }

      // If calculation determines the cart row drops to 0 or less, strip it cleanly
      if (targetQuantity <= 0) {
        await supabase
          .from('cart')
          .delete()
          .eq('id', existingItem.id);
        return res.json({ success: true, message: 'Item stripped from basket array due to zero count' });
      }

      // Otherwise, save the verified absolute quantity to the database row
      const { data, error } = await supabase
        .from('cart')
        .update({ quantity: targetQuantity })
        .eq('id', existingItem.id)
        .select();

      if (error) return res.status(400).json({ error: error.message });
      return res.json({ success: true, message: 'Cart updated successfully', data });

    } else {
      // If item doesn't exist yet, insert a clean row with an absolute fallback value of 1 or higher
      const initialQty = rawQuantity !== undefined && Number(rawQuantity) > 0 ? Number(rawQuantity) : 1;
      
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
