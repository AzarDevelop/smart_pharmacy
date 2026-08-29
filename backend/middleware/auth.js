const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Verifies the JWT sent as "Authorization: Bearer <token>"
const protect = async (req, res, next) => {
  try {
    const header = req.headers.authorization || '';
    if (!header.startsWith('Bearer ')) {
      res.status(401);
      throw new Error('Not authorised, no token provided');
    }
    const token = header.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select('-password');
    if (!user) {
      res.status(401);
      throw new Error('Not authorised, user no longer exists');
    }
    if (user.status === 'blocked') {
      res.status(403);
      throw new Error('This account has been blocked by the admin');
    }
    req.user = user;
    next();
  } catch (error) {
    if (!res.statusCode || res.statusCode === 200) res.status(401);
    next(error);
  }
};

// Restricts a route to one or more roles: authorize('admin'), authorize('pharmacy','admin')
const authorize = (...roles) => (req, res, next) => {
  if (!req.user || !roles.includes(req.user.role)) {
    res.status(403);
    return next(new Error('You do not have permission to access this resource'));
  }
  next();
};

module.exports = { protect, authorize };
