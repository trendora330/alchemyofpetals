const isAdmin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    return res.status(403).json({ error: 'Access denied. Administrator privileges required.' });
  }
};

// Ensure this matches the object structure imported in the router
module.exports = { isAdmin };