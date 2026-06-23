const jwt = require('jsonwebtoken');
const supabase = require('../config/supabase');

const protect = async (req, res, next) => {
  try {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({ error: 'Access denied. Missing auth session token.' });
    }

    // Verify cryptographic signature
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const { data: user, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', decoded.id)
      .single();

    if (error || !user) {
      return res.status(401).json({ error: 'User mapping session has expired' });
    }

    req.user = user; // Append authenticated user profile to global request state
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Token validation process failed' });
  }
};

module.exports = { protect };