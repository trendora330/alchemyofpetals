const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const Razorpay = require('razorpay');
const supabase = require('../config/supabase');
const { protect } = require('../middleware/auth');

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// @POST /api/payments/order - Creates a new Razorpay Order session
router.post('/order', protect, async (req, res, next) => {
  try {
    const { amount } = req.body;
    const options = {
      amount: amount * 100, // Razorpay works in paise
      currency: 'INR',
      receipt: `receipt_${Date.now()}`,
    };

    const order = await razorpay.orders.create(options);
    res.json({ success: true, order });
  } catch (error) {
    next(error);
  }
});

// @POST /api/payments/verify - Validates payment signature and logs order to Supabase
router.post('/verify', protect, async (req, res, next) => {
  try {
    const { 
      razorpay_order_id, 
      razorpay_payment_id, 
      razorpay_signature,
      addressDetails,
      cartItems,
      totalAmount 
    } = req.body;

    const userId = req.user.id;

    // 1. Verify the Razorpay cryptographic signature
    const hmac = crypto.createHmac('sha256', process.env.RAZORPAY_KEY_SECRET);
    hmac.update(razorpay_order_id + '|' + razorpay_payment_id);
    const generatedSignature = hmac.digest('hex');

    if (generatedSignature !== razorpay_signature) {
      return res.status(400).json({ error: 'Payment signature validation failed.' });
    }

    // 2. Insert primary order record into Supabase
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert([
        {
          user_id: userId,
          customer_name: addressDetails.name,
          phone: addressDetails.phone,
          delivery_address: `${addressDetails.address_line}, ${addressDetails.city}, ${addressDetails.pincode}`,
          total_amount: totalAmount,
          razorpay_order_id,
          razorpay_payment_id,
          status: 'Pending'
        }
      ])
      .select()
      .single();

    if (orderError) return res.status(400).json({ error: orderError.message });

    // 3. Batch insert order line-items if they exist
    if (cartItems && cartItems.length > 0) {
      const itemsPayload = cartItems.map(item => ({
        order_id: order.id,
        product_id: item.product_id,
        quantity: item.quantity,
        price: item.products?.price || 0
      }));

      const { error: itemsError } = await supabase.from('order_items').insert(itemsPayload);
      if (itemsError) console.error('Error recording order items:', itemsError.message);
    }

    // 4. Clear shopping cart upon checkout validation
    await supabase.from('cart').delete().eq('user_id', userId);

    res.json({ success: true, message: 'Payment verified and order recorded.' });
  } catch (error) {
    next(error);
  }
});

module.exports = router;