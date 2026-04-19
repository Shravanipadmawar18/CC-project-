/**
 * ===========================================
 * ORDER CONTROLLER
 * ===========================================
 * 
 * Handles order creation, management, and tracking.
 */

const Order = require('../models/Order');
const Cart = require('../models/Cart');
const Product = require('../models/Product');
const User = require('../models/User');
const { asyncHandler, ApiError } = require('../middleware/errorMiddleware');
const { getFallbackImageUrl } = require('../utils/imageHelper');

/**
 * @desc    Create new order
 * @route   POST /api/orders
 * @access  Private
 */
const createOrder = asyncHandler(async (req, res) => {
  const { shippingAddress, paymentMethod, notes } = req.body;

  // Get user's cart
  const cart = await Cart.findOne({ user: req.user._id })
    .populate('items.product');

  if (!cart || cart.items.length === 0) {
    throw new ApiError('Cart is empty', 400);
  }

  // Validate stock and prepare order items
  const orderItems = [];
  
  for (const item of cart.items) {
    const product = item.product;
    
    if (!product || !product.isActive) {
      throw new ApiError(`Product ${product?.name || 'Unknown'} is no longer available`, 400);
    }
    
    if (product.stock < item.quantity) {
      throw new ApiError(
        `Only ${product.stock} units of ${product.name} available`,
        400
      );
    }

    orderItems.push({
      product: product._id,
      name: product.name,
      image: product.images?.[0]?.url || product.primaryImage || getFallbackImageUrl(),
      price: item.price,
      quantity: item.quantity,
      selectedAttributes: item.selectedAttributes
    });
  }

  // Calculate prices
  const itemsPrice = cart.subtotal;
  const shippingPrice = itemsPrice > 500 ? 0 : 50; // Free shipping over ₹500
  const taxPrice = Math.round(itemsPrice * 0.18); // 18% GST
  const discountAmount = cart.couponDiscount || 0;
  const totalPrice = itemsPrice + shippingPrice + taxPrice - discountAmount;

  // Create order
  const order = await Order.create({
    user: req.user._id,
    items: orderItems,
    shippingAddress,
    itemsPrice,
    shippingPrice,
    taxPrice,
    discountAmount,
    couponCode: cart.couponCode,
    totalPrice,
    paymentMethod,
    notes,
    isPaid: paymentMethod === 'cod' ? false : false,
    status: paymentMethod === 'cod' ? 'confirmed' : 'pending'
  });

  // Update product stock and purchase count
  for (const item of cart.items) {
    await Product.findByIdAndUpdate(item.product._id, {
      $inc: {
        stock: -item.quantity,
        purchaseCount: item.quantity
      }
    });
  }

  // Update user's purchased products (for recommendations)
  const purchasedProductIds = cart.items.map(item => ({
    product: item.product._id,
    purchasedAt: new Date()
  }));
  
  await User.findByIdAndUpdate(req.user._id, {
    $push: {
      purchasedProducts: {
        $each: purchasedProductIds,
        $position: 0,
        $slice: 100
      }
    }
  });

  // Update frequently bought together for products
  for (let i = 0; i < orderItems.length; i++) {
    for (let j = 0; j < orderItems.length; j++) {
      if (i !== j) {
        await Product.findByIdAndUpdate(orderItems[i].product, {
          $push: {
            frequentlyBoughtWith: {
              product: orderItems[j].product,
              count: 1
            }
          }
        });
      }
    }
  }

  // Clear cart
  await cart.clearCart();

  res.status(201).json({
    success: true,
    message: 'Order placed successfully',
    data: { order }
  });
});

/**
 * @desc    Get all orders for current user
 * @route   GET /api/orders
 * @access  Private
 */
const getMyOrders = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, status } = req.query;
  
  const query = { user: req.user._id };
  if (status) {
    query.status = status;
  }

  const pageNum = parseInt(page);
  const limitNum = parseInt(limit);
  const skip = (pageNum - 1) * limitNum;

  const [orders, total] = await Promise.all([
    Order.find(query)
      .sort('-createdAt')
      .skip(skip)
      .limit(limitNum),
    Order.countDocuments(query)
  ]);

  res.status(200).json({
    success: true,
    data: {
      orders,
      pagination: {
        currentPage: pageNum,
        totalPages: Math.ceil(total / limitNum),
        totalOrders: total
      }
    }
  });
});

/**
 * @desc    Get order by ID
 * @route   GET /api/orders/:id
 * @access  Private
 */
const getOrder = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id)
    .populate('user', 'name email');

  if (!order) {
    throw new ApiError('Order not found', 404);
  }

  // Check if user owns this order or is admin
  if (
    order.user._id.toString() !== req.user._id.toString() &&
    req.user.role !== 'admin'
  ) {
    throw new ApiError('Not authorized to access this order', 403);
  }

  res.status(200).json({
    success: true,
    data: { order }
  });
});

/**
 * @desc    Cancel order
 * @route   PUT /api/orders/:id/cancel
 * @access  Private
 */
const cancelOrder = asyncHandler(async (req, res) => {
  const { reason } = req.body;

  const order = await Order.findById(req.params.id);

  if (!order) {
    throw new ApiError('Order not found', 404);
  }

  // Check ownership
  if (
    order.user.toString() !== req.user._id.toString() &&
    req.user.role !== 'admin'
  ) {
    throw new ApiError('Not authorized to cancel this order', 403);
  }

  // Check if order can be cancelled
  const cancellableStatuses = ['pending', 'confirmed', 'processing'];
  if (!cancellableStatuses.includes(order.status)) {
    throw new ApiError(
      `Order cannot be cancelled. Current status: ${order.status}`,
      400
    );
  }

  // Cancel order
  await order.cancelOrder(reason);

  // Restore product stock
  for (const item of order.items) {
    await Product.findByIdAndUpdate(item.product, {
      $inc: {
        stock: item.quantity,
        purchaseCount: -item.quantity
      }
    });
  }

  res.status(200).json({
    success: true,
    message: 'Order cancelled successfully',
    data: { order }
  });
});

/**
 * @desc    Get order tracking info
 * @route   GET /api/orders/:id/track
 * @access  Private
 */
const trackOrder = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id)
    .select('orderNumber status statusHistory trackingNumber carrier estimatedDelivery');

  if (!order) {
    throw new ApiError('Order not found', 404);
  }

  // Check ownership
  if (
    order.user?.toString() !== req.user._id.toString() &&
    req.user.role !== 'admin'
  ) {
    throw new ApiError('Not authorized', 403);
  }

  res.status(200).json({
    success: true,
    data: {
      orderNumber: order.orderNumber,
      status: order.status,
      statusHistory: order.statusHistory,
      trackingNumber: order.trackingNumber,
      carrier: order.carrier,
      estimatedDelivery: order.estimatedDelivery
    }
  });
});

module.exports = {
  createOrder,
  getMyOrders,
  getOrder,
  cancelOrder,
  trackOrder
};
