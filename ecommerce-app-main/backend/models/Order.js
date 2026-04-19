/**
 * ===========================================
 * ORDER MODEL
 * ===========================================
 * 
 * Schema for orders with items, shipping,
 * payment, and status tracking.
 */

const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  name: {
    type: String,
    required: true
  },
  image: {
    type: String
  },
  price: {
    type: Number,
    required: true
  },
  quantity: {
    type: Number,
    required: true,
    min: 1
  },
  selectedAttributes: {
    size: String,
    color: String
  }
});

const shippingAddressSchema = new mongoose.Schema({
  fullName: {
    type: String,
    required: [true, 'Full name is required']
  },
  phone: {
    type: String,
    required: [true, 'Phone number is required']
  },
  address: {
    type: String,
    required: [true, 'Street address is required']
  },
  city: {
    type: String,
    required: [true, 'City is required']
  },
  state: {
    type: String,
    required: [true, 'State is required']
  },
  zipCode: {
    type: String,
    required: [true, 'ZIP code is required']
  },
  country: {
    type: String,
    required: [true, 'Country is required'],
    default: 'India'
  }
});

const orderSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  orderNumber: {
    type: String,
    unique: true,
    required: true
  },
  items: [orderItemSchema],
  shippingAddress: shippingAddressSchema,
  // Price breakdown
  itemsPrice: {
    type: Number,
    required: true,
    default: 0
  },
  shippingPrice: {
    type: Number,
    required: true,
    default: 0
  },
  taxPrice: {
    type: Number,
    required: true,
    default: 0
  },
  discountAmount: {
    type: Number,
    default: 0
  },
  couponCode: {
    type: String
  },
  totalPrice: {
    type: Number,
    required: true,
    default: 0
  },
  // Payment information
  paymentMethod: {
    type: String,
    required: true,
    enum: ['stripe', 'cod', 'upi', 'netbanking'],
    default: 'stripe'
  },
  paymentResult: {
    id: String,
    status: String,
    updateTime: String,
    emailAddress: String
  },
  isPaid: {
    type: Boolean,
    default: false
  },
  paidAt: {
    type: Date
  },
  // Order status
  status: {
    type: String,
    enum: [
      'pending',
      'confirmed',
      'processing',
      'shipped',
      'out_for_delivery',
      'delivered',
      'cancelled',
      'returned',
      'refunded'
    ],
    default: 'pending'
  },
  // Status history for tracking
  statusHistory: [{
    status: {
      type: String,
      required: true
    },
    timestamp: {
      type: Date,
      default: Date.now
    },
    note: String
  }],
  // Shipping information
  trackingNumber: {
    type: String
  },
  carrier: {
    type: String
  },
  estimatedDelivery: {
    type: Date
  },
  isDelivered: {
    type: Boolean,
    default: false
  },
  deliveredAt: {
    type: Date
  },
  // Additional notes
  notes: {
    type: String,
    maxlength: 500
  },
  // Cancellation/Return
  cancelReason: String,
  returnReason: String
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// ===========================================
// INDEXES
// ===========================================
orderSchema.index({ user: 1, createdAt: -1 });
orderSchema.index({ orderNumber: 1 });
orderSchema.index({ status: 1 });
orderSchema.index({ createdAt: -1 });
orderSchema.index({ isPaid: 1 });

// ===========================================
// MIDDLEWARE
// ===========================================

/**
 * Generate unique order number before saving
 */
orderSchema.pre('save', async function(next) {
  if (this.isNew && !this.orderNumber) {
    // Generate order number: ORD-YYYYMMDD-XXXXX
    const date = new Date();
    const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');
    const random = Math.random().toString(36).substring(2, 7).toUpperCase();
    this.orderNumber = `ORD-${dateStr}-${random}`;
    
    // Add initial status to history
    this.statusHistory.push({
      status: this.status,
      timestamp: new Date(),
      note: 'Order created'
    });
  }
  next();
});

// ===========================================
// INSTANCE METHODS
// ===========================================

/**
 * Update order status and add to history
 */
orderSchema.methods.updateStatus = async function(newStatus, note = '') {
  this.status = newStatus;
  this.statusHistory.push({
    status: newStatus,
    timestamp: new Date(),
    note
  });

  // Update delivery status
  if (newStatus === 'delivered') {
    this.isDelivered = true;
    this.deliveredAt = new Date();
  }

  return this.save();
};

/**
 * Mark order as paid
 */
orderSchema.methods.markAsPaid = async function(paymentResult) {
  this.isPaid = true;
  this.paidAt = new Date();
  this.paymentResult = paymentResult;
  this.status = 'confirmed';
  
  this.statusHistory.push({
    status: 'confirmed',
    timestamp: new Date(),
    note: `Payment received via ${this.paymentMethod}`
  });

  return this.save();
};

/**
 * Cancel order
 */
orderSchema.methods.cancelOrder = async function(reason = '') {
  this.status = 'cancelled';
  this.cancelReason = reason;
  
  this.statusHistory.push({
    status: 'cancelled',
    timestamp: new Date(),
    note: reason || 'Order cancelled by user'
  });

  return this.save();
};

// ===========================================
// STATIC METHODS
// ===========================================

/**
 * Get order statistics for admin dashboard
 */
orderSchema.statics.getOrderStats = async function() {
  const stats = await this.aggregate([
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 },
        totalAmount: { $sum: '$totalPrice' }
      }
    }
  ]);

  const totalOrders = await this.countDocuments();
  const totalRevenue = await this.aggregate([
    { $match: { isPaid: true } },
    { $group: { _id: null, total: { $sum: '$totalPrice' } } }
  ]);

  return {
    byStatus: stats,
    totalOrders,
    totalRevenue: totalRevenue[0]?.total || 0
  };
};

/**
 * Get recent orders
 */
orderSchema.statics.getRecentOrders = async function(limit = 10) {
  return await this.find()
    .sort({ createdAt: -1 })
    .limit(limit)
    .populate('user', 'name email');
};

const Order = mongoose.model('Order', orderSchema);

module.exports = Order;
