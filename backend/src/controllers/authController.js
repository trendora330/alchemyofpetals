const supabase = require('../config/supabase');
const jwt = require('jsonwebtoken');

// @POST /api/auth/register
const register = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ error: 'All fields (name, email, password) are mandatory' });
    }

    // 1. Check if user profile already exists in our profiles table
    const { data: existingUser, error: checkError } = await supabase
      .from('profiles')
      .select('id')
      .eq('email', email)
      .maybeSingle(); // 🧠 Using maybeSingle safely instead of .substring()

    if (existingUser) {
      return res.status(400).json({ error: 'This email is already registered' });
    }

    // 2. Sign up the user into Supabase's managed Auth system
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
    });

    if (authError || !authData.user) {
      return res.status(400).json({ error: authError?.message || 'Authentication signup registration failed' });
    }

    // 3. Create the profile row matching the generated Auth UUID
    // Note: By default, new signups are marked as 'customer'. You can manually switch this to 'admin' in your database.
    const { data: newProfile, error: profileError } = await supabase
      .from('profiles')
      .insert([
        {
          id: authData.user.id,
          name,
          email,
          role: 'customer', 
        },
      ])
      .select()
      .single();

    if (profileError) {
      return res.status(400).json({ error: profileError.message });
    }

    // 4. Issue a secure internal session token
    const token = jwt.sign(
      { id: newProfile.id, email: newProfile.email, role: newProfile.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      success: true,
      token,
      user: {
        id: newProfile.id,
        name: newProfile.name,
        email: newProfile.email,
        role: newProfile.role,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @POST /api/auth/login
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // 1. Authenticate the user credentials via Supabase Auth service
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError || !authData.user) {
      return res.status(401).json({ error: 'Invalid email or password configurations.' });
    }

    // 2. Fetch the custom profile details including the explicit 'role' string assignment
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, name, email, role')
      .eq('id', authData.user.id)
      .maybeSingle();

    if (profileError || !profile) {
      return res.status(404).json({ error: 'Nursery user profile record not found.' });
    }

    // 3. Generate our secure internal session token containing the active role payload
    const token = jwt.sign(
      { id: profile.id, email: profile.email, role: profile.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    // 4. Return parameters back to the client app store instance
    res.json({
      success: true,
      token,
      user: {
        id: profile.id,
        name: profile.name,
        email: profile.email,
        role: profile.role,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { register, login };