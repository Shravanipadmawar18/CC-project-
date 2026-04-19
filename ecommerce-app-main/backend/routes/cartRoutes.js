/**
 * ===========================================
 * CART ROUTES
 * ===========================================
 */

const express = require('express');
const router = express.Router();

const {
  getCart,
  addToCart,
  updateCartItem,
  removeFromCart,
  clearCart,
  applyCoupon,
  removeCoupon
} = require('../controllers/cartController');

const { protect } = require('../middleware/authMiddleware');
const { addToCartValidation, updateCartValidation } = require('../middleware/validateMiddleware');

// All routes are protected
router.use(protect);

router.route('/')
  .get(getCart)
  .post(addToCartValidation, addToCart)
  .delete(clearCart);

router.route('/coupon')
  .post(applyCoupon)
  .delete(removeCoupon);

router.route('/:productId')
  .put(updateCartValidation, updateCartItem)
  .delete(removeFromCart);

module.exports = router;
