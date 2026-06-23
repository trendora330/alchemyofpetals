const express = require('express');
const router = express.Router();
const { register, login } = require('../controllers/authController');
const { protect } = require('../middleware/auth');

// 1. Public Authentication Entrypoints
router.post('/register', register);
router.post('/login', login);

// 2. Protected Session Identity Endpoint
// Ensure this sits cleanly above any catch-all routing logic
router.get('/me', protect, (req, res) => {
  res.json({
    success: true,
    user: {
      id: req.user.id,
      name: req.user.name,
      email: req.user.email,
      role: req.user.role
    }
  });
});

module.exports = router;