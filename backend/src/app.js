const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();

// 1. GLOBAL MIDDLEWARE LAYERS
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));
app.use(express.json());

// 2. IMPORT ROUTE CONTROLLERS (Declared exactly once each)
const authRoutes = require('./routes/auth');
const productRoutes = require('./routes/products');
const paymentRoutes = require('./routes/payments');
const adminRoutes = require('./routes/admin');
const cartRoutes = require('./routes/cart');
const allowedOrigins = [
  'http://localhost:3000',
  'https://alchemyofpetals-cyan.vercel.app',
  process.env.FRONTEND_URL // This will be set inside your Render dashboard later
];

// 3. ROUTE ROUTING GATEWAYS MOUNTING
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/cart', cartRoutes); // 🌿 Added cleanly here!

// 4. FALLBACK ERROR HANDLER SHIELD
app.use((err, req, res, next) => {
  console.error('Express Engine Error Stack:', err.stack);
  res.status(500).json({ 
    success: false, 
    error: err.message || 'Internal Server Crash Instance Handle.' 
  });
});

app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Blocked by CORS security protocol'));
    }
  },
  credentials: true
}));

module.exports = app;