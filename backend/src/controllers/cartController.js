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

// @POST /api/cart - Strict action-priority handler to prevent race conditions
const addToCart = async (req, res, next) => {
  try {
    const userId = req.user.id;
    
    const productId = req.body.productId || req.body.product_id || req.body.id;
    if (!productId) {
      return res.status(400).json({ error: 'Product ID is required' });
    }

    const rawQuantity = req.body.quantity;
    // Lowercase the action string so we catch 'decrease', 'Decrease', 'DECREASE', etc.
    const actionSignal = String(req.body.action || req.body.type || req.body.operation || '').toLowerCase();

    // Fetch existing cart row
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
      let targetQuantity = existingItem.quantity;

      // 🚨 PRIORITY 1: Absolute checks for decreasing/minus actions
      if (
        actionSignal.includes('decrease') || 
        actionSignal.includes('decrement') || 
        actionSignal.includes('minus') || 
        rawQuantity === -1
      ) {
        targetQuantity = existingItem.quantity - 1;
      } 
      // 🚨 PRIORITY 2: Absolute checks for increasing/plus actions
      else if (
        actionSignal.includes('increase') || 
        actionSignal.includes('increment') || 
        actionSignal.includes('plus')
      ) {
        targetQuantity = existingItem.quantity + 1;
      } 
      // 🚨 PRIORITY 3: Fallback if the frontend is just pushing an absolute manual input number
      else if (rawQuantity !== undefined) {
        targetQuantity = Number(rawQuantity);
      } else {
        // Simple default increment if no extra signals are sent
        targetQuantity = existingItem.quantity + 1;
      }

      // Safe guard: If quantity drops to 0 or less, strip it from the database table
      if (targetQuantity <= 0) {
        await supabase
          .from('cart')
          .delete()
          .eq('id', existingItem.id);
        return res.json({ success: true, message: 'Item stripped from basket due to zero count' });
      }

      // Update database row with the stable computed number
      const { data, error } = await supabase
        .from('cart')
        .update({ quantity: targetQuantity })
        .eq('id', existingItem.id)
        .select();

      if (error) return res.status(400).json({ error: error.message });
      return res.json({ success: true, message: 'Cart updated successfully', data });

    } else {
      // If adding a fresh item to cart, ensure we start with a clean count of 1
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

// 💳 @POST /api/cart/create-order - Generates verified Razorpay order tokens securely
const createPaymentOrder = async (req, res, next) => {
  try {
    const userId = req.user.id;

    // 1. Fetch live cart items to recalculate total securely on the server side
    const { data: rawCart } = await supabase.from('cart').select('quantity, product_id').eq('user_id', userId);
    const { data: products } = await supabase.from('products').select('id, price');

    if (!rawCart || rawCart.length === 0) {
      return res.status(400).json({ error: 'Cannot create an order for an empty basket.' });
    }

    // Convert everything strictly to rounded numbers to prevent fractional float mismatches
    const secureTotal = rawCart.reduce((sum, item) => {
      const p = products?.find(prod => prod.id === item.product_id);
      const price = Math.round(Number(p?.price || 0));
      const qty = Number(item.quantity || 1);
      return sum + (price * qty);
    }, 0);

    if (secureTotal <= 0) {
      return res.status(400).json({ error: 'Invalid checkout balance total calculation.' });
    }

    // 2. Transmit metadata properties directly to Razorpay's system engines
    const orderOptions = {
      amount: secureTotal * 100, // Amount in paise subunits (e.g. 34900)
      currency: 'INR',
      receipt: `receipt_user_${userId.slice(0, 8)}_${Date.now()}`
    };

    const order = await razorpayClient.orders.create(orderOptions);

    // Return the absolute server-calculated total back to the frontend so they align 100%
    return res.json({
      success: true,
      order_id: order.id,
      amount: order.amount, // Return the absolute paise total (e.g. 34900)
      server_total: secureTotal, // Send back the flat Rupee total (e.g. 349)
      currency: order.currency
    });
  } catch (error) {
    console.error('Order creation failed:', error);
    return res.status(500).json({ error: error.message || 'Failed to initialize system payment order.' });
  }
};

// 📦 @POST /api/cart/confirm-order - Saves verified checkout records to Supabase and clears cart
const saveOrder = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { payment_id, order_id, amount, shippingDetails, items } = req.body;

    if (!payment_id || !order_id) {
      return res.status(400).json({ error: 'Missing critical payment reference tracking metadata.' });
    }

    // 1. Insert snapshot record into your newly created orders table
    const { data: orderData, error: orderError } = await supabase
      .from('orders')
      .insert([{
        user_id: userId,
        payment_id,
        order_id,
        amount: Number(amount),
        recipient_name: shippingDetails.name,
        phone_number: shippingDetails.phone,
        delivery_address: shippingDetails.address,
        city: shippingDetails.city,
        pincode: shippingDetails.pincode,
        items: items
      }])
      .select();

    if (orderError) {
      return res.status(400).json({ error: orderError.message });
    }

    // 2. Clear out the active cart array completely since the purchase went through perfectly
    await supabase
      .from('cart')
      .delete()
      .eq('user_id', userId);

    return res.json({ success: true, message: 'Order archived permanently in Supabase database instance.', orderData });
  } catch (error) {
    next(error);
  }
};

// Make sure to add saveOrder to your module.exports!
module.exports = { getCart, addToCart, updateCartQuantity, removeFromCart, createPaymentOrder, saveOrder };

// Make sure to append these to your module.exports!

