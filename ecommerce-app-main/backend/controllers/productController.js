/**
 * ===========================================
 * PRODUCT CONTROLLER
 * ===========================================
 * 
 * Handles all product-related operations including
 * CRUD, search, filtering, and reviews.
 */

const Product = require('../models/Product');
const User = require('../models/User');
const { asyncHandler, ApiError } = require('../middleware/errorMiddleware');

/**
 * @desc    Get all products with filtering, sorting, and pagination
 * @route   GET /api/products
 * @access  Public
 */
const getProducts = asyncHandler(async (req, res) => {
  const {
    page = 1,
    limit = 12,
    sort = '-createdAt',
    category,
    brand,
    minPrice,
    maxPrice,
    rating,
    search,
    inStock,
    isFeatured
  } = req.query;

  // Build query
  const query = { isActive: true };

  // Category filter
  if (category) {
    query.category = category;
  }

  // Brand filter
  if (brand) {
    query.brand = { $regex: brand, $options: 'i' };
  }

  // Price range filter
  if (minPrice || maxPrice) {
    query.price = {};
    if (minPrice) query.price.$gte = parseFloat(minPrice);
    if (maxPrice) query.price.$lte = parseFloat(maxPrice);
  }

  // Rating filter
  if (rating) {
    query.rating = { $gte: parseFloat(rating) };
  }

  // In stock filter
  if (inStock === 'true') {
    query.stock = { $gt: 0 };
  }

  // Featured filter
  if (isFeatured === 'true') {
    query.isFeatured = true;
  }

  // Text search
  if (search) {
    query.$text = { $search: search };
    
    // Track search for logged-in users (for recommendations)
    if (req.user) {
      await req.user.addToSearchHistory(search);
    }
  }

  // Calculate pagination
  const pageNum = parseInt(page);
  const limitNum = parseInt(limit);
  const skip = (pageNum - 1) * limitNum;

  // Execute query
  const [products, total] = await Promise.all([
    Product.find(query)
      .populate('category', 'name slug')
      .select('-reviews') // Exclude reviews for list view
      .sort(sort)
      .skip(skip)
      .limit(limitNum)
      .lean(),
    Product.countDocuments(query)
  ]);

  // Calculate pagination info
  const totalPages = Math.ceil(total / limitNum);
  const hasNextPage = pageNum < totalPages;
  const hasPrevPage = pageNum > 1;

  res.status(200).json({
    success: true,
    data: {
      products,
      pagination: {
        currentPage: pageNum,
        totalPages,
        totalProducts: total,
        hasNextPage,
        hasPrevPage,
        limit: limitNum
      }
    }
  });
});

/**
 * @desc    Get single product by ID or slug
 * @route   GET /api/products/:id
 * @access  Public
 */
const getProduct = asyncHandler(async (req, res) => {
  const { id } = req.params;

  // Find by ID or slug
  let product;
  if (id.match(/^[0-9a-fA-F]{24}$/)) {
    product = await Product.findById(id)
      .populate('category', 'name slug')
      .populate('reviews.user', 'name avatar');
  } else {
    product = await Product.findOne({ slug: id })
      .populate('category', 'name slug')
      .populate('reviews.user', 'name avatar');
  }

  if (!product || !product.isActive) {
    throw new ApiError('Product not found', 404);
  }

  // Increment view count
  product.viewCount += 1;
  await product.save({ validateBeforeSave: false });

  // Track view for logged-in users (for recommendations)
  if (req.user) {
    await req.user.addToViewHistory(product._id);
  }

  res.status(200).json({
    success: true,
    data: { product }
  });
});

/**
 * @desc    Create new product
 * @route   POST /api/products
 * @access  Private/Admin
 */
const createProduct = asyncHandler(async (req, res) => {
  // Add user who created the product
  req.body.createdBy = req.user._id;

  // Handle image uploads
  if (req.files && req.files.length > 0) {
    req.body.images = req.files.map((file, index) => ({
      url: file.url || `/${file.path.replace(/\\/g, '/')}`,
      alt: req.body.name || 'Product image',
      isPrimary: index === 0
    }));
  }

  const product = await Product.create(req.body);

  res.status(201).json({
    success: true,
    message: 'Product created successfully',
    data: { product }
  });
});

/**
 * @desc    Update product
 * @route   PUT /api/products/:id
 * @access  Private/Admin
 */
const updateProduct = asyncHandler(async (req, res) => {
  let product = await Product.findById(req.params.id);

  if (!product) {
    throw new ApiError('Product not found', 404);
  }

  // Handle new image uploads
  if (req.files && req.files.length > 0) {
    const newImages = req.files.map((file) => ({
      url: file.url || `/${file.path.replace(/\\/g, '/')}`,
      alt: req.body.name || product.name,
      isPrimary: false
    }));
    req.body.images = [...(product.images || []), ...newImages];
  }

  product = await Product.findByIdAndUpdate(
    req.params.id,
    req.body,
    { new: true, runValidators: true }
  );

  res.status(200).json({
    success: true,
    message: 'Product updated successfully',
    data: { product }
  });
});

/**
 * @desc    Delete product
 * @route   DELETE /api/products/:id
 * @access  Private/Admin
 */
const deleteProduct = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);

  if (!product) {
    throw new ApiError('Product not found', 404);
  }

  // Soft delete - just mark as inactive
  product.isActive = false;
  await product.save();

  res.status(200).json({
    success: true,
    message: 'Product deleted successfully'
  });
});

/**
 * @desc    Add product review
 * @route   POST /api/products/:id/reviews
 * @access  Private
 */
const addReview = asyncHandler(async (req, res) => {
  const { rating, comment } = req.body;

  const product = await Product.findById(req.params.id);

  if (!product) {
    throw new ApiError('Product not found', 404);
  }

  // Check if user already reviewed this product
  const alreadyReviewed = product.reviews.find(
    review => review.user.toString() === req.user._id.toString()
  );

  if (alreadyReviewed) {
    throw new ApiError('You have already reviewed this product', 400);
  }

  // Add review
  const review = {
    user: req.user._id,
    name: req.user.name,
    rating: Number(rating),
    comment
  };

  product.reviews.push(review);
  product.calculateAverageRating();
  await product.save();

  res.status(201).json({
    success: true,
    message: 'Review added successfully',
    data: { review }
  });
});

/**
 * @desc    Get product reviews
 * @route   GET /api/products/:id/reviews
 * @access  Public
 */
const getReviews = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id)
    .select('reviews rating numReviews')
    .populate('reviews.user', 'name avatar');

  if (!product) {
    throw new ApiError('Product not found', 404);
  }

  res.status(200).json({
    success: true,
    data: {
      reviews: product.reviews,
      rating: product.rating,
      numReviews: product.numReviews
    }
  });
});

/**
 * @desc    Delete product review
 * @route   DELETE /api/products/:id/reviews/:reviewId
 * @access  Private
 */
const deleteReview = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);

  if (!product) {
    throw new ApiError('Product not found', 404);
  }

  // Find review
  const reviewIndex = product.reviews.findIndex(
    review => review._id.toString() === req.params.reviewId
  );

  if (reviewIndex === -1) {
    throw new ApiError('Review not found', 404);
  }

  // Check if user owns the review or is admin
  const review = product.reviews[reviewIndex];
  if (
    review.user.toString() !== req.user._id.toString() &&
    req.user.role !== 'admin'
  ) {
    throw new ApiError('Not authorized to delete this review', 403);
  }

  // Remove review
  product.reviews.splice(reviewIndex, 1);
  product.calculateAverageRating();
  await product.save();

  res.status(200).json({
    success: true,
    message: 'Review deleted successfully'
  });
});

/**
 * @desc    Get featured products
 * @route   GET /api/products/featured
 * @access  Public
 */
const getFeaturedProducts = asyncHandler(async (req, res) => {
  const limit = parseInt(req.query.limit) || 8;

  const products = await Product.getFeaturedProducts(limit);

  res.status(200).json({
    success: true,
    data: { products }
  });
});

/**
 * @desc    Get new arrivals
 * @route   GET /api/products/new-arrivals
 * @access  Public
 */
const getNewArrivals = asyncHandler(async (req, res) => {
  const limit = parseInt(req.query.limit) || 8;

  const products = await Product.find({ isActive: true })
    .sort('-createdAt')
    .limit(limit)
    .populate('category', 'name slug');

  res.status(200).json({
    success: true,
    data: { products }
  });
});

/**
 * @desc    Get trending products
 * @route   GET /api/products/trending
 * @access  Public
 */
const getTrendingProducts = asyncHandler(async (req, res) => {
  const limit = parseInt(req.query.limit) || 10;

  const products = await Product.getTrendingProducts(limit);

  res.status(200).json({
    success: true,
    data: { products }
  });
});

/**
 * @desc    Get similar products
 * @route   GET /api/products/:id/similar
 * @access  Public
 */
const getSimilarProducts = asyncHandler(async (req, res) => {
  const limit = parseInt(req.query.limit) || 6;

  const products = await Product.findSimilarProducts(req.params.id, limit);

  res.status(200).json({
    success: true,
    data: { products }
  });
});

module.exports = {
  getProducts,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct,
  addReview,
  getReviews,
  deleteReview,
  getFeaturedProducts,
  getNewArrivals,
  getTrendingProducts,
  getSimilarProducts
};
