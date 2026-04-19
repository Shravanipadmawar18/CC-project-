/**
 * ===========================================
 * CATEGORY ROUTES
 * ===========================================
 */

const express = require('express');
const router = express.Router();

const {
  getCategories,
  getCategory,
  createCategory,
  updateCategory,
  deleteCategory,
  getCategoryProducts
} = require('../controllers/categoryController');

const { protect, authorize } = require('../middleware/authMiddleware');
const { categoryValidation } = require('../middleware/validateMiddleware');
const { uploadCategoryImage, handleUploadError, formatFileUrls } = require('../middleware/uploadMiddleware');

// Public routes
router.get('/', getCategories);
router.get('/:id', getCategory);
router.get('/:id/products', getCategoryProducts);

// Admin routes
router.post(
  '/',
  protect,
  authorize('admin'),
  uploadCategoryImage,
  handleUploadError,
  formatFileUrls,
  categoryValidation,
  createCategory
);

router.put(
  '/:id',
  protect,
  authorize('admin'),
  uploadCategoryImage,
  handleUploadError,
  formatFileUrls,
  updateCategory
);

router.delete('/:id', protect, authorize('admin'), deleteCategory);

module.exports = router;
