/**
 * ===========================================
 * ADMIN CONTROLLER
 * ===========================================
 * 
 * Admin-specific operations for managing
 * users, orders, and dashboard statistics.
 */

const User = require('../models/User');
const Product = require('../models/Product');
const Order = require('../models/Order');
const Category = require('../models/Category');
const { asyncHandler, ApiError } = require('../middleware/errorMiddleware');

/**
 * @desc    Get admin dashboard statistics
 * @route   GET /api/admin/dashboard
 * @access  Private/Admin
 */
const getDashboardStats = asyncHandler(async (req, res) => {
  // Get counts
  const [
    totalUsers,
    totalProducts,
    totalOrders,
    totalCategories,
    recentOrders,
    orderStats,
    topProducts
  ] = await Promise.all([
    User.countDocuments({ role: 'user' }),
    Product.countDocuments({ isActive: true }),
    Order.countDocuments(),
    Category.countDocuments({ isActive: true }),
    Order.getRecentOrders(5),
    Order.getOrderStats(),
    Product.find({ isActive: true })
      .sort({ purchaseCount: -1 })
      .limit(5)
      .select('name price purchaseCount images')
  ]);

  // Calculate revenue for different periods
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const thisYear = new Date(now.getFullYear(), 0, 1);

  const [todayRevenue, monthlyRevenue, yearlyRevenue] = await Promise.all([
    Order.aggregate([
      { $match: { isPaid: true, createdAt: { $gte: today } } },
      { $group: { _id: null, total: { $sum: '$totalPrice' } } }
    ]),
    Order.aggregate([
      { $match: { isPaid: true, createdAt: { $gte: thisMonth } } },
      { $group: { _id: null, total: { $sum: '$totalPrice' } } }
    ]),
    Order.aggregate([
      { $match: { isPaid: true, createdAt: { $gte: thisYear } } },
      { $group: { _id: null, total: { $sum: '$totalPrice' } } }
    ])
  ]);

  // Get orders by status for chart
  const ordersByStatus = await Order.aggregate([
    { $group: { _id: '$status', count: { $sum: 1 } } }
  ]);

  // Get sales trend (last 7 days)
  const last7Days = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const salesTrend = await Order.aggregate([
    { $match: { isPaid: true, createdAt: { $gte: last7Days } } },
    {
      $group: {
        _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
        sales: { $sum: '$totalPrice' },
        orders: { $sum: 1 }
      }
    },
    { $sort: { _id: 1 } }
  ]);

  res.status(200).json({
    success: true,
    data: {
      counts: {
        users: totalUsers,
        products: totalProducts,
        orders: totalOrders,
        categories: totalCategories
      },
      revenue: {
        today: todayRevenue[0]?.total || 0,
        monthly: monthlyRevenue[0]?.total || 0,
        yearly: yearlyRevenue[0]?.total || 0,
        total: orderStats.totalRevenue
      },
      recentOrders,
      topProducts,
      ordersByStatus,
      salesTrend
    }
  });
});

/**
 * @desc    Get all users (admin)
 * @route   GET /api/admin/users
 * @access  Private/Admin
 */
const getUsers = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, role, search } = req.query;

  const query = {};
  if (role) query.role = role;
  if (search) {
    query.$or = [
      { name: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } }
    ];
  }

  const pageNum = parseInt(page);
  const limitNum = parseInt(limit);
  const skip = (pageNum - 1) * limitNum;

  const [users, total] = await Promise.all([
    User.find(query)
      .select('-password -viewedProducts -searchHistory')
      .sort('-createdAt')
      .skip(skip)
      .limit(limitNum),
    User.countDocuments(query)
  ]);

  res.status(200).json({
    success: true,
    data: {
      users,
      pagination: {
        currentPage: pageNum,
        totalPages: Math.ceil(total / limitNum),
        totalUsers: total
      }
    }
  });
});

/**
 * @desc    Get user by ID (admin)
 * @route   GET /api/admin/users/:id
 * @access  Private/Admin
 */
const getUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id)
    .select('-password')
    .populate('wishlist', 'name price images');

  if (!user) {
    throw new ApiError('User not found', 404);
  }

  // Get user's order count and total spent
  const orderStats = await Order.aggregate([
    { $match: { user: user._id } },
    {
      $group: {
        _id: null,
        totalOrders: { $sum: 1 },
        totalSpent: { $sum: '$totalPrice' }
      }
    }
  ]);

  res.status(200).json({
    success: true,
    data: {
      user,
      orderStats: orderStats[0] || { totalOrders: 0, totalSpent: 0 }
    }
  });
});

/**
 * @desc    Update user (admin)
 * @route   PUT /api/admin/users/:id
 * @access  Private/Admin
 */
const updateUser = asyncHandler(async (req, res) => {
  const { name, email, role, isActive, phone, address } = req.body;

  const user = await User.findById(req.params.id);
  if (!user) {
    throw new ApiError('User not found', 404);
  }

  // Update fields
  if (name) user.name = name;
  if (email) user.email = email;
  if (role) user.role = role;
  if (typeof isActive === 'boolean') user.isActive = isActive;
  if (phone) user.phone = phone;
  if (address) user.address = { ...user.address, ...address };

  await user.save();

  res.status(200).json({
    success: true,
    message: 'User updated successfully',
    data: { user }
  });
});

