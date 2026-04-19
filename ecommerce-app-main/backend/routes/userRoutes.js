/**
 * ===========================================
 * USER ROUTES
 * ===========================================
 */

const express = require('express');
const router = express.Router();

const {
  getWishlist,
  addToWishlist,
  removeFromWishlist,
  getViewHistory,
  clearViewHistory,
  getAddresses,
  updateAddress
} = require('../controllers/userController');

const { protect } = require('../middleware/authMiddleware');

// All routes are protected
router.use(protect);

// Wishlist routes
router.route('/wishlist')
  .get(getWishlist);

router.route('/wishlist/:productId')
  .post(addToWishlist)
  .delete(removeFromWishlist);

// History routes
router.route('/history')
  .get(getViewHistory)
  .delete(clearViewHistory);

// Address routes
router.route('/addresses')
  .get(getAddresses)
  .put(updateAddress);

module.exports = router;
