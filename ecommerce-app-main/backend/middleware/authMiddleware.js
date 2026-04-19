/**
 * ===========================================
 * AUTHENTICATION MIDDLEWARE
 * ===========================================
 * 
 * JWT authentication and authorization middleware.
 * Protects routes and handles role-based access.
 */

const jwt = require('jsonwebtoken');
const { asyncHandler, ApiError } = require('./errorMiddleware');
const User = require('../models/User');

/**
 * Protect routes - require authentication
 * Verifies JWT token and attaches user to request
 */
const protect = asyncHandler(async (req, res, next) => {
  let token;

  // Check for token in Authorization header
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  }
  // Check for token in cookies (alternative method)
  else if (req.cookies && req.cookies.token) {
    token = req.cookies.token;
  }

  // Make sure token exists
  if (!token) {
    throw new ApiError('Not authorized to access this route. Please log in.', 401);
  }

  try {
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Get user from token
    const user = await User.findById(decoded.id).select('-password');

    if (!user) {
      throw new ApiError('User no longer exists', 401);
    }

    // Check if user is active
    if (!user.isActive) {
      throw new ApiError('Your account has been deactivated', 401);
    }

    // Check if user changed password after token was issued
    if (user.changedPasswordAfter(decoded.iat)) {
      throw new ApiError('Password was recently changed. Please log in again.', 401);
    }

    // Grant access - attach user to request
    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      throw new ApiError('Invalid token. Please log in again.', 401);
    }
    if (error.name === 'TokenExpiredError') {
      throw new ApiError('Your session has expired. Please log in again.', 401);
    }
    throw error;
  }
});

/**
 * Optional authentication - doesn't require auth but attaches user if token exists
 */
const optionalAuth = asyncHandler(async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = await User.findById(decoded.id).select('-password');
    } catch (error) {
      // Token invalid but we don't throw error, just continue without user
      req.user = null;
    }
  }

  next();
});

/**
 * Authorize specific roles
 * @param  {...string} roles - Allowed roles
 */
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(new ApiError('Not authorized to access this route', 401));
    }

    if (!roles.includes(req.user.role)) {
      return next(
        new ApiError(
          `User role '${req.user.role}' is not authorized to access this route`,
          403
        )
      );
    }

    next();
  };
};

/**
 * Check if user is admin
 */
const isAdmin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    throw new ApiError('Admin access required', 403);
  }
};

/**
 * Check resource ownership
 * Middleware factory to check if user owns the resource
 * @param {Model} Model - Mongoose model
 * @param {string} idParam - Request param name containing resource ID
 */
const checkOwnership = (Model, idParam = 'id') => {
  return asyncHandler(async (req, res, next) => {
    const resourceId = req.params[idParam];
    const resource = await Model.findById(resourceId);

    if (!resource) {
      throw new ApiError('Resource not found', 404);
    }

    // Admin can access any resource
    if (req.user.role === 'admin') {
      return next();
    }

    // Check ownership (assuming resource has 'user' field)
    if (resource.user && resource.user.toString() !== req.user._id.toString()) {
      throw new ApiError('Not authorized to access this resource', 403);
    }

    next();
  });
};

module.exports = {
  protect,
  optionalAuth,
  authorize,
  isAdmin,
  checkOwnership
};
