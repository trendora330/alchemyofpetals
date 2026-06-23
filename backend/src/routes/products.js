const express = require('express');
const router = express.Router();
const supabase = require('../config/supabase');
const { getAllProducts, getProductBySlug } = require('../controllers/productController');
const { protect } = require('../middleware/auth');
const { isAdmin } = require('../middleware/adminCheck');

// 1. PUBLIC ROUTES (List all plants)
router.get('/', getAllProducts);

// 2. SECURED ADMIN INTERFACE ROUTES 
// (Must be positioned ABOVE the /:slug route so it doesn't get intercepted)
router.post('/', protect, isAdmin, async (req, res, next) => {
  try {
    const { name, price, original_price, stock_quantity, difficulty, tags } = req.body;
    
    // Auto-generate clean URL strings (e.g., "Red Rose" -> "red-rose")
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');

    const { data, error } = await supabase
      .from('products')
      .insert([{ name, slug, price, original_price, stock_quantity, difficulty, tags, is_available: true }])
      .select()
      .single();

    if (error) return res.status(400).json({ error: error.message });
    res.json({ success: true, product: data });
  } catch (error) { next(error); }
});

router.put('/:id', protect, isAdmin, async (req, res, next) => {
  try {
    const { name, price, original_price, stock_quantity, is_available, difficulty, tags } = req.body;
    
    const { data, error } = await supabase
      .from('products')
      .update({ name, price, original_price, stock_quantity, is_available, difficulty, tags })
      .eq('id', req.params.id)
      .select()
      .single();

    if (error) return res.status(400).json({ error: error.message });
    res.json({ success: true, product: data });
  } catch (error) { next(error); }
});

// 3. PUBLIC DETAIL ROUTE (Catch-all slug placed at the absolute bottom)
router.get('/:slug', getProductBySlug);

module.exports = router;