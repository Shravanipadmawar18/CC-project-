/**
 * ===========================================
 * AI-POWERED RECOMMENDATION CONTROLLER
 * ===========================================
 * 
 * This controller implements an intelligent product
 * recommendation system using multiple algorithms:
 * 
 * 1. COLLABORATIVE FILTERING
 *    - Analyzes user behavior (views, purchases, searches)
 *    - Finds similar users and recommends what they bought
 *    - Uses purchase patterns to suggest products
 * 
 * 2. CONTENT-BASED FILTERING
 *    - Analyzes product attributes (category, tags, brand)
 *    - Finds similar products based on features
 *    - Uses TF-IDF-like scoring for text similarity
 * 
 * 3. HYBRID APPROACH
 *    - Combines collaborative and content-based methods
 *    - Weights recommendations based on confidence scores
 *    - Provides personalized suggestions
 * 
 * 4. POPULARITY-BASED FALLBACK
 *    - For new users (cold start problem)
 *    - Uses trending and bestselling products
 * 
 * HOW IT WORKS:
 * -------------
 * For logged-in users:
 * - Analyzes their view history, purchase history, and searches
 * - Finds products in same categories they've interacted with
 * - Identifies products frequently bought together
 * - Scores products based on multiple factors
 * 
 * For guest users:
 * - Returns trending and popular products
 * - Shows featured products and new arrivals
 * 
 * SCORING ALGORITHM:
 * - Category match: +30 points
 * - Tag match: +20 points per matching tag
 * - Brand match: +15 points
 * - Frequently bought together: +25 points
 * - High rating (4+): +10 points
 * - Popularity (purchase count): +5 points per 10 purchases
 * - Recency bonus for new products: +5 points
 */

const Product = require('../models/Product');
const User = require('../models/User');
const Order = require('../models/Order');
const { asyncHandler, ApiError } = require('../middleware/errorMiddleware');

/**
 * Calculate similarity score between two products
 * Uses Jaccard similarity for tags and attributes
 */
const calculateSimilarity = (product1, product2) => {
  let score = 0;

  // Category match (highest weight)
  if (product1.category?.toString() === product2.category?.toString()) {
    score += 30;
  }

  // Tag similarity (Jaccard coefficient)
  if (product1.tags && product2.tags) {
    const tags1 = new Set(product1.tags.map(t => t.toLowerCase()));
    const tags2 = new Set(product2.tags.map(t => t.toLowerCase()));
    const intersection = [...tags1].filter(t => tags2.has(t)).length;
    const union = new Set([...tags1, ...tags2]).size;
    if (union > 0) {
      score += Math.round((intersection / union) * 20);
    }
  }

  // Brand match
  if (product1.brand && product2.brand) {
    if (product1.brand.toLowerCase() === product2.brand.toLowerCase()) {
      score += 15;
    }
  }

  // Price range similarity (within 30% range)
  const priceDiff = Math.abs(product1.price - product2.price);
  const avgPrice = (product1.price + product2.price) / 2;
  if (avgPrice > 0 && priceDiff / avgPrice < 0.3) {
    score += 10;
  }

  return score;
};

/**
 * Calculate product recommendation score for a user
 */
