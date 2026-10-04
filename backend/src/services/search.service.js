const redisService = require('./redis.service');
const config = require('../config/config');

class SearchService {
  constructor() {
    this.indexKey = config.redis.keys.searchIndex || 'shop:catalog:search_index';
  }

  /**
   * Builds search index documents from products and categories and stores the collection in REDIS
   */
  async buildAndSaveIndex(products = [], categories = []) {
    const indexedCategories = categories.map(cat => ({
      id: cat.id,
      type: 'category',
      name: cat.name,
      slug: cat.slug || '',
      url: `/products?category=${cat.id}`,
      productCount: cat.productCount || 0,
      searchTokens: `${cat.name} ${cat.slug || ''} ${cat.id}`.toLowerCase()
    }));

    const indexedProducts = products.map(prod => ({
      id: prod.id,
      type: 'product',
      name: prod.name,
      sku: prod.sku || '',
      brand: prod.brand || '',
      price: prod.price || 0,
      currency: prod.currency || 'EUR',
      rating: prod.rating || 5,
      reviewCount: prod.reviewCount || 0,
      stock: prod.stock || 10,
      image: prod.thumbnail || (prod.images && prod.images[0]) || '',
      categoryId: prod.categoryId,
      categoryName: prod.categoryName || '',
      description: prod.description || '',
      url: `/products/${prod.id}`,
      searchTokens: `${prod.name} ${prod.brand || ''} ${prod.categoryName || ''} ${prod.description || ''} ${prod.sku || ''}`.toLowerCase()
    }));

    const indexPayload = {
      categories: indexedCategories,
      products: indexedProducts,
      totalIndexed: indexedCategories.length + indexedProducts.length,
      updatedAt: new Date().toISOString()
    };

    await redisService.setJson(this.indexKey, indexPayload);
    console.log(
      `[REDIS SEARCH INDEX] Successfully indexed & saved in Redis "${this.indexKey}": ` +
      `${indexedCategories.length} categories, ${indexedProducts.length} products.`
    );

    return indexPayload;
  }

  /**
   * Retrieves the search index collection directly from REDIS.
   * If missing in Redis, triggers initialization using the catalog.
   */
  async getIndexFromRedis() {
    let index = await redisService.getJson(this.indexKey);

    if (!index || !index.products || index.products.length === 0) {
      console.log(`[REDIS SEARCH INDEX] Index not found in Redis key "${this.indexKey}". Rebuilding index...`);
      const catalogService = require('./catalog.service');
      const products = await catalogService.getProducts();
      const categories = await catalogService.getCategories();
      index = await this.buildAndSaveIndex(products, categories);
    }

    return index;
  }

  /**
   * Search suggestions for the search box input (returns matching categories and products from Redis)
   */
  async getSuggestions(query) {
    const q = (query || '').trim().toLowerCase();
    if (!q || q.length < 2) {
      return { query: q, categories: [], products: [], suggestions: [] };
    }

    const index = await this.getIndexFromRedis();

    // 1. Match categories from Redis collection
    const matchedCategories = (index.categories || [])
      .filter(cat => cat.searchTokens.includes(q) || cat.name.toLowerCase().includes(q))
      .slice(0, 3)
      .map(cat => ({
        id: cat.id,
        query: cat.name,
        highlighted: cat.name,
        type: 'category',
        targetUrl: cat.url,
        productCount: cat.productCount
      }));

    // 2. Match products from Redis collection
    const matchedProducts = (index.products || [])
      .filter(prod => prod.searchTokens.includes(q) || prod.name.toLowerCase().includes(q) || prod.brand.toLowerCase().includes(q))
      .slice(0, 5)
      .map(prod => ({
        id: prod.id,
        query: prod.name,
        highlighted: prod.name,
        type: 'product',
        category: prod.categoryName,
        brand: prod.brand,
        price: prod.price,
        targetUrl: prod.url,
        image: prod.image
      }));

    // 3. Consolidated suggestions array for UI display
    const suggestions = [...matchedCategories, ...matchedProducts];

    return {
      query: q,
      categories: matchedCategories,
      products: matchedProducts,
      suggestions
    };
  }

  /**
   * Full search against the Redis search index collection
   */
  async search(query, activeFacets = {}) {
    const startTime = Date.now();
    const cleanQuery = (query || '').trim().toLowerCase();
    const index = await this.getIndexFromRedis();

    let hits = (index.products || []).filter(prod => {
      if (!cleanQuery) return true;
      return prod.searchTokens.includes(cleanQuery);
    });

    // Apply facet filters
    if (activeFacets.brand && activeFacets.brand.length > 0) {
      const allowedBrands = Array.isArray(activeFacets.brand) ? activeFacets.brand : [activeFacets.brand];
      hits = hits.filter(p => allowedBrands.includes(p.brand));
    }

    if (activeFacets.category && activeFacets.category.length > 0) {
      const allowedCats = Array.isArray(activeFacets.category) ? activeFacets.category : [activeFacets.category];
      hits = hits.filter(p => allowedCats.includes(p.categoryId));
    }

    // Build facets from all indexed products
    const brandCounts = new Map();
    const categoryCounts = new Map();
    (index.products || []).forEach(p => {
      brandCounts.set(p.brand, (brandCounts.get(p.brand) || 0) + 1);
      categoryCounts.set(p.categoryName, (categoryCounts.get(p.categoryName) || 0) + 1);
    });

    const facets = [
      {
        id: 'category',
        name: 'Categories',
        type: 'checkbox',
        values: Array.from(categoryCounts.entries()).map(([label, count]) => ({
          label,
          value: (index.categories || []).find(c => c.name === label)?.id || label.toLowerCase(),
          count
        }))
      },
      {
        id: 'brand',
        name: 'Brand',
        type: 'checkbox',
        values: Array.from(brandCounts.entries()).map(([brand, count]) => ({
          label: brand,
          value: brand,
          count
        }))
      }
    ];

    const processingTimeMs = Date.now() - startTime;

    return {
      hits,
      totalHits: hits.length,
      facets,
      processingTimeMs,
      query: cleanQuery
    };
  }
}

module.exports = new SearchService();
