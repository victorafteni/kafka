const catalogService = require('../services/catalog.service');
const redisService = require('../services/redis.service');
const kafkaService = require('../services/kafka.service');

class CatalogController {
  // GET /api/catalog
  async getCatalog(req, res, next) {
    try {
      const catalog = await catalogService.getCatalog();
      res.status(200).json({
        products: catalog.products,
        categories: catalog.categories,
        _meta: catalog.meta
      });
    } catch (err) {
      next(err);
    }
  }

  // GET /api/products (Section 5, 6, 7, 8)
  async getProducts(req, res, next) {
    try {
      const products = await catalogService.getProducts();
      res.status(200).json(products);
    } catch (err) {
      next(err);
    }
  }

  // GET /api/categories (Section 5, 6, 7, 8)
  async getCategories(req, res, next) {
    try {
      const categories = await catalogService.getCategories();
      res.status(200).json(categories);
    } catch (err) {
      next(err);
    }
  }

  // GET /api/health (Section 33)
  async getHealth(req, res, next) {
    try {
      const [redisHealth, kafkaHealth] = await Promise.all([
        redisService.healthCheck(),
        kafkaService.healthCheck()
      ]);

      const isRedisOk = redisHealth.status === 'ok';
      const isKafkaOk = kafkaHealth.status === 'ok';
      const isHealthy = isRedisOk && isKafkaOk;

      res.status(isHealthy ? 200 : 200).json({
        status: isHealthy ? 'ok' : 'degraded',
        redis: isRedisOk ? 'connected' : 'unavailable',
        kafka: isKafkaOk ? 'connected' : 'unavailable',
        timestamp: new Date().toISOString()
      });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new CatalogController();
