/**
 * ===========================================
 * PRODUCT MODEL
 * ===========================================
 * 
 * Schema for products with categories, reviews,
 * inventory management, and recommendation data.
 * 
 * Features:
 * - Auto-generated image URLs from public sources
 * - Multiple product images support
 * - Fallback images for missing uploads
 */

const mongoose = require('mongoose');
const { getCuratedProductImages, getFallbackImageUrl } = require('../utils/imageHelper');

// Review sub-schema for product reviews
const reviewSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  name: {
    type: String,
    required: true
  },
  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5
  },
  comment: {
    type: String,
    required: true,
    maxlength: 500
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Product name is required'],
    trim: true,
    maxlength: [200, 'Product name cannot exceed 200 characters']
  },
  slug: {
    type: String,
    unique: true,
    lowercase: true
  },
  description: {
    type: String,
    required: [true, 'Product description is required'],
    maxlength: [2000, 'Description cannot exceed 2000 characters']
  },
  shortDescription: {
    type: String,
    maxlength: [300, 'Short description cannot exceed 300 characters']
  },
  price: {
    type: Number,
    required: [true, 'Product price is required'],
    min: [0, 'Price cannot be negative'],
    default: 0
  },
  originalPrice: {
    type: Number,
    min: [0, 'Original price cannot be negative']
  },
  discount: {
    type: Number,
    min: [0, 'Discount cannot be negative'],
    max: [100, 'Discount cannot exceed 100%'],
    default: 0
  },
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    required: [true, 'Product category is required']
  },
  subCategory: {
    type: String,
    trim: true
  },
  brand: {
    type: String,
    trim: true,
    maxlength: [100, 'Brand name cannot exceed 100 characters']
  },
  images: [{
    url: {
      type: String,
      required: true
    },
    alt: {
      type: String,
      default: 'Product image'
    },
    isPrimary: {
      type: Boolean,
      default: false
    }
  }],
  // Thumbnail URL for faster loading
  thumbnail: {
    type: String
  },
  // Flag to track if images are auto-generated
  hasCustomImages: {
    type: Boolean,
    default: false
  },
  // Inventory management
  stock: {
    type: Number,
    required: [true, 'Stock quantity is required'],
    min: [0, 'Stock cannot be negative'],
    default: 0
  },
  lowStockThreshold: {
    type: Number,
    default: 10
  },
  sku: {
    type: String,
    unique: true,
    sparse: true,
    uppercase: true
  },
  // Product attributes (for filtering)
  attributes: {
    color: [String],
    size: [String],
    material: String,
    weight: String,
    dimensions: String
  },
  // Product specifications
  specifications: [{
    name: String,
    value: String
  }],
  // Tags for search and recommendations
  tags: [{
    type: String,
    lowercase: true,
    trim: true
  }],
  // Reviews and ratings
  reviews: [reviewSchema],
  rating: {
    type: Number,
    default: 0,
    min: 0,
    max: 5
  },
  numReviews: {
    type: Number,
    default: 0
  },
  // Tracking for recommendations
  viewCount: {
    type: Number,
    default: 0
  },
  purchaseCount: {
    type: Number,
    default: 0
  },
  // Related products (for similarity recommendations)
  relatedProducts: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product'
  }],
  // Frequently bought together
  frequentlyBoughtWith: [{
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product'
    },
    count: {
      type: Number,
      default: 1
    }
  }],
  // Product status
  isActive: {
    type: Boolean,
    default: true
  },
  isFeatured: {
    type: Boolean,
    default: false
  },
  isNewArrival: {
    type: Boolean,
    default: false
  },
  // SEO fields
  metaTitle: {
    type: String,
    maxlength: 70
  },
  metaDescription: {
    type: String,
    maxlength: 160
  },
  // Seller/Admin who created the product
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// ===========================================
// INDEXES
// ===========================================
productSchema.index({ name: 'text', description: 'text', tags: 'text', brand: 'text' });
productSchema.index({ category: 1 });
productSchema.index({ price: 1 });
productSchema.index({ rating: -1 });
productSchema.index({ createdAt: -1 });
productSchema.index({ slug: 1 });
productSchema.index({ isActive: 1, isFeatured: 1 });
productSchema.index({ viewCount: -1 });
productSchema.index({ purchaseCount: -1 });

// ===========================================
// MIDDLEWARE
// ===========================================

