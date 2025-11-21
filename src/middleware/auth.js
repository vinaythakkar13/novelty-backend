import jwt from 'jsonwebtoken';

/**
 * JWT Authentication Middleware
 * Verifies JWT tokens for protected routes with enhanced security
 */
export const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN
  console.log("Authenticating token:", token);

  if (!token) {
    return res.status(401).json({ 
      success: false, 
      message: 'Access token required',
      code: 'MISSING_TOKEN'
    });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    console.log("Token verification result:", err, user);
    if (err) {
      let message = 'Invalid or expired token';
      let code = 'INVALID_TOKEN';
      
      if (err.name === 'TokenExpiredError') {
        message = 'Token has expired. Please login again.';
        code = 'TOKEN_EXPIRED';
      } else if (err.name === 'JsonWebTokenError') {
        message = 'Invalid token format';
        code = 'INVALID_TOKEN_FORMAT';
      }
      
      return res.status(403).json({ 
        success: false, 
        message,
        code,
        expiredAt: err.expiredAt || null
      });
    }
    
    // Add user info to request object
    req.user = user;
    next();
  });
};

/**
 * Admin Role Middleware
 * Ensures the authenticated user has admin role
 */
export const requireAdmin = (req, res, next) => {
  console.log(req.user, "user in requireAdmin");
  if (!req.user) {
    return res.status(401).json({ 
      success: false, 
      message: 'Authentication required' 
    });
  }

  if (req.user.role !== 'admin') {
    return res.status(403).json({ 
      success: false, 
      message: 'Admin access required' 
    });
  }

  next();
};

export const requireStaffOrAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ 
      success: false, 
      message: 'Authentication required' 
    });
  }
  
  if (req.user.role !== 'staff' && req.user.role !== 'admin') {
    return res.status(403).json({ 
      success: false, 
      message: 'Staff or admin access required' 
    });
  }

  next();
};

export const requireStaff = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ 
      success: false, 
      message: 'Authentication required' 
    });
  }
  if (req.user.role !== 'staff') {
    return res.status(403).json({ 
      success: false, 
      message: 'Staff access required' 
    });
  }
  next();
};

/**
 * Generate JWT Token
 * Utility function to create secure JWT tokens with 2-hour expiration
 */
export const generateToken = (payload, expiresIn = '2h') => {
  return jwt.sign(payload, process.env.JWT_SECRET, { 
    expiresIn,
    issuer: 'noverlty',
  });
};

/**
 * Verify JWT Token
 * Utility function to verify JWT tokens
 */
export const verifyToken = (token) => {
  try {
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch (error) {
    return null;
  }
};
