/**
 * ===========================================
 * CATEGORY MODEL
 * ===========================================
 * 
 * Schema for product categories with
 * hierarchical structure support.
 */

const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Category name is required'],
    unique: true,
    trim: true,
    maxlength: [100, 'Category name cannot exceed 100 characters']
  },
  slug: {
    type: String,
    unique: true,
    lowercase: true
  },
  description: {
    type: String,
    maxlength: [500, 'Description cannot exceed 500 characters']
  },
  image: {
    type: String,
    default: 'default-category.png'
  },
  icon: {
    type: String // Icon class or URL
  },
  parent: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    default: null
  },
  isActive: {
    type: Boolean,
    default: true
  },
  displayOrder: {
    type: Number,
    default: 0
  },
  // SEO fields
  metaTitle: String,
  metaDescription: String
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// ===========================================
// INDEXES
// ===========================================
categorySchema.index({ slug: 1 });
categorySchema.index({ parent: 1 });
categorySchema.index({ displayOrder: 1 });

// ===========================================
// MIDDLEWARE
// ===========================================

/**
 * Generate slug from category name
 */
categorySchema.pre('save', function(next) {
  if (this.isModified('name')) {
    this.slug = this.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '');
  }
  next();
});

// ===========================================
// VIRTUAL FIELDS
// ===========================================

/**
 * Get subcategories
 */
categorySchema.virtual('subcategories', {
  ref: 'Category',
  localField: '_id',
  foreignField: 'parent'
});

/**
 * Get product count in category
 */
categorySchema.virtual('productCount', {
  ref: 'Product',
  localField: '_id',
  foreignField: 'category',
  count: true
});

// ===========================================
// STATIC METHODS
// ===========================================

/**
 * Get all categories with hierarchy
 */
categorySchema.statics.getCategoryTree = async function() {
  const categories = await this.find({ isActive: true, parent: null })
    .sort({ displayOrder: 1 })
    .populate({
      path: 'subcategories',
      match: { isActive: true },
      options: { sort: { displayOrder: 1 } }
    });
  
  return categories;
};

const Category = mongoose.model('Category', categorySchema);

module.exports = Category;
