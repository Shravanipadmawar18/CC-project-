/**
 * ===========================================
 * CART MODEL
 * ===========================================
 * 
 * Schema for shopping cart with items,
 * quantities, and price calculations.
 */

const mongoose = require('mongoose');

const cartItemSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  quantity: {
    type: Number,
    required: true,
    min: [1, 'Quantity must be at least 1'],
    default: 1
  },
  price: {
    type: Number,
    required: true
  },
  // Selected attributes (size, color, etc.)
  selectedAttributes: {
    size: String,
    color: String
  }
}, {
  timestamps: true
});

const cartSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  items: [cartItemSchema],
  // Coupon/discount code
  couponCode: {
    type: String,
    uppercase: true
  },
  couponDiscount: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// ===========================================
// INDEXES
// ===========================================
cartSchema.index({ user: 1 });

// ===========================================
// VIRTUAL FIELDS
// ===========================================

/**
 * Calculate subtotal (before discounts)
 */
cartSchema.virtual('subtotal').get(function() {
  return this.items.reduce((total, item) => {
    return total + (item.price * item.quantity);
  }, 0);
});

/**
 * Calculate total items count
 */
cartSchema.virtual('totalItems').get(function() {
  return this.items.reduce((total, item) => total + item.quantity, 0);
});

/**
 * Calculate total after discount
 */
cartSchema.virtual('total').get(function() {
  const subtotal = this.subtotal;
  const discount = this.couponDiscount || 0;
  return Math.max(0, subtotal - discount);
});

// ===========================================
// INSTANCE METHODS
// ===========================================

/**
 * Add item to cart
 */
cartSchema.methods.addItem = async function(productId, quantity, price, attributes = {}) {
  const existingItemIndex = this.items.findIndex(
    item => item.product.toString() === productId.toString()
  );

  if (existingItemIndex > -1) {
    // Update quantity if item exists
    this.items[existingItemIndex].quantity += quantity;
  } else {
    // Add new item
    this.items.push({
      product: productId,
      quantity,
      price,
      selectedAttributes: attributes
    });
  }

  return this.save();
};

/**
 * Remove item from cart
 */
cartSchema.methods.removeItem = async function(productId) {
  this.items = this.items.filter(
    item => item.product.toString() !== productId.toString()
  );
  return this.save();
};

/**
 * Update item quantity
 */
cartSchema.methods.updateItemQuantity = async function(productId, quantity) {
  const item = this.items.find(
    item => item.product.toString() === productId.toString()
  );

  if (item) {
    if (quantity <= 0) {
      return this.removeItem(productId);
    }
    item.quantity = quantity;
  }

  return this.save();
};

/**
 * Clear all items from cart
 */
cartSchema.methods.clearCart = async function() {
  this.items = [];
  this.couponCode = undefined;
  this.couponDiscount = 0;
  return this.save();
};

/**
 * Apply coupon code
 */
cartSchema.methods.applyCoupon = async function(code, discountAmount) {
  this.couponCode = code;
  this.couponDiscount = discountAmount;
  return this.save();
};

const Cart = mongoose.model('Cart', cartSchema);

module.exports = Cart;
