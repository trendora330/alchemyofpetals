const express = require('express');
const router = express.Router();
const { getCart, addToCart } = require('../controllers/cartController');
const { protect } = require('../middleware/auth');

// Protect both shopping basket operations behind the user token barrier
router.get('/', protect, getCart);
router.post('/', protect, addToCart);

module.exports = router;