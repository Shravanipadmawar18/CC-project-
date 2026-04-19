/**
 * ===========================================
 * CART CONTROLLER
 * ===========================================
 * 
 * Handles shopping cart operations:
 * add, remove, update, and get cart items.
 */

const Cart = require('../models/Cart');
const Product = require('../models/Product');
const { asyncHandler, ApiError } = require('../middleware/errorMiddleware');

/**
 * @desc    Get user's cart
 * @route   GET /api/cart
 * @access  Private
 */
const getCart = asyncHandler(async (req, res) => {
  let cart = await Cart.findOne({ user: req.user._id })
    .populate({
      path: 'items.product',
      select: 'name price images stock isActive slug'
    });

  // Create cart if doesn't exist
  if (!cart) {
    cart = await Cart.create({ user: req.user._id, items: [] });
  }

  // Filter out inactive products and update cart if necessary
  const activeItems = cart.items.filter(
    item => item.product && item.product.isActive
  );

  if (activeItems.length !== cart.items.length) {
    cart.items = activeItems;
    await cart.save();
  }

  res.status(200).json({
    success: true,
    data: {
      cart: {
        _id: cart._id,
        items: cart.items,
        subtotal: cart.subtotal,
        totalItems: cart.totalItems,
        total: cart.total,
        couponCode: cart.couponCode,
        couponDiscount: cart.couponDiscount
      }
    }
  });
});

/**
 * @desc    Add item to cart
 * @route   POST /api/cart
 * @access  Private
 */
const addToCart = asyncHandler(async (req, res) => {
  const { productId, quantity = 1, attributes = {} } = req.body;

  // Check if product exists and is active
  const product = await Product.findById(productId);
  if (!product || !product.isActive) {
    throw new ApiError('Product not found', 404);
  }

  // Check stock availability
  if (product.stock < quantity) {
    throw new ApiError(
      `Only ${product.stock} items available in stock`,
      400
    );
  }

  // Find or create cart
  let cart = await Cart.findOne({ user: req.user._id });
  if (!cart) {
    cart = new Cart({ user: req.user._id, items: [] });
  }

  // Check if product already in cart
  const existingItemIndex = cart.items.findIndex(
    item => item.product.toString() === productId
  );

  if (existingItemIndex > -1) {
    // Update quantity
    const newQuantity = cart.items[existingItemIndex].quantity + quantity;
    
    // Check stock for new quantity
    if (product.stock < newQuantity) {
      throw new ApiError(
        `Only ${product.stock} items available in stock`,
        400
      );
    }
    
    cart.items[existingItemIndex].quantity = newQuantity;
    cart.items[existingItemIndex].price = product.price;
  } else {
    // Add new item
    cart.items.push({
      product: productId,
      quantity,
      price: product.price,
      selectedAttributes: attributes
    });
  }

  await cart.save();

  // Populate cart items
  await cart.populate({
    path: 'items.product',
    select: 'name price images stock isActive slug'
  });

  res.status(200).json({
    success: true,
    message: 'Product added to cart',
    data: {
      cart: {
        _id: cart._id,
        items: cart.items,
        subtotal: cart.subtotal,
        totalItems: cart.totalItems,
        total: cart.total
      }
    }
  });
});

/**
 * @desc    Update cart item quantity
 * @route   PUT /api/cart/:productId
 * @access  Private
 */
const updateCartItem = asyncHandler(async (req, res) => {
  const { productId } = req.params;
  const { quantity } = req.body;

  const cart = await Cart.findOne({ user: req.user._id });
  if (!cart) {
    throw new ApiError('Cart not found', 404);
  }

  // Find item in cart
  const itemIndex = cart.items.findIndex(
    item => item.product.toString() === productId
  );

  if (itemIndex === -1) {
    throw new ApiError('Item not found in cart', 404);
  }

  // If quantity is 0 or less, remove item
  if (quantity <= 0) {
    cart.items.splice(itemIndex, 1);
  } else {
    // Check stock
    const product = await Product.findById(productId);
    if (!product) {
      throw new ApiError('Product not found', 404);
    }
    
    if (product.stock < quantity) {
      throw new ApiError(
        `Only ${product.stock} items available in stock`,
        400
      );
    }
    
    cart.items[itemIndex].quantity = quantity;
    cart.items[itemIndex].price = product.price;
  }

  await cart.save();

  // Populate cart items
  await cart.populate({
    path: 'items.product',
    select: 'name price images stock isActive slug'
  });

  res.status(200).json({
    success: true,
    message: 'Cart updated',
    data: {
      cart: {
        _id: cart._id,
        items: cart.items,
        subtotal: cart.subtotal,
        totalItems: cart.totalItems,
        total: cart.total
      }
    }
  });
});