/**
 * @desc    Delete user (admin)
 * @route   DELETE /api/admin/users/:id
 * @access  Private/Admin
 */
const deleteUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);

  if (!user) {
    throw new ApiError('User not found', 404);
  }

  // Don't allow deleting yourself
  if (user._id.toString() === req.user._id.toString()) {
    throw new ApiError('Cannot delete your own account', 400);
  }

  // Soft delete - deactivate user
  user.isActive = false;
  await user.save();

  res.status(200).json({
    success: true,
    message: 'User deactivated successfully'
  });
});

/**
 * @desc    Get all orders (admin)
 * @route   GET /api/admin/orders
 * @access  Private/Admin
 */
const getAllOrders = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, status, startDate, endDate } = req.query;

  const query = {};
  if (status) query.status = status;
  if (startDate || endDate) {
    query.createdAt = {};
    if (startDate) query.createdAt.$gte = new Date(startDate);
    if (endDate) query.createdAt.$lte = new Date(endDate);
  }

  const pageNum = parseInt(page);
  const limitNum = parseInt(limit);
  const skip = (pageNum - 1) * limitNum;

  const [orders, total] = await Promise.all([
    Order.find(query)
      .populate('user', 'name email')
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
 * @desc    Update order status (admin)
 * @route   PUT /api/admin/orders/:id/status
 * @access  Private/Admin
 */
const updateOrderStatus = asyncHandler(async (req, res) => {
  const { status, note, trackingNumber, carrier, estimatedDelivery } = req.body;

  const order = await Order.findById(req.params.id);
  if (!order) {
    throw new ApiError('Order not found', 404);
  }

  // Validate status transition
  const validTransitions = {
    pending: ['confirmed', 'cancelled'],
    confirmed: ['processing', 'cancelled'],
    processing: ['shipped', 'cancelled'],
    shipped: ['out_for_delivery', 'delivered'],
    out_for_delivery: ['delivered'],
    delivered: ['returned'],
    returned: ['refunded']
  };

  if (
    validTransitions[order.status] &&
    !validTransitions[order.status].includes(status)
  ) {
    throw new ApiError(
      `Cannot change status from ${order.status} to ${status}`,
      400
    );
  }

  // Update tracking info
  if (trackingNumber) order.trackingNumber = trackingNumber;
  if (carrier) order.carrier = carrier;
  if (estimatedDelivery) order.estimatedDelivery = new Date(estimatedDelivery);

  // Update status
  await order.updateStatus(status, note);

  res.status(200).json({
    success: true,
    message: `Order status updated to ${status}`,
    data: { order }
  });
});

/**
 * @desc    Get all products (admin - including inactive)
 * @route   GET /api/admin/products
 * @access  Private/Admin
 */
const getAllProducts = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, search, category, isActive } = req.query;

  const query = {};
  if (search) {
    query.$or = [
      { name: { $regex: search, $options: 'i' } },
      { sku: { $regex: search, $options: 'i' } }
    ];
  }
  if (category) query.category = category;
  if (isActive !== undefined) query.isActive = isActive === 'true';

  const pageNum = parseInt(page);
  const limitNum = parseInt(limit);
  const skip = (pageNum - 1) * limitNum;

  const [products, total] = await Promise.all([
    Product.find(query)
      .populate('category', 'name')
      .select('-reviews')
      .sort('-createdAt')
      .skip(skip)
      .limit(limitNum),
    Product.countDocuments(query)
  ]);

  res.status(200).json({
    success: true,
    data: {
      products,
      pagination: {
        currentPage: pageNum,
        totalPages: Math.ceil(total / limitNum),
        totalProducts: total
      }
    }
  });
});

/**
 * @desc    Get low stock products
 * @route   GET /api/admin/products/low-stock
 * @access  Private/Admin
 */
const getLowStockProducts = asyncHandler(async (req, res) => {
  const products = await Product.find({
    isActive: true,
    $expr: { $lte: ['$stock', '$lowStockThreshold'] }
  })
    .populate('category', 'name')
    .select('name sku stock lowStockThreshold images')
    .sort('stock');

  res.status(200).json({
    success: true,
    count: products.length,
    data: { products }
  });
});

/**
 * @desc    Bulk update product stock
 * @route   PUT /api/admin/products/stock
 * @access  Private/Admin
 */
const updateProductStock = asyncHandler(async (req, res) => {
  const { updates } = req.body; // Array of { productId, stock }

  if (!Array.isArray(updates) || updates.length === 0) {
    throw new ApiError('No updates provided', 400);
  }

  const results = await Promise.all(
    updates.map(async ({ productId, stock }) => {
      const product = await Product.findByIdAndUpdate(
        productId,
        { stock },
        { new: true }
      );
      return { productId, name: product?.name, newStock: stock };
    })
  );

  res.status(200).json({
    success: true,
    message: `Updated stock for ${results.length} products`,
    data: { results }
  });
});

module.exports = {
  getDashboardStats,
  getUsers,
  getUser,
  updateUser,
  deleteUser,
  getAllOrders,
  updateOrderStatus,
  getAllProducts,
  getLowStockProducts,
  updateProductStock
};
