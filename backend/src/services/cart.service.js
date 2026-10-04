const redisService = require('./redis.service');
const config = require('../config/config');

class CartService {
  getCartKey(userId) {
    const prefix = config.redis.keys.cartPrefix || 'shop:cart:';
    return `${prefix}${userId || 'usr-001'}`;
  }

  calculateCartTotals(cart) {
    const subtotal = cart.items.reduce((sum, item) => {
      const price = Number(item.unitPrice) || 0;
      const qty = Number(item.quantity) || 1;
      return sum + (price * qty);
    }, 0);

    const shipping = subtotal > 1000 || subtotal === 0 ? 0 : 20;
    const discount = subtotal > 2000 ? 100 : 0;
    const total = Math.max(0, subtotal - discount + shipping);

    cart.subtotal = Number(subtotal.toFixed(2));
    cart.shipping = shipping;
    cart.discount = discount;
    cart.total = Number(total.toFixed(2));
    cart.updatedAt = new Date().toISOString();

    return cart;
  }

  createEmptyCart(userId) {
    return {
      id: `cart-${userId || 'usr-001'}`,
      userId: userId || 'usr-001',
      items: [],
      subtotal: 0,
      discount: 0,
      shipping: 0,
      total: 0,
      currency: 'EUR',
      updatedAt: new Date().toISOString()
    };
  }

  /**
   * Get user's cart from Redis.
   * If cart does not exist in Redis, creates an empty cart in Redis and returns it.
   */
  async getCart(userId = 'usr-001') {
    const key = this.getCartKey(userId);
    console.log(`[REDIS CART] Fetching cart for user "${userId}" from Redis key: "${key}"`);

    let cart = await redisService.getJson(key);

    if (!cart) {
      console.log(`[REDIS CART] No existing cart in Redis for user "${userId}". Initializing empty cart.`);
      cart = this.createEmptyCart(userId);
      await redisService.setJson(key, cart);
    }

    return cart;
  }

  /**
   * Add item to cart in Redis
   */
  async addItem(userId = 'usr-001', item) {
    const key = this.getCartKey(userId);
    const cart = await this.getCart(userId);

    const existingIndex = cart.items.findIndex(i => i.productId === item.productId);
    const quantityToAdd = Number(item.quantity) || 1;
    const unitPrice = Number(item.unitPrice) || 0;

    if (existingIndex > -1) {
      cart.items[existingIndex].quantity += quantityToAdd;
      cart.items[existingIndex].totalPrice = Number(
        (cart.items[existingIndex].quantity * cart.items[existingIndex].unitPrice).toFixed(2)
      );
    } else {
      cart.items.push({
        productId: item.productId,
        productSku: item.productSku || 'SKU-' + item.productId,
        productName: item.productName || item.name || 'Product',
        image: item.image || item.thumbnail || '',
        brand: item.brand || 'Generic',
        quantity: quantityToAdd,
        unitPrice: unitPrice,
        totalPrice: Number((quantityToAdd * unitPrice).toFixed(2)),
        availableStock: Number(item.availableStock ?? item.stock ?? 10)
      });
    }

    this.calculateCartTotals(cart);
    await redisService.setJson(key, cart);
    console.log(`[REDIS CART] Item "${item.productId}" added to cart in Redis. New item count: ${cart.items.length}`);
    return cart;
  }

  /**
   * Update item quantity in Redis
   */
  async updateItemQuantity(userId = 'usr-001', productId, quantity) {
    const key = this.getCartKey(userId);
    const cart = await this.getCart(userId);
    const newQty = Number(quantity);

    if (newQty <= 0) {
      cart.items = cart.items.filter(i => i.productId !== productId);
    } else {
      const item = cart.items.find(i => i.productId === productId);
      if (item) {
        item.quantity = newQty;
        item.totalPrice = Number((newQty * item.unitPrice).toFixed(2));
      }
    }

    this.calculateCartTotals(cart);
    await redisService.setJson(key, cart);
    console.log(`[REDIS CART] Updated quantity for "${productId}" in Redis. Total items: ${cart.items.length}`);
    return cart;
  }

  /**
   * Remove item from cart in Redis
   */
  async removeItem(userId = 'usr-001', productId) {
    const key = this.getCartKey(userId);
    const cart = await this.getCart(userId);

    cart.items = cart.items.filter(i => i.productId !== productId);
    this.calculateCartTotals(cart);

    await redisService.setJson(key, cart);
    console.log(`[REDIS CART] Removed product "${productId}" from Redis cart.`);
    return cart;
  }

  /**
   * Clear all items in cart in Redis
   */
  async clearCart(userId = 'usr-001') {
    const key = this.getCartKey(userId);
    const emptyCart = this.createEmptyCart(userId);

    await redisService.setJson(key, emptyCart);
    console.log(`[REDIS CART] Cleared cart for user "${userId}" in Redis.`);
    return emptyCart;
  }
}

module.exports = new CartService();