/**
 * @desc    Remove item from cart
 * @route   DELETE /api/cart/:productId
 * @access  Private
 */
const removeFromCart = asyncHandler(async (req, res) => {
  const { productId } = req.params;

  const cart = await Cart.findOne({ user: req.user._id });
  if (!cart) {
    throw new ApiError('Cart not found', 404);
  }

  // Find and remove item
  const itemIndex = cart.items.findIndex(
    item => item.product.toString() === productId
  );

  if (itemIndex === -1) {
    throw new ApiError('Item not found in cart', 404);
  }

  cart.items.splice(itemIndex, 1);
  await cart.save();

  // Populate cart items
  await cart.populate({
    path: 'items.product',
    select: 'name price images stock isActive slug'
  });

  res.status(200).json({
    success: true,
    message: 'Item removed from cart',
    data: {
      cart: {
        _id: cart._id,
        items: cart.items,
        subtotal: cart.subtotal,
        totalItems: cart.totalItems,
        total: cart.total
      }
    }
  });
});

/**
 * @desc    Clear cart
 * @route   DELETE /api/cart
 * @access  Private
 */
const clearCart = asyncHandler(async (req, res) => {
  const cart = await Cart.findOne({ user: req.user._id });
  
  if (cart) {
    cart.items = [];
    cart.couponCode = undefined;
    cart.couponDiscount = 0;
    await cart.save();
  }

  res.status(200).json({
    success: true,
    message: 'Cart cleared',
    data: {
      cart: {
        _id: cart?._id,
        items: [],
        subtotal: 0,
        totalItems: 0,
        total: 0
      }
    }
  });
});

/**
 * @desc    Apply coupon to cart
 * @route   POST /api/cart/coupon
 * @access  Private
 */
const applyCoupon = asyncHandler(async (req, res) => {
  const { code } = req.body;

  const cart = await Cart.findOne({ user: req.user._id });
  if (!cart || cart.items.length === 0) {
    throw new ApiError('Cart is empty', 400);
  }

  // Validate coupon (simplified - in production, use a Coupon model)
  const validCoupons = {
    'SAVE10': { type: 'percentage', value: 10 },
    'SAVE20': { type: 'percentage', value: 20 },
    'FLAT100': { type: 'fixed', value: 100 },
    'FLAT500': { type: 'fixed', value: 500 }
  };

  const coupon = validCoupons[code.toUpperCase()];
  if (!coupon) {
    throw new ApiError('Invalid coupon code', 400);
  }

  // Calculate discount
  let discount;
  if (coupon.type === 'percentage') {
    discount = Math.round(cart.subtotal * (coupon.value / 100));
  } else {
    discount = coupon.value;
  }

  // Apply coupon
  cart.couponCode = code.toUpperCase();
  cart.couponDiscount = Math.min(discount, cart.subtotal); // Don't exceed subtotal
  await cart.save();

  res.status(200).json({
    success: true,
    message: `Coupon applied! You saved ₹${cart.couponDiscount}`,
    data: {
      couponCode: cart.couponCode,
      discount: cart.couponDiscount,
      total: cart.total
    }
  });
});

/**
 * @desc    Remove coupon from cart
 * @route   DELETE /api/cart/coupon
 * @access  Private
 */
const removeCoupon = asyncHandler(async (req, res) => {
  const cart = await Cart.findOne({ user: req.user._id });
  
  if (cart) {
    cart.couponCode = undefined;
    cart.couponDiscount = 0;
    await cart.save();
  }

  res.status(200).json({
    success: true,
    message: 'Coupon removed'
  });
});

module.exports = {
  getCart,
  addToCart,
  updateCartItem,
  removeFromCart,
  clearCart,
  applyCoupon,
  removeCoupon
};
