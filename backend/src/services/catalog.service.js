const fs = require('fs').promises;
const config = require('../config/config');
const redisService = require('./redis.service');

class CatalogService {
  constructor() {
    this.productsKey = config.redis.keys.products;
    this.categoriesKey = config.redis.keys.categories;
    this.productsPath = config.seedData.productsPath;
    this.categoriesPath = config.seedData.categoriesPath;
  }

  // 1. Read seed file from filesystem
  async readSeedJson(filePath) {
    try {
      const data = await fs.readFile(filePath, 'utf-8');
      return JSON.parse(data);
    } catch (err) {
      console.error(`[CATALOG] Failed to read seed JSON from "${filePath}":`, err.message);
      throw new Error(`Seed data file unavailable: ${filePath}`);
    }
  }

  // 2. Products initialization & retrieval
  async initializeProductsIfMissing() {
    try {
      const exists = await redisService.exists(this.productsKey);
      if (exists) {
        console.log(`[CATALOG] Redis key "${this.productsKey}" already exists. Reading from Redis cache.`);
        const products = await redisService.getJson(this.productsKey);
        if (products && Array.isArray(products) && products.length > 0) {
          return { data: products, source: 'redis' };
        }
      }

      console.log(`[CATALOG] Redis key "${this.productsKey}" NOT FOUND or empty. Seeding from JSON: ${this.productsPath}`);
      const seedProducts = await this.readSeedJson(this.productsPath);
      await redisService.setJson(this.productsKey, seedProducts);
      console.log(`[CATALOG] Successfully seeded ${seedProducts.length} products into Redis key "${this.productsKey}".`);
      return { data: seedProducts, source: 'seed_json' };
    } catch (err) {
      console.warn(`[CATALOG] Redis error during products lookup, falling back to seed JSON:`, err.message);
      const fallbackProducts = await this.readSeedJson(this.productsPath);
      return { data: fallbackProducts, source: 'fallback_json', error: err.message };
    }
  }

  // 3. Categories initialization & retrieval
  async initializeCategoriesIfMissing() {
    try {
      const exists = await redisService.exists(this.categoriesKey);
      if (exists) {
        console.log(`[CATALOG] Redis key "${this.categoriesKey}" already exists. Reading from Redis cache.`);
        const categories = await redisService.getJson(this.categoriesKey);
        if (categories && Array.isArray(categories) && categories.length > 0) {
          return { data: categories, source: 'redis' };
        }
      }

      console.log(`[CATALOG] Redis key "${this.categoriesKey}" NOT FOUND or empty. Seeding from JSON: ${this.categoriesPath}`);
      const seedCategories = await this.readSeedJson(this.categoriesPath);
      await redisService.setJson(this.categoriesKey, seedCategories);
      console.log(`[CATALOG] Successfully seeded ${seedCategories.length} categories into Redis key "${this.categoriesKey}".`);
      return { data: seedCategories, source: 'seed_json' };
    } catch (err) {
      console.warn(`[CATALOG] Redis error during categories lookup, falling back to seed JSON:`, err.message);
      const fallbackCategories = await this.readSeedJson(this.categoriesPath);
      return { data: fallbackCategories, source: 'fallback_json', error: err.message };
    }
  }

  // 4. Full catalog retrieval with independent partial handling
  async getCatalog() {
    // Both products and categories are treated completely independently
    const [productsResult, categoriesResult] = await Promise.all([
      this.initializeProductsIfMissing(),
      this.initializeCategoriesIfMissing()
    ]);

    return {
      products: productsResult.data || [],
      categories: categoriesResult.data || [],
      meta: {
        productsSource: productsResult.source,
        categoriesSource: categoriesResult.source,
        retrievedAt: new Date().toISOString()
      }
    };
  }

  async getProducts() {
    const result = await this.initializeProductsIfMissing();
    return result.data || [];
  }

  async getCategories() {
    const result = await this.initializeCategoriesIfMissing();
    return result.data || [];
  }

  // 5. Explicit startup seeding method
  async initializeCatalogIfMissing() {
    console.log('[CATALOG] Checking catalog initialization state in Redis...');
    const catalog = await this.getCatalog();
    console.log(
      `[CATALOG] Catalog ready: ${catalog.products.length} products (${catalog.meta.productsSource}), ` +
      `${catalog.categories.length} categories (${catalog.meta.categoriesSource}).`
    );
    return catalog;
  }
}

// Singleton instance
module.exports = new CatalogService();
