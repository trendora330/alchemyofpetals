const razorpay = require('../config/razorpay');
const crypto = require('crypto');
const supabase = require('../config/supabase');

// @POST /api/payments/create-order
const createPaymentOrder = async (req, res, next) => {
  try {
    // 1. Fetch user's active cart items to calculate the true aggregate amount
    const { data: cartItems, error: cartError } = await supabase
      .from('cart')
      .select('quantity, products(price, stock_quantity, is_available)')
      .eq('user_id', req.user.id);

    if (cartError || !cartItems || cartItems.length === 0) {
      return res.status(400).json({ error: 'Your shopping basket is empty' });
    }

    const totalAmount = cartItems.reduce((sum, item) => {
      if (!item.products) return sum;
      return sum + (item.products.price * item.quantity);
    }, 0);

    // Apply delivery fee bump rules (e.g., Free delivery above ₹500, else ₹50)
    const shippingAmount = totalAmount >= 500 ? 0 : 50;
    const finalAmountInRupees = totalAmount + shippingAmount;

    // 2. Razorpay takes amounts in PAISE (1 Rupee = 100 Paise)
    const options = {
      amount: Math.round(finalAmountInRupees * 100), 
      currency: 'INR',
      receipt: `receipt_order_${Date.now()}`,
    };

    const order = await razorpay.orders.create(options);

    res.json({
      success: true,
      order,
      key_id: process.env.RAZORPAY_KEY_ID, // Expose public key id for frontend SDK mount
    });
  } catch (error) {
    next(error);
  }
};

// @POST /api/payments/verify
const verifyPayment = async (req, res, next) => {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
    } = req.body;

    // 1. Cryptographically verify signature to ensure it came from Razorpay servers
    const sign = razorpay_order_id + '|' + razorpay_payment_id;
    const expectedSign = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(sign)
      .digest('hex');

    if (razorpay_signature !== expectedSign) {
      return res.status(400).json({ error: 'Payment signature validation process failed. Fraud detected.' });
    }

    // 2. Clear out user's cart rows upon successful transaction completion
    const { data: cartItems } = await supabase
      .from('cart')
      .select('product_id, quantity')
      .eq('user_id', req.user.id);

    // 3. Deduct purchased plant stock from nursery inventory automatically
    if (cartItems) {
      for (const item of cartItems) {
        const { data: product } = await supabase
          .from('products')
          .select('stock_quantity')
          .eq('id', item.product_id)
          .single();

        if (product) {
          await supabase
            .from('products')
            .update({ stock_quantity: Math.max(0, product.stock_quantity - item.quantity) })
            .eq('id', item.product_id);
        }
      }
    }

    // Wipe the user's cart rows clean
    await supabase.from('cart').delete().eq('user_id', req.user.id);

    res.json({
      success: true,
      message: 'Payment verified successfully! Your nursery order has been confirmed. 🌿🌸',
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { createPaymentOrder, verifyPayment };