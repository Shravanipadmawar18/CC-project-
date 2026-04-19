/**
 * ===========================================
 * PAYMENT CONTROLLER
 * ===========================================
 * 
 * Handles Stripe payment integration.
 * Uses Stripe test mode for development.
 */

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const Order = require('../models/Order');
const Cart = require('../models/Cart');
const { asyncHandler, ApiError } = require('../middleware/errorMiddleware');

/**
 * @desc    Create Stripe payment intent
 * @route   POST /api/payments/create-payment-intent
 * @access  Private
 */
const createPaymentIntent = asyncHandler(async (req, res) => {
  const { orderId } = req.body;

  let amount;
  let order;

  if (orderId) {
    // Payment for existing order
    order = await Order.findById(orderId);
    if (!order) {
      throw new ApiError('Order not found', 404);
    }

    if (order.user.toString() !== req.user._id.toString()) {
      throw new ApiError('Not authorized', 403);
    }

    if (order.isPaid) {
      throw new ApiError('Order is already paid', 400);
    }

    amount = Math.round(order.totalPrice * 100); // Convert to paise
  } else {
    // Payment from cart
    const cart = await Cart.findOne({ user: req.user._id })
      .populate('items.product');

    if (!cart || cart.items.length === 0) {
      throw new ApiError('Cart is empty', 400);
    }

    // Calculate total
    const itemsPrice = cart.subtotal;
    const shippingPrice = itemsPrice > 500 ? 0 : 50;
    const taxPrice = Math.round(itemsPrice * 0.18);
    const discountAmount = cart.couponDiscount || 0;
    const totalPrice = itemsPrice + shippingPrice + taxPrice - discountAmount;

    amount = Math.round(totalPrice * 100); // Convert to paise
  }

  // Create Stripe PaymentIntent
  const paymentIntent = await stripe.paymentIntents.create({
    amount,
    currency: 'inr',
    metadata: {
      userId: req.user._id.toString(),
      orderId: orderId || 'pending',
      userEmail: req.user.email
    },
    automatic_payment_methods: {
      enabled: true
    }
  });

  res.status(200).json({
    success: true,
    data: {
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
      amount: amount / 100
    }
  });
});

/**
 * @desc    Confirm payment and update order
 * @route   POST /api/payments/confirm
 * @access  Private
 */
const confirmPayment = asyncHandler(async (req, res) => {
  const { paymentIntentId, orderId } = req.body;

  // Retrieve PaymentIntent from Stripe
  const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

  if (paymentIntent.status !== 'succeeded') {
    throw new ApiError('Payment not successful', 400);
  }

  // Update order
  const order = await Order.findById(orderId);
  if (!order) {
    throw new ApiError('Order not found', 404);
  }

  if (order.isPaid) {
    return res.status(200).json({
      success: true,
      message: 'Order already marked as paid',
      data: { order }
    });
  }

  // Mark as paid
  await order.markAsPaid({
    id: paymentIntent.id,
    status: paymentIntent.status,
    updateTime: new Date().toISOString(),
    emailAddress: req.user.email
  });

  res.status(200).json({
    success: true,
    message: 'Payment confirmed successfully',
    data: { order }
  });
});

/**
 * @desc    Get Stripe publishable key
 * @route   GET /api/payments/config
 * @access  Public
 */
const getStripeConfig = asyncHandler(async (req, res) => {
  res.status(200).json({
    success: true,
    data: {
      publishableKey: process.env.STRIPE_PUBLISHABLE_KEY
    }
  });
});

/**
 * @desc    Handle Stripe webhook
 * @route   POST /api/payments/webhook
 * @access  Public (Stripe only)
 */
const handleWebhook = asyncHandler(async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    throw new ApiError('Webhook signature verification failed', 400);
  }

  // Handle the event
  switch (event.type) {
    case 'payment_intent.succeeded':
      const paymentIntent = event.data.object;
      console.log('PaymentIntent succeeded:', paymentIntent.id);
      
      // Update order if orderId is in metadata
      if (paymentIntent.metadata.orderId && paymentIntent.metadata.orderId !== 'pending') {
        const order = await Order.findById(paymentIntent.metadata.orderId);
        if (order && !order.isPaid) {
          await order.markAsPaid({
            id: paymentIntent.id,
            status: paymentIntent.status,
            updateTime: new Date().toISOString(),
            emailAddress: paymentIntent.metadata.userEmail
          });
        }
      }
      break;

    case 'payment_intent.payment_failed':
      const failedPayment = event.data.object;
      console.log('Payment failed:', failedPayment.id);
      break;

    default:
      console.log(`Unhandled event type: ${event.type}`);
  }

  res.status(200).json({ received: true });
});

/**
 * @desc    Process refund
 * @route   POST /api/payments/refund
 * @access  Private/Admin
 */
const processRefund = asyncHandler(async (req, res) => {
  const { orderId, reason } = req.body;

  const order = await Order.findById(orderId);
  if (!order) {
    throw new ApiError('Order not found', 404);
  }

  if (!order.isPaid) {
    throw new ApiError('Order has not been paid', 400);
  }

  if (order.status === 'refunded') {
    throw new ApiError('Order has already been refunded', 400);
  }

  // Create refund in Stripe
  const refund = await stripe.refunds.create({
    payment_intent: order.paymentResult.id,
    reason: 'requested_by_customer'
  });

  // Update order status
  order.status = 'refunded';
  order.statusHistory.push({
    status: 'refunded',
    timestamp: new Date(),
    note: reason || 'Refund processed'
  });
  await order.save();

  res.status(200).json({
    success: true,
    message: 'Refund processed successfully',
    data: {
      refundId: refund.id,
      status: refund.status,
      amount: refund.amount / 100
    }
  });
});

module.exports = {
  createPaymentIntent,
  confirmPayment,
  getStripeConfig,
  handleWebhook,
  processRefund
};
