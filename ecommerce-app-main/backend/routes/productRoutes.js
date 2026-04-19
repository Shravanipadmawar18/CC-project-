/**
 * ===========================================
 * PRODUCT ROUTES
 * ===========================================
 */

const express = require('express');
const router = express.Router();

const {
  getProducts,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct,
  addReview,
  getReviews,
  deleteReview,
  getFeaturedProducts,
  getNewArrivals,
  getTrendingProducts,
  getSimilarProducts
} = require('../controllers/productController');

const { protect, authorize, optionalAuth } = require('../middleware/authMiddleware');
const { productValidation, productUpdateValidation, reviewValidation, mongoIdValidation } = require('../middleware/validateMiddleware');
const { uploadProductImages, handleUploadError, formatFileUrls } = require('../middleware/uploadMiddleware');

// Public routes with optional auth (for tracking views)
router.get('/featured', getFeaturedProducts);
router.get('/new-arrivals', getNewArrivals);
router.get('/trending', getTrendingProducts);

router.route('/')
  .get(optionalAuth, getProducts);

router.route('/:id')
  .get(optionalAuth, getProduct);

router.get('/:id/similar', getSimilarProducts);

// Review routes
router.route('/:id/reviews')
  .get(getReviews)
  .post(protect, reviewValidation, addReview);

router.delete('/:id/reviews/:reviewId', protect, deleteReview);

// Admin routes
router.post(
  '/',
  protect,
  authorize('admin'),
  uploadProductImages,
  handleUploadError,
  formatFileUrls,
  productValidation,
  createProduct
);

router.put(
  '/:id',
  protect,
  authorize('admin'),
  uploadProductImages,
  handleUploadError,
  formatFileUrls,
  productUpdateValidation,
  updateProduct
);

router.delete('/:id', protect, authorize('admin'), deleteProduct);

module.exports = router;