/**
 * Generate slug from product name before saving
 */
productSchema.pre('save', function(next) {
  if (this.isModified('name')) {
    this.slug = this.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '') + 
      '-' + Date.now().toString(36);
  }
  next();
});

/**
 * Auto-generate images if not provided
 */
productSchema.pre('save', function(next) {
  // Check if images are missing or empty
  if (!this.images || this.images.length === 0 || 
      (this.images.length === 1 && this.images[0].url.includes('/uploads/products/'))) {
    // Generate images based on product name
    try {
      const generatedImages = getCuratedProductImages(this.name, 4);
      this.images = generatedImages;
      this.hasCustomImages = false;
    } catch (error) {
      // Fallback to placeholder image
      this.images = [{
        url: getFallbackImageUrl(),
        alt: this.name,
        isPrimary: true
      }];
    }
  } else {
    this.hasCustomImages = true;
  }
  
  // Set thumbnail from primary image
  if (this.images && this.images.length > 0) {
    const primaryImage = this.images.find(img => img.isPrimary);
    this.thumbnail = primaryImage ? primaryImage.url : this.images[0].url;
  }
  
  next();
});

/**
 * Calculate discount percentage if originalPrice exists
 */
productSchema.pre('save', function(next) {
  if (this.originalPrice && this.originalPrice > this.price) {
    this.discount = Math.round(((this.originalPrice - this.price) / this.originalPrice) * 100);
  }
  next();
});

/**
 * Calculate average rating from reviews
 */
productSchema.methods.calculateAverageRating = function() {
  if (this.reviews.length === 0) {
    this.rating = 0;
    this.numReviews = 0;
  } else {
    const total = this.reviews.reduce((acc, review) => acc + review.rating, 0);
    this.rating = Math.round((total / this.reviews.length) * 10) / 10;
    this.numReviews = this.reviews.length;
  }
};

// ===========================================
// VIRTUAL FIELDS
// ===========================================

/**
 * Check if product is in stock
 */
productSchema.virtual('inStock').get(function() {
  return this.stock > 0;
});

/**
 * Check if product has low stock
 */
productSchema.virtual('isLowStock').get(function() {
  return this.stock > 0 && this.stock <= this.lowStockThreshold;
});

/**
 * Get primary image URL with fallback
 */
productSchema.virtual('primaryImage').get(function() {
  if (this.images && this.images.length > 0) {
    const primary = this.images.find(img => img.isPrimary);
    return primary ? primary.url : this.images[0].url;
  }
  // Return internet placeholder if no images
  return getFallbackImageUrl();
});

/**
 * Get all image URLs as simple array
 */
productSchema.virtual('imageUrls').get(function() {
  if (this.images && this.images.length > 0) {
    return this.images.map(img => img.url);
  }
  return [getFallbackImageUrl()];
});

/**
 * Get discounted price
 */
productSchema.virtual('discountedPrice').get(function() {
  if (this.discount > 0) {
    return Math.round(this.price * (1 - this.discount / 100) * 100) / 100;
  }
  return this.price;
});

// ===========================================
// STATIC METHODS
// ===========================================

/**
 * Find similar products based on category, tags, and attributes
 * @param {ObjectId} productId - Product ID to find similar products for
 * @param {number} limit - Number of similar products to return
 */
productSchema.statics.findSimilarProducts = async function(productId, limit = 6) {
  const product = await this.findById(productId);
  if (!product) return [];

  // Find products in same category with similar tags
  const similarProducts = await this.find({
    _id: { $ne: productId },
    isActive: true,
    $or: [
      { category: product.category },
      { tags: { $in: product.tags } },
      { brand: product.brand }
    ]
  })
    .limit(limit)
    .sort({ rating: -1, purchaseCount: -1 });

  return similarProducts;
};

/**
 * Get trending products based on views and purchases
 */
productSchema.statics.getTrendingProducts = async function(limit = 10) {
  return await this.find({ isActive: true })
    .sort({ purchaseCount: -1, viewCount: -1, rating: -1 })
    .limit(limit);
};

/**
 * Get featured products
 */
productSchema.statics.getFeaturedProducts = async function(limit = 8) {
  return await this.find({ isActive: true, isFeatured: true })
    .sort({ rating: -1 })
    .limit(limit);
};

const Product = mongoose.model('Product', productSchema);

module.exports = Product;
