const express = require('express');
const router = express.Router();
const multer = require('multer'); // 📦 Import multer file parser
const { 
  getCart, addToCart, updateCartQuantity, removeFromCart, createPaymentOrder, saveOrder, getUserOrders,
  getAdminDashboard, adminAddProduct, adminModifyProduct, adminDeleteProduct, uploadProductImage
} = require('../controllers/cartController');
const { protect } = require('../middleware/auth');

// Setup storage allocation memory parameters for file reception processing streams
const upload = multer({ storage: multer.memoryStorage() });

// Core Shopping Customer Actions
router.get('/', protect, getCart);
router.post('/', protect, addToCart);
router.put('/:id', protect, updateCartQuantity);
router.delete('/:id', protect, removeFromCart);

// Gateway Process Checkout Triggers
router.post('/create-order', protect, createPaymentOrder);
router.post('/confirm-order', protect, saveOrder);
router.get('/history', protect, getUserOrders);

// 📊 Admin Infrastructure Management Hub
router.get('/admin/dashboard', protect, getAdminDashboard);
router.post('/admin/products', protect, adminAddProduct);
router.put('/admin/products/:id', protect, adminModifyProduct);
router.delete('/admin/products/:id', protect, adminDeleteProduct); // Added delete route for admin

// 📸 New Image Upload Pipeline Route Hook
router.post('/admin/upload', protect, upload.single('image'), uploadProductImage); 

module.exports = router;