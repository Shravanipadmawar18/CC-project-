/**
 * ===========================================
 * VALIDATION MIDDLEWARE
 * ===========================================
 * 
 * Input validation using express-validator.
 * Validates request data before processing.
 */

const { body, param, query, validationResult } = require('express-validator');
const { ApiError } = require('./errorMiddleware');

/**
 * Process validation results
 * Throws error if validation fails
 */
const validate = (req, res, next) => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    const errorMessages = errors.array().map(err => ({
      field: err.path,
      message: err.msg
    }));
    
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errorMessages
    });
  }
  
  next();
};

// ===========================================
// AUTH VALIDATIONS
// ===========================================

const registerValidation = [
  body('name')
    .trim()
    .notEmpty().withMessage('Name is required')
    .isLength({ min: 2, max: 50 }).withMessage('Name must be between 2 and 50 characters'),
  
  body('email')
    .trim()
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Please provide a valid email')
    .normalizeEmail(),
  
  body('password')
    .notEmpty().withMessage('Password is required')
    .isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  
  validate
];

const loginValidation = [
  body('email')
    .trim()
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Please provide a valid email')
    .normalizeEmail(),
  
  body('password')
    .notEmpty().withMessage('Password is required'),
  
  validate
];

// ===========================================
// PRODUCT VALIDATIONS
// ===========================================

const productValidation = [
  body('name')
    .trim()
    .notEmpty().withMessage('Product name is required')
    .isLength({ max: 200 }).withMessage('Product name cannot exceed 200 characters'),
  
  body('description')
    .trim()
    .notEmpty().withMessage('Product description is required')
    .isLength({ max: 2000 }).withMessage('Description cannot exceed 2000 characters'),
  
  body('price')
    .notEmpty().withMessage('Price is required')
    .isFloat({ min: 0 }).withMessage('Price must be a positive number'),
  
  body('category')
    .notEmpty().withMessage('Category is required')
    .isMongoId().withMessage('Invalid category ID'),
  
  body('stock')
    .optional()
    .isInt({ min: 0 }).withMessage('Stock must be a non-negative integer'),
  
  body('discount')
    .optional()
    .isFloat({ min: 0, max: 100 }).withMessage('Discount must be between 0 and 100'),
  
  validate
];

const productUpdateValidation = [
  body('name')
    .optional()
    .trim()
    .isLength({ max: 200 }).withMessage('Product name cannot exceed 200 characters'),
  
  body('description')
    .optional()
    .trim()
    .isLength({ max: 2000 }).withMessage('Description cannot exceed 2000 characters'),
  
  body('price')
    .optional()
    .isFloat({ min: 0 }).withMessage('Price must be a positive number'),
  
  body('category')
    .optional()
    .isMongoId().withMessage('Invalid category ID'),
  
  body('stock')
    .optional()
    .isInt({ min: 0 }).withMessage('Stock must be a non-negative integer'),
  
  validate
];

// ===========================================
// CATEGORY VALIDATIONS
// ===========================================

const categoryValidation = [
  body('name')
    .trim()
    .notEmpty().withMessage('Category name is required')
    .isLength({ max: 100 }).withMessage('Category name cannot exceed 100 characters'),
  
  body('description')
    .optional()
    .trim()
    .isLength({ max: 500 }).withMessage('Description cannot exceed 500 characters'),
  
  body('parent')
    .optional()
    .isMongoId().withMessage('Invalid parent category ID'),
  
  validate
];

// ===========================================
// CART VALIDATIONS
// ===========================================

const addToCartValidation = [
  body('productId')
    .notEmpty().withMessage('Product ID is required')
    .isMongoId().withMessage('Invalid product ID'),
  
  body('quantity')
    .optional()
    .isInt({ min: 1, max: 100 }).withMessage('Quantity must be between 1 and 100'),
  
  validate
];

const updateCartValidation = [
  body('quantity')
    .notEmpty().withMessage('Quantity is required')
    .isInt({ min: 0, max: 100 }).withMessage('Quantity must be between 0 and 100'),
  
  validate
];

// ===========================================
// ORDER VALIDATIONS
// ===========================================

const orderValidation = [
  body('shippingAddress.fullName')
    .trim()
    .notEmpty().withMessage('Full name is required'),
  
  body('shippingAddress.phone')
    .trim()
    .notEmpty().withMessage('Phone number is required'),
  
  body('shippingAddress.address')
    .trim()
    .notEmpty().withMessage('Street address is required'),
  
  body('shippingAddress.city')
    .trim()
    .notEmpty().withMessage('City is required'),
  
  body('shippingAddress.state')
    .trim()
    .notEmpty().withMessage('State is required'),
  
  body('shippingAddress.zipCode')
    .trim()
    .notEmpty().withMessage('ZIP code is required'),
  
  body('shippingAddress.country')
    .trim()
    .notEmpty().withMessage('Country is required'),
  
  body('paymentMethod')
    .notEmpty().withMessage('Payment method is required')
    .isIn(['stripe', 'cod', 'upi', 'netbanking']).withMessage('Invalid payment method'),
  
  validate
];

// ===========================================
// REVIEW VALIDATIONS
// ===========================================

const reviewValidation = [
  body('rating')
    .notEmpty().withMessage('Rating is required')
    .isInt({ min: 1, max: 5 }).withMessage('Rating must be between 1 and 5'),
  
  body('comment')
    .trim()
    .notEmpty().withMessage('Review comment is required')
    .isLength({ max: 500 }).withMessage('Comment cannot exceed 500 characters'),
  
  validate
];

// ===========================================
// COMMON VALIDATIONS
// ===========================================

const mongoIdValidation = [
  param('id')
    .isMongoId().withMessage('Invalid ID format'),
  
  validate
];

const paginationValidation = [
  query('page')
    .optional()
    .isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  
  validate
];

module.exports = {
  validate,
  registerValidation,
  loginValidation,
  productValidation,
  productUpdateValidation,
  categoryValidation,
  addToCartValidation,
  updateCartValidation,
  orderValidation,
  reviewValidation,
  mongoIdValidation,
  paginationValidation
};
