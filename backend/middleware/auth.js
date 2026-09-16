const jwt = require('jsonwebtoken');

const SECRET_KEY = process.env.SECRET_KEY || 'your-super-secret-key-change-in-production';

// Strict Authentication Middleware (Requires Valid Token)
const authenticateUser = (req, res, next) => {
  let token = null;
  const authHeader = req.headers['authorization'];
  
  if (authHeader) {
    if (authHeader.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1].trim();
    } else {
      token = authHeader.trim();
    }
  }

  if (!token) {
    return res.status(401).json({ detail: 'Authentication credentials were not provided' });
  }

  try {
    const decoded = jwt.verify(token, SECRET_KEY);
    const userId = decoded.id;
    const role = decoded.role || 'customer';
    const email = decoded.sub;

    if (userId === undefined || userId === null) {
      return res.status(401).json({ detail: 'Invalid token payload' });
    }

    req.user = { id: userId, role, email };
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ detail: 'Session expired. Please log in again.' });
    }
    return res.status(401).json({ detail: 'Invalid authentication token' });
  }
};

// Optional Authentication Middleware (Extracts User if Token Exists)
const optionalUser = (req, res, next) => {
  let token = null;
  const authHeader = req.headers['authorization'];
  
  if (authHeader) {
    if (authHeader.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1].trim();
    } else {
      token = authHeader.trim();
    }
  }

  if (token) {
    try {
      const decoded = jwt.verify(token, SECRET_KEY);
      req.user = { id: decoded.id, role: decoded.role || 'customer', email: decoded.sub };
    } catch {
      req.user = null;
    }
  } else {
    req.user = null;
  }
  next();
};

// Role Guard (e.g. Admin or Hotel Partner)
const requireRole = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ detail: 'Access forbidden: Insufficient permissions' });
    }
    next();
  };
};

module.exports = {
  SECRET_KEY,
  authenticateUser,
  optionalUser,
  requireRole
};
