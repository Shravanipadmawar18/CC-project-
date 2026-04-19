/**
 * ===========================================
 * USER MODEL
 * ===========================================
 * 
 * Schema for user accounts with authentication.
 * Includes password hashing, JWT generation,
 * and role-based access control.
 */

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please provide your name'],
    trim: true,
    maxlength: [50, 'Name cannot exceed 50 characters']
  },
  email: {
    type: String,
    required: [true, 'Please provide your email'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [
      /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
      'Please provide a valid email'
    ]
  },
  password: {
    type: String,
    required: [true, 'Please provide a password'],
    minlength: [6, 'Password must be at least 6 characters'],
    select: false // Don't return password by default
  },
  role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user'
  },
  avatar: {
    type: String,
    default: 'default-avatar.png'
  },
  phone: {
    type: String,
    maxlength: [20, 'Phone number cannot exceed 20 characters']
  },
  address: {
    street: { type: String, trim: true },
    city: { type: String, trim: true },
    state: { type: String, trim: true },
    zipCode: { type: String, trim: true },
    country: { type: String, trim: true, default: 'India' }
  },
  // User activity tracking for recommendations
  viewedProducts: [{
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product'
    },
    viewedAt: {
      type: Date,
      default: Date.now
    }
  }],
  purchasedProducts: [{
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product'
    },
    purchasedAt: {
      type: Date,
      default: Date.now
    }
  }],
  searchHistory: [{
    query: String,
    searchedAt: {
      type: Date,
      default: Date.now
    }
  }],
  wishlist: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product'
  }],
  isActive: {
    type: Boolean,
    default: true
  },
  lastLogin: {
    type: Date
  },
  passwordChangedAt: Date,
  passwordResetToken: String,
  passwordResetExpires: Date
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// ===========================================
// INDEXES
// ===========================================
userSchema.index({ email: 1 });
userSchema.index({ role: 1 });
userSchema.index({ createdAt: -1 });

// ===========================================
// MIDDLEWARE
// ===========================================

/**
 * Hash password before saving
 */
userSchema.pre('save', async function(next) {
  // Only hash if password is modified
  if (!this.isModified('password')) {
    return next();
  }

  try {
    // Generate salt and hash password
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

/**
 * Update passwordChangedAt when password is modified
 */
userSchema.pre('save', function(next) {
  if (!this.isModified('password') || this.isNew) {
    return next();
  }
  
  this.passwordChangedAt = Date.now() - 1000;
  next();
});

// ===========================================
// INSTANCE METHODS
// ===========================================

/**
 * Compare entered password with hashed password
 * @param {string} enteredPassword - Plain text password
 * @returns {Promise<boolean>}
 */
userSchema.methods.comparePassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

/**
 * Generate JWT token for authentication
 * @returns {string} JWT token
 */
userSchema.methods.generateAuthToken = function() {
  return jwt.sign(
    { 
      id: this._id,
      email: this.email,
      role: this.role 
    },
    process.env.JWT_SECRET,
    { 
      expiresIn: process.env.JWT_EXPIRE || '30d' 
    }
  );
};

/**
 * Check if password was changed after token was issued
 * @param {number} JWTTimestamp - Token issued timestamp
 * @returns {boolean}
 */
userSchema.methods.changedPasswordAfter = function(JWTTimestamp) {
  if (this.passwordChangedAt) {
    const changedTimestamp = parseInt(
      this.passwordChangedAt.getTime() / 1000,
      10
    );
    return JWTTimestamp < changedTimestamp;
  }
  return false;
};

/**
 * Add product to view history (for recommendations)
 * @param {ObjectId} productId - Product ID
 */
userSchema.methods.addToViewHistory = async function(productId) {
  // Remove if already exists to avoid duplicates
  this.viewedProducts = this.viewedProducts.filter(
    item => item.product.toString() !== productId.toString()
  );
  
  // Add to beginning of array
  this.viewedProducts.unshift({ product: productId });
  
  // Keep only last 50 viewed products
  if (this.viewedProducts.length > 50) {
    this.viewedProducts = this.viewedProducts.slice(0, 50);
  }
  
  await this.save({ validateBeforeSave: false });
};

/**
 * Add search query to history
 * @param {string} query - Search query
 */
userSchema.methods.addToSearchHistory = async function(query) {
  this.searchHistory.unshift({ query });
  
  // Keep only last 20 searches
  if (this.searchHistory.length > 20) {
    this.searchHistory = this.searchHistory.slice(0, 20);
  }
  
  await this.save({ validateBeforeSave: false });
};

// ===========================================
// VIRTUAL FIELDS
// ===========================================

/**
 * Get user's full address as string
 */
userSchema.virtual('fullAddress').get(function() {
  if (!this.address) return '';
  const { street, city, state, zipCode, country } = this.address;
  return [street, city, state, zipCode, country].filter(Boolean).join(', ');
});

const User = mongoose.model('User', userSchema);

module.exports = User;
