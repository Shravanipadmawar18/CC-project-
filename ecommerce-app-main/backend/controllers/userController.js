/**
 * ===========================================
 * USER CONTROLLER
 * ===========================================
 * 
 * Handles user-related operations
 * like wishlist and profile management.
 */

const User = require('../models/User');
const Product = require('../models/Product');
const { asyncHandler, ApiError } = require('../middleware/errorMiddleware');

/**
 * @desc    Get user wishlist
 * @route   GET /api/users/wishlist
 * @access  Private
 */
const getWishlist = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id)
    .populate({
      path: 'wishlist',
      select: 'name price images rating stock isActive slug',
      match: { isActive: true }
    });

  res.status(200).json({
    success: true,
    count: user.wishlist.length,
    data: { wishlist: user.wishlist }
  });
});

/**
 * @desc    Add product to wishlist
 * @route   POST /api/users/wishlist/:productId
 * @access  Private
 */
const addToWishlist = asyncHandler(async (req, res) => {
  const { productId } = req.params;

  // Check if product exists
  const product = await Product.findById(productId);
  if (!product || !product.isActive) {
    throw new ApiError('Product not found', 404);
  }

  const user = await User.findById(req.user._id);

  // Check if already in wishlist
  if (user.wishlist.includes(productId)) {
    throw new ApiError('Product already in wishlist', 400);
  }

  // Add to wishlist
  user.wishlist.push(productId);
  await user.save({ validateBeforeSave: false });

  res.status(200).json({
    success: true,
    message: 'Product added to wishlist'
  });
});

/**
 * @desc    Remove product from wishlist
 * @route   DELETE /api/users/wishlist/:productId
 * @access  Private
 */
const removeFromWishlist = asyncHandler(async (req, res) => {
  const { productId } = req.params;

  const user = await User.findById(req.user._id);

  // Check if in wishlist
  const index = user.wishlist.indexOf(productId);
  if (index === -1) {
    throw new ApiError('Product not in wishlist', 404);
  }

  // Remove from wishlist
  user.wishlist.splice(index, 1);
  await user.save({ validateBeforeSave: false });

  res.status(200).json({
    success: true,
    message: 'Product removed from wishlist'
  });
});

/**
 * @desc    Get user's view history
 * @route   GET /api/users/history
 * @access  Private
 */
const getViewHistory = asyncHandler(async (req, res) => {
  const limit = parseInt(req.query.limit) || 20;

  const user = await User.findById(req.user._id)
    .populate({
      path: 'viewedProducts.product',
      select: 'name price images rating slug',
      match: { isActive: true }
    });

  // Filter out null products and limit
  const history = user.viewedProducts
    .filter(v => v.product)
    .slice(0, limit)
    .map(v => ({
      product: v.product,
      viewedAt: v.viewedAt
    }));

  res.status(200).json({
    success: true,
    count: history.length,
    data: { history }
  });
});

/**
 * @desc    Clear view history
 * @route   DELETE /api/users/history
 * @access  Private
 */
const clearViewHistory = asyncHandler(async (req, res) => {
  await User.findByIdAndUpdate(req.user._id, {
    viewedProducts: [],
    searchHistory: []
  });

  res.status(200).json({
    success: true,
    message: 'History cleared'
  });
});

/**
 * @desc    Get user addresses
 * @route   GET /api/users/addresses
 * @access  Private
 */
const getAddresses = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).select('address');

  res.status(200).json({
    success: true,
    data: { address: user.address }
  });
});

/**
 * @desc    Update user address
 * @route   PUT /api/users/addresses
 * @access  Private
 */
const updateAddress = asyncHandler(async (req, res) => {
  const { street, city, state, zipCode, country } = req.body;

  const user = await User.findById(req.user._id);
  
  user.address = {
    ...user.address,
    ...(street && { street }),
    ...(city && { city }),
    ...(state && { state }),
    ...(zipCode && { zipCode }),
    ...(country && { country })
  };

  await user.save({ validateBeforeSave: false });

  res.status(200).json({
    success: true,
    message: 'Address updated',
    data: { address: user.address }
  });
});

module.exports = {
  getWishlist,
  addToWishlist,
  removeFromWishlist,
  getViewHistory,
  clearViewHistory,
  getAddresses,
  updateAddress
};
