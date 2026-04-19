/**
 * ===========================================
 * RECOMMENDATION ROUTES
 * ===========================================
 */

const express = require('express');
const router = express.Router();

const {
  getRecommendations,
  getSimilarProducts,
  getFrequentlyBoughtTogether,
  getTrending,
  getHomepageRecommendations,
  trackActivity
} = require('../controllers/recommendationController');

const { protect, optionalAuth } = require('../middleware/authMiddleware');

// Public routes with optional auth for personalization
router.get('/', optionalAuth, getRecommendations);
router.get('/homepage', optionalAuth, getHomepageRecommendations);
router.get('/trending', getTrending);
router.get('/similar/:productId', getSimilarProducts);
router.get('/bought-together/:productId', getFrequentlyBoughtTogether);

// Protected route for tracking activity
router.post('/track', protect, trackActivity);

module.exports = router;
