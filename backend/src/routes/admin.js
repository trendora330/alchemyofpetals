const express = require('express');
const router = express.Router();
const { getAdminMetrics } = require('../controllers/adminController');
const { protect } = require('../middleware/auth');

// 🔍 QUICK DEBUG TO LOGS
console.log('--- DEBUGGING ADMIN ROUTE IMPORTS ---');
console.log('protect middleware exists:', typeof protect !== 'undefined');
console.log('getAdminMetrics controller exists:', typeof getAdminMetrics !== 'undefined');
console.log('------------------------------------');

const verifyAdminRole = (req, res, next) => {
  if (req.user && req.user.role === 'admin') return next();
  return res.status(403).json({ error: 'Access denied.' });
};

router.get('/metrics', protect, verifyAdminRole, getAdminMetrics);

module.exports = router;