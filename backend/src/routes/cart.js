const express = require('express');
const router = express.Router();
const { getCart, addToCart, updateCartQuantity, removeFromCart } = require('../controllers/cartController');
const { protect } = require('../middleware/auth');

// Base routes
router.get('/', protect, getCart);
router.post('/', protect, addToCart);

// Parametric modifier routes for editing counts or clearing entries
router.put('/:id', protect, updateCartQuantity);
router.delete('/:id', protect, removeFromCart);

module.exports = router;