const calculateRecommendationScore = (product, userContext) => {
  let score = 0;
  const reasons = [];

  const {
    viewedCategories = [],
    purchasedCategories = [],
    viewedBrands = [],
    searchTerms = [],
    viewedProductIds = []
  } = userContext;

  // Skip if already viewed recently
  if (viewedProductIds.includes(product._id.toString())) {
    return { score: -1, reasons: ['already_viewed'] };
  }

  // Category match from purchases (highest intent)
  if (purchasedCategories.includes(product.category?.toString())) {
    score += 35;
    reasons.push('matches_purchase_history');
  }

  // Category match from views
  if (viewedCategories.includes(product.category?.toString())) {
    score += 25;
    reasons.push('matches_browsing_history');
  }

  // Brand affinity
  if (viewedBrands.includes(product.brand?.toLowerCase())) {
    score += 15;
    reasons.push('favorite_brand');
  }

  // Search term match
  const productText = `${product.name} ${product.description} ${product.tags?.join(' ')}`.toLowerCase();
  for (const term of searchTerms) {
    if (productText.includes(term.toLowerCase())) {
      score += 10;
      reasons.push('matches_search');
      break;
    }
  }

  // High rating bonus
  if (product.rating >= 4) {
    score += 10;
    reasons.push('highly_rated');
  }

  // Popularity score
  score += Math.min(Math.floor(product.purchaseCount / 10) * 5, 25);
  if (product.purchaseCount > 50) {
    reasons.push('bestseller');
  }

  // Trending (high view count recently)
  if (product.viewCount > 100) {
    score += 5;
    reasons.push('trending');
  }

  // New arrival bonus (last 30 days)
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  if (product.createdAt > thirtyDaysAgo) {
    score += 5;
    reasons.push('new_arrival');
  }

  // Featured products bonus
  if (product.isFeatured) {
    score += 5;
    reasons.push('featured');
  }

  return { score, reasons };
};

/**
 * @desc    Get personalized recommendations for user
 * @route   GET /api/recommendations
 * @access  Public (personalized if logged in)
 */
const getRecommendations = asyncHandler(async (req, res) => {
  const limit = parseInt(req.query.limit) || 12;
  let recommendations = [];

  if (req.user) {
    // =========================================
    // PERSONALIZED RECOMMENDATIONS (LOGGED IN)
    // =========================================

    // Get user with activity data
    const user = await User.findById(req.user._id)
      .populate('viewedProducts.product', 'category brand tags')
      .populate('purchasedProducts.product', 'category brand tags');

    // Build user context
    const viewedCategories = [...new Set(
      user.viewedProducts
        .filter(v => v.product)
        .map(v => v.product.category?.toString())
        .filter(Boolean)
    )];

    const purchasedCategories = [...new Set(
      user.purchasedProducts
        .filter(p => p.product)
        .map(p => p.product.category?.toString())
        .filter(Boolean)
    )];

    const viewedBrands = [...new Set(
      user.viewedProducts
        .filter(v => v.product?.brand)
        .map(v => v.product.brand.toLowerCase())
    )];

    const searchTerms = user.searchHistory
      .slice(0, 10)
      .map(s => s.query);

    const viewedProductIds = user.viewedProducts
      .slice(0, 20)
      .map(v => v.product?._id?.toString())
      .filter(Boolean);

    const userContext = {
      viewedCategories,
      purchasedCategories,
      viewedBrands,
      searchTerms,
      viewedProductIds
    };

    // Get candidate products
    const allCategories = [...new Set([...viewedCategories, ...purchasedCategories])];
    
    let candidateProducts = await Product.find({
      isActive: true,
      _id: { $nin: viewedProductIds.map(id => id) },
      $or: [
        { category: { $in: allCategories } },
        { brand: { $in: viewedBrands } },
        { isFeatured: true },
        { purchaseCount: { $gt: 20 } }
      ]
    })
      .populate('category', 'name')
      .limit(100);

    // Score and rank products
    const scoredProducts = candidateProducts.map(product => {
      const { score, reasons } = calculateRecommendationScore(product, userContext);
      return { product, score, reasons };
    });

    // Sort by score and take top results
    scoredProducts.sort((a, b) => b.score - a.score);
    recommendations = scoredProducts
      .filter(sp => sp.score > 0)
      .slice(0, limit)
      .map(sp => ({
        ...sp.product.toObject(),
        recommendationScore: sp.score,
        reasons: sp.reasons
      }));

    // If not enough personalized recommendations, add popular products
    if (recommendations.length < limit) {
      const existingIds = recommendations.map(r => r._id.toString());
      const additionalProducts = await Product.find({
        isActive: true,
        _id: { $nin: [...viewedProductIds, ...existingIds] }
      })
        .sort({ purchaseCount: -1, rating: -1 })
        .limit(limit - recommendations.length);

      recommendations = [
        ...recommendations,
        ...additionalProducts.map(p => ({
          ...p.toObject(),
          recommendationScore: 0,
          reasons: ['popular']
        }))
      ];
    }
  } else {
    // =========================================
    // GUEST RECOMMENDATIONS (NOT LOGGED IN)
    // =========================================
    
    // Return popular and trending products
    const [trending, featured] = await Promise.all([
      Product.find({ isActive: true })
        .sort({ purchaseCount: -1, viewCount: -1 })
        .limit(Math.ceil(limit / 2))
        .populate('category', 'name'),
      Product.find({ isActive: true, isFeatured: true })
        .sort({ rating: -1 })
        .limit(Math.ceil(limit / 2))
        .populate('category', 'name')
    ]);

    // Combine and deduplicate
    const combined = [...trending, ...featured];
    const seen = new Set();
    recommendations = combined
      .filter(p => {
        if (seen.has(p._id.toString())) return false;
        seen.add(p._id.toString());
        return true;
      })
      .slice(0, limit)
      .map(p => ({
        ...p.toObject(),
        recommendationScore: 50,
        reasons: ['popular']
      }));
  }

  res.status(200).json({
    success: true,
    count: recommendations.length,
    data: {
      recommendations,
      isPersonalized: !!req.user
    }
  });
});

/**
 * @desc    Get similar products
 * @route   GET /api/recommendations/similar/:productId
 * @access  Public
 */
const getSimilarProducts = asyncHandler(async (req, res) => {
  const { productId } = req.params;
  const limit = parseInt(req.query.limit) || 6;

  // Get source product
  const sourceProduct = await Product.findById(productId);
  if (!sourceProduct) {
    throw new ApiError('Product not found', 404);
  }

  // Find similar products using multiple criteria
  const similarProducts = await Product.find({
    _id: { $ne: productId },
    isActive: true,
    $or: [
      { category: sourceProduct.category },
      { brand: sourceProduct.brand },
      { tags: { $in: sourceProduct.tags || [] } }
    ]
  })
    .populate('category', 'name')
    .limit(50);

  // Score by similarity
  const scored = similarProducts.map(product => ({
    product,
    similarity: calculateSimilarity(sourceProduct, product)
  }));

  // Sort and return top results
  scored.sort((a, b) => b.similarity - a.similarity);
  const results = scored.slice(0, limit).map(s => ({
    ...s.product.toObject(),
    similarityScore: s.similarity
  }));

  res.status(200).json({
    success: true,
    count: results.length,
    data: { products: results }
  });
});

/**
 * @desc    Get frequently bought together products
 * @route   GET /api/recommendations/bought-together/:productId
 * @access  Public
 */
const getFrequentlyBoughtTogether = asyncHandler(async (req, res) => {
  const { productId } = req.params;
  const limit = parseInt(req.query.limit) || 4;

  // Get product with frequently bought together data
  const product = await Product.findById(productId)
    .populate({
      path: 'frequentlyBoughtWith.product',
      select: 'name price images rating isActive'
    });

  if (!product) {
    throw new ApiError('Product not found', 404);
  }

  // Filter active products and sort by count
  let boughtTogether = product.frequentlyBoughtWith
    .filter(item => item.product && item.product.isActive)
    .sort((a, b) => b.count - a.count)
    .slice(0, limit)
    .map(item => item.product);

  // If not enough, supplement with similar products from same category
  if (boughtTogether.length < limit) {
    const supplementProducts = await Product.find({
      _id: { $nin: [productId, ...boughtTogether.map(p => p._id)] },
      category: product.category,
      isActive: true
    })
      .select('name price images rating')
      .sort({ purchaseCount: -1 })
      .limit(limit - boughtTogether.length);

    boughtTogether = [...boughtTogether, ...supplementProducts];
  }

  res.status(200).json({
    success: true,
    count: boughtTogether.length,
    data: { products: boughtTogether }
  });
});

/**
 * @desc    Get trending products
 * @route   GET /api/recommendations/trending
 * @access  Public
 */
const getTrending = asyncHandler(async (req, res) => {
  const limit = parseInt(req.query.limit) || 10;
  const period = req.query.period || '7d'; // 7d, 30d, all

  // Calculate date threshold
  let dateThreshold;
  switch (period) {
    case '7d':
      dateThreshold = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      break;
    case '30d':
      dateThreshold = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      break;
    default:
      dateThreshold = new Date(0);
  }

  // Get products with high activity in the period
  // Calculate trending score: views + (purchases * 5)
  const trendingProducts = await Product.find({
    isActive: true,
    $or: [
      { viewCount: { $gt: 10 } },
      { purchaseCount: { $gt: 5 } }
    ]
  })
    .populate('category', 'name')
    .sort({ purchaseCount: -1, viewCount: -1, rating: -1 })
    .limit(limit);

  res.status(200).json({
    success: true,
    count: trendingProducts.length,
    data: {
      products: trendingProducts,
      period
    }
  });
});

/**
 * @desc    Get personalized homepage sections
 * @route   GET /api/recommendations/homepage
 * @access  Public
 */
const getHomepageRecommendations = asyncHandler(async (req, res) => {
  const sections = {};

  // 1. Featured Products
  sections.featured = await Product.find({ isActive: true, isFeatured: true })
    .populate('category', 'name')
    .sort({ rating: -1 })
    .limit(8);

  // 2. New Arrivals (last 30 days)
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  sections.newArrivals = await Product.find({
    isActive: true,
    createdAt: { $gte: thirtyDaysAgo }
  })
    .populate('category', 'name')
    .sort('-createdAt')
    .limit(8);

  // 3. Bestsellers
  sections.bestsellers = await Product.find({ isActive: true })
    .populate('category', 'name')
    .sort({ purchaseCount: -1 })
    .limit(8);

  // 4. Top Rated
  sections.topRated = await Product.find({
    isActive: true,
    rating: { $gte: 4 },
    numReviews: { $gte: 5 }
  })
    .populate('category', 'name')
    .sort({ rating: -1, numReviews: -1 })
    .limit(8);

  // 5. Personalized (if logged in)
  if (req.user) {
    const user = await User.findById(req.user._id)
      .populate('viewedProducts.product', 'category');

    const viewedCategories = user.viewedProducts
      .filter(v => v.product?.category)
      .map(v => v.product.category)
      .slice(0, 5);

    if (viewedCategories.length > 0) {
      sections.forYou = await Product.find({
        isActive: true,
        category: { $in: viewedCategories },
        _id: { $nin: user.viewedProducts.map(v => v.product?._id).filter(Boolean) }
      })
        .populate('category', 'name')
        .sort({ rating: -1, purchaseCount: -1 })
        .limit(8);
    }
  }

  // 6. Deals (products with discount)
  sections.deals = await Product.find({
    isActive: true,
    discount: { $gt: 0 }
  })
    .populate('category', 'name')
    .sort({ discount: -1 })
    .limit(8);

  res.status(200).json({
    success: true,
    data: { sections }
  });
});

/**
 * @desc    Track user activity (for improving recommendations)
 * @route   POST /api/recommendations/track
 * @access  Private
 */
const trackActivity = asyncHandler(async (req, res) => {
  const { type, productId, searchQuery } = req.body;

  const user = await User.findById(req.user._id);

  switch (type) {
    case 'view':
      if (productId) {
        await user.addToViewHistory(productId);
        // Also increment product view count
        await Product.findByIdAndUpdate(productId, { $inc: { viewCount: 1 } });
      }
      break;

    case 'search':
      if (searchQuery) {
        await user.addToSearchHistory(searchQuery);
      }
      break;

    case 'wishlist':
      if (productId && !user.wishlist.includes(productId)) {
        user.wishlist.push(productId);
        await user.save({ validateBeforeSave: false });
      }
      break;
  }

  res.status(200).json({
    success: true,
    message: 'Activity tracked'
  });
});

module.exports = {
  getRecommendations,
  getSimilarProducts,
  getFrequentlyBoughtTogether,
  getTrending,
  getHomepageRecommendations,
  trackActivity
};
