const express = require('express');
const router = express.Router();
const catalogController = require('../controllers/catalog.controller');
const trackingController = require('../controllers/tracking.controller');
const analyticsConsumer = require('../consumers/analytics.consumer');

const cartController = require('../controllers/cart.controller');

// Catalog endpoints (Section 5, 6, 7, 8, 16)
router.get('/products', (req, res, next) => catalogController.getProducts(req, res, next));
router.get('/categories', (req, res, next) => catalogController.getCategories(req, res, next));
router.get('/catalog', (req, res, next) => catalogController.getCatalog(req, res, next));

// Redis Shopping Cart Endpoints
router.get('/cart/:userId?', (req, res, next) => cartController.getCart(req, res, next));
router.post('/cart/items', (req, res, next) => cartController.addItem(req, res, next));
router.put('/cart/items/:productId', (req, res, next) => cartController.updateItemQuantity(req, res, next));
router.delete('/cart/items/:productId', (req, res, next) => cartController.removeItem(req, res, next));
router.delete('/cart/:userId?', (req, res, next) => cartController.clearCart(req, res, next));

// Redis Search Index & Suggestions Endpoints
const searchController = require('../controllers/search.controller');
router.get('/search', (req, res, next) => searchController.search(req, res, next));
router.get('/search/suggestions', (req, res, next) => searchController.getSuggestions(req, res, next));

// Health check endpoint (Section 33)
router.get('/health', (req, res, next) => catalogController.getHealth(req, res, next));

// Analytics Kafka Tracking endpoint (Section 24)
router.post('/analytics/page-view', (req, res, next) => trackingController.trackPageView(req, res, next));
// Legacy/alias endpoint for backward compatibility
router.post('/analytics/track', (req, res, next) => trackingController.trackPageView(req, res, next));

// Analytics Kafka Consumer feed (to view consumed events in UI/tests)
const config = require('../config/config');
router.get('/analytics/events', (req, res) => {
  const events = analyticsConsumer.getConsumedEvents();
  const stats = analyticsConsumer.getStats();
  res.status(200).json({
    success: true,
    topic: config.kafka.topicPageViews,
    totalConsumed: events.length,
    stats,
    events
  });
});

module.exports = router;
