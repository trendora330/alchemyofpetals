const express = require('express');
const router = express.Router();
const { getCart } = require('../controllers/cartController');
const { protect } = require('../middleware/auth');

// Protect the entire cart sub-tree behind the user authentication token gate
router.get('/', protect, getCart);

module.exports = router;