/**
 * ===========================================
 * CATEGORY CONTROLLER
 * ===========================================
 * 
 * Handles category CRUD operations.
 */

const Category = require('../models/Category');
const Product = require('../models/Product');
const { asyncHandler, ApiError } = require('../middleware/errorMiddleware');

/**
 * @desc    Get all categories
 * @route   GET /api/categories
 * @access  Public
 */
const getCategories = asyncHandler(async (req, res) => {
  const { tree } = req.query;

  let categories;

  if (tree === 'true') {
    // Get categories with hierarchy
    categories = await Category.getCategoryTree();
  } else {
    // Get flat list
    categories = await Category.find({ isActive: true })
      .sort('displayOrder name');
  }

  res.status(200).json({
    success: true,
    count: categories.length,
    data: { categories }
  });
});

/**
 * @desc    Get single category with products
 * @route   GET /api/categories/:id
 * @access  Public
 */
const getCategory = asyncHandler(async (req, res) => {
  const { id } = req.params;

  // Find by ID or slug
  let category;
  if (id.match(/^[0-9a-fA-F]{24}$/)) {
    category = await Category.findById(id).populate('subcategories');
  } else {
    category = await Category.findOne({ slug: id }).populate('subcategories');
  }

  if (!category) {
    throw new ApiError('Category not found', 404);
  }

  // Get products count
  const productCount = await Product.countDocuments({
    category: category._id,
    isActive: true
  });

  res.status(200).json({
    success: true,
    data: {
      category,
      productCount
    }
  });
});

/**
 * @desc    Create category
 * @route   POST /api/categories
 * @access  Private/Admin
 */
const createCategory = asyncHandler(async (req, res) => {
  // Handle image upload
  if (req.file) {
    req.body.image = req.file.url || `/${req.file.path.replace(/\\/g, '/')}`;
  }

  const category = await Category.create(req.body);

  res.status(201).json({
    success: true,
    message: 'Category created successfully',
    data: { category }
  });
});

/**
 * @desc    Update category
 * @route   PUT /api/categories/:id
 * @access  Private/Admin
 */
const updateCategory = asyncHandler(async (req, res) => {
  let category = await Category.findById(req.params.id);

  if (!category) {
    throw new ApiError('Category not found', 404);
  }

  // Handle image upload
  if (req.file) {
    req.body.image = req.file.url || `/${req.file.path.replace(/\\/g, '/')}`;
  }

  category = await Category.findByIdAndUpdate(
    req.params.id,
    req.body,
    { new: true, runValidators: true }
  );

  res.status(200).json({
    success: true,
    message: 'Category updated successfully',
    data: { category }
  });
});

/**
 * @desc    Delete category
 * @route   DELETE /api/categories/:id
 * @access  Private/Admin
 */
const deleteCategory = asyncHandler(async (req, res) => {
  const category = await Category.findById(req.params.id);

  if (!category) {
    throw new ApiError('Category not found', 404);
  }

  // Check if category has products
  const productCount = await Product.countDocuments({ category: category._id });
  if (productCount > 0) {
    throw new ApiError(
      `Cannot delete category with ${productCount} products. Please move or delete products first.`,
      400
    );
  }

  // Check if category has subcategories
  const subcategories = await Category.countDocuments({ parent: category._id });
  if (subcategories > 0) {
    throw new ApiError(
      'Cannot delete category with subcategories. Please delete subcategories first.',
      400
    );
  }

  await category.deleteOne();

  res.status(200).json({
    success: true,
    message: 'Category deleted successfully'
  });
});

/**
 * @desc    Get category products
 * @route   GET /api/categories/:id/products
 * @access  Public
 */
const getCategoryProducts = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { page = 1, limit = 12, sort = '-createdAt' } = req.query;

  // Find category
  let category;
  if (id.match(/^[0-9a-fA-F]{24}$/)) {
    category = await Category.findById(id);
  } else {
    category = await Category.findOne({ slug: id });
  }

  if (!category) {
    throw new ApiError('Category not found', 404);
  }

  // Pagination
  const pageNum = parseInt(page);
  const limitNum = parseInt(limit);
  const skip = (pageNum - 1) * limitNum;

  // Get products
  const [products, total] = await Promise.all([
    Product.find({ category: category._id, isActive: true })
      .sort(sort)
      .skip(skip)
      .limit(limitNum)
      .select('-reviews'),
    Product.countDocuments({ category: category._id, isActive: true })
  ]);

  res.status(200).json({
    success: true,
    data: {
      category,
      products,
      pagination: {
        currentPage: pageNum,
        totalPages: Math.ceil(total / limitNum),
        totalProducts: total
      }
    }
  });
});

module.exports = {
  getCategories,
  getCategory,
  createCategory,
  updateCategory,
  deleteCategory,
  getCategoryProducts
};
