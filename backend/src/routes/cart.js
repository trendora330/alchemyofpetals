const express = require('express');
const router = express.Router();
const { 
  getCart, 
  addToCart, 
  updateCartQuantity, 
  removeFromCart, 
  createPaymentOrder, 
  saveOrder, 
  getUserOrders,
  getAdminDashboard,
  adminAddProduct,
  adminModifyProduct
} = require('../controllers/cartController');
const { protect } = require('../middleware/auth');

// Customer Core Shopping Basket Actions
router.get('/', protect, getCart);
router.post('/', protect, addToCart);
router.put('/:id', protect, updateCartQuantity);
router.delete('/:id', protect, removeFromCart);

// Gateway Process Token Mapping Pipelines
router.post('/create-order', protect, createPaymentOrder);
router.post('/confirm-order', protect, saveOrder);
router.get('/history', protect, getUserOrders);

// 📊 Admin Management Control Systems
router.get('/admin/dashboard', protect, getAdminDashboard);
router.post('/admin/products', protect, adminAddProduct);
router.put('/admin/products/:id', protect, adminModifyProduct);

module.exports = router;