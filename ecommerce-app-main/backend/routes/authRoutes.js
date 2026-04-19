/**
 * ===========================================
 * AUTHENTICATION ROUTES
 * ===========================================
 */

const express = require('express');
const router = express.Router();

const {
  register,
  login,
  getMe,
  updateProfile,
  updatePassword,
  uploadAvatar,
  logout
} = require('../controllers/authController');

const { protect } = require('../middleware/authMiddleware');
const { registerValidation, loginValidation } = require('../middleware/validateMiddleware');
const { uploadAvatar: uploadAvatarMiddleware, handleUploadError, formatFileUrls } = require('../middleware/uploadMiddleware');

// Public routes
router.post('/register', registerValidation, register);
router.post('/login', loginValidation, login);

// Protected routes
router.get('/me', protect, getMe);
router.put('/update-profile', protect, updateProfile);
router.put('/update-password', protect, updatePassword);
router.put(
  '/avatar',
  protect,
  uploadAvatarMiddleware,
  handleUploadError,
  formatFileUrls,
  uploadAvatar
);
router.post('/logout', protect, logout);

module.exports = router;
