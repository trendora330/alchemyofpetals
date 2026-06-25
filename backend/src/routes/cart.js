const express = require('express');
const router = express.Router();
const { getCart, addToCart, updateCartQuantity, removeFromCart, createPaymentOrder, saveOrder, getUserOrders } = require('../controllers/cartController');
const { protect } = require('../middleware/auth');

router.get('/', protect, getCart);
router.post('/', protect, addToCart);
router.put('/:id', protect, updateCartQuantity);
router.delete('/:id', protect, removeFromCart);

// Razorpay Order Record Pipelines
router.post('/create-order', protect, createPaymentOrder);
router.post('/confirm-order', protect, saveOrder);

// History Pipeline
router.get('/history', protect, getUserOrders); // 👈 Registers our new history fetch endpoint

module.exports = router;