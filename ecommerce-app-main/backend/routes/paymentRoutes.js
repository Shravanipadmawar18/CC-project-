/**
 * ===========================================
 * PAYMENT ROUTES
 * ===========================================
 */

const express = require('express');
const router = express.Router();

const {
  createPaymentIntent,
  confirmPayment,
  getStripeConfig,
  handleWebhook,
  processRefund
} = require('../controllers/paymentController');

const { protect, authorize } = require('../middleware/authMiddleware');

// Public routes
router.get('/config', getStripeConfig);

// Stripe webhook (needs raw body)
router.post(
  '/webhook',
  express.raw({ type: 'application/json' }),
  handleWebhook
);

// Protected routes
router.post('/create-payment-intent', protect, createPaymentIntent);
router.post('/confirm', protect, confirmPayment);

// Admin routes
router.post('/refund', protect, authorize('admin'), processRefund);

module.exports = router;
