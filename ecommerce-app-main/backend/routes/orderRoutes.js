/**
 * ===========================================
 * ORDER ROUTES
 * ===========================================
 */

const express = require('express');
const router = express.Router();

const {
  createOrder,
  getMyOrders,
  getOrder,
  cancelOrder,
  trackOrder
} = require('../controllers/orderController');

const { protect } = require('../middleware/authMiddleware');
const { orderValidation } = require('../middleware/validateMiddleware');

// All routes are protected
router.use(protect);

router.route('/')
  .get(getMyOrders)
  .post(orderValidation, createOrder);

router.route('/:id')
  .get(getOrder);

router.put('/:id/cancel', cancelOrder);
router.get('/:id/track', trackOrder);

module.exports = router;
