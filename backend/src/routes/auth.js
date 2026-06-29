const express = require('express');
const router = express.Router();

// 🔑 Pull in your controllers, including the newly added forgotPassword handler
const { 
  login, 
  register, 
  forgotPassword 
} = require('../controllers/authController');

// 📝 @POST /api/auth/register - Handles brand new user record validation layers
router.post('/register', register);

// 🔑 @POST /api/auth/login - Generates user sessions and handles credential verification
router.post('/login', login);

// ✉️ @POST /api/auth/forgot-password - Triggers Supabase password reset link transmissions
router.post('/forgot-password', forgotPassword);

module.exports = router;