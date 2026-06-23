const supabase = require('../config/supabase');

// @GET /api/products
const getAllProducts = async (req, res, next) => {
  try {
    const { category, featured, search } = req.query;

    let query = supabase
      .from('products')
      .select('*, categories(name, slug)')
      .eq('is_available', true);

    // Apply active filters if they exist in the query string
    if (featured === 'true') {
      query = query.eq('is_featured', true);
    }
    if (search) {
      query = query.ilike('name', `%${search}%`);
    }

    const { data: products, error } = await query;

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    // Filter by category slug manually if specified
    let filteredProducts = products;
    if (category) {
      filteredProducts = products.filter(
        p => p.categories && p.categories.slug === category
      );
    }

    res.json({
      success: true,
      count: filteredProducts.length,
      products: filteredProducts,
    });
  } catch (error) {
    next(error);
  }
};

// @GET /api/products/:slug
const getProductBySlug = async (req, res, next) => {
  try {
    const { slug } = req.params;

    const { data: product, error } = await supabase
      .from('products')
      .select('*, categories(name, slug)')
      .eq('slug', slug)
      .single();

    if (error || !product) {
      return res.status(404).json({ error: 'Plant variety not found' });
    }

    res.json({
      success: true,
      product,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAllProducts,
  getProductBySlug,
};