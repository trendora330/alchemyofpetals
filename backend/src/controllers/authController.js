const { createClient } = require('@supabase/supabase-js');
const jwt = require('jsonwebtoken');

// Initialize internal configuration states safely from process environment files
const supabaseUrl = process.env.SUPABASE_URL;

// 🔑 FIX: Look for SUPABASE_KEY, fallback to SUPABASE_ANON_KEY so it matches your existing setup!
const supabaseKey = process.env.SUPABASE_KEY || process.env.SUPABASE_ANON_KEY; 
const jwtSecret = process.env.JWT_SECRET || 'your-fallback-jwt-secret-string';
if (!supabaseUrl || !supabaseKey) {
  console.error("🚨 CRITICAL CONFIG ERROR: Missing SUPABASE_URL or SUPABASE_ANON_KEY environment variables!");
}

const supabase = createClient(supabaseUrl, supabaseKey);

// 📝 @POST /api/auth/register - Maps names directly onto user metadata registries
const register = async (req, res, next) => {
  try {
    const { email, password, name } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Please provide both email and password parameters.' });
    }

    // Capture the name and bind it safely inside option details metadata arrays
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name: name || email.split('@')[0],
          full_name: name || email.split('@')[0],
          role: 'buyer' // Assign standard shopper privileges by default
        }
      }
    });

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    return res.status(201).json({
      success: true,
      message: 'User registered successfully into active system instances!',
      user: data.user
    });
  } catch (err) {
    next(err);
  }
};

// 🔑 @POST /api/auth/login - Handles identity mapping and role extraction pipelines
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Missing active sign-in parameters.' });
    }

    const { data, error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      return res.status(401).json({ error: 'Invalid authentication credentials provided.' });
    }

    const user = data.user;

    // Create a local session token to share profile identities with the client layout safely
    const token = jwt.sign(
      { 
        id: user.id, 
        email: user.email,
        user_metadata: user.user_metadata 
      },
      jwtSecret,
      { expiresIn: '7d' }
    );

    return res.json({
      success: true,
      token,
      user: {
        id: user.id,
        email: user.email,
        role: user.user_metadata?.role || 'buyer',
        user_metadata: user.user_metadata
      }
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  register,
  login
};