/**
 * ===========================================
 * ADMIN ROUTES
 * ===========================================
 */

const express = require('express');
const router = express.Router();

const {
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
} = require('../controllers/adminController');

const { protect, authorize } = require('../middleware/authMiddleware');

// All routes require admin access
router.use(protect, authorize('admin'));

// Dashboard
router.get('/dashboard', getDashboardStats);

// User management
router.route('/users')
  .get(getUsers);

router.route('/users/:id')
  .get(getUser)
  .put(updateUser)
  .delete(deleteUser);

// Order management
router.route('/orders')
  .get(getAllOrders);

router.put('/orders/:id/status', updateOrderStatus);

// Product management
router.route('/products')
  .get(getAllProducts);

router.get('/products/low-stock', getLowStockProducts);
router.put('/products/stock', updateProductStock);

module.exports = router;
