const cartService = require('../services/cart.service');

class CartController {
  // GET /api/cart or /api/cart/:userId
  async getCart(req, res, next) {
    try {
      const userId = req.params.userId || req.query.userId || req.headers['x-user-id'] || 'usr-001';
      const cart = await cartService.getCart(userId);
      res.status(200).json(cart);
    } catch (err) {
      next(err);
    }
  }

  // POST /api/cart/items
  async addItem(req, res, next) {
    try {
      const userId = req.body.userId || req.query.userId || 'usr-001';
      const item = req.body.item || req.body;
      const cart = await cartService.addItem(userId, item);
      res.status(200).json(cart);
    } catch (err) {
      next(err);
    }
  }

  // PUT /api/cart/items/:productId
  async updateItemQuantity(req, res, next) {
    try {
      const userId = req.body.userId || req.query.userId || 'usr-001';
      const { productId } = req.params;
      const { quantity } = req.body;
      const cart = await cartService.updateItemQuantity(userId, productId, quantity);
      res.status(200).json(cart);
    } catch (err) {
      next(err);
    }
  }

  // DELETE /api/cart/items/:productId
  async removeItem(req, res, next) {
    try {
      const userId = req.query.userId || req.body.userId || 'usr-001';
      const { productId } = req.params;
      const cart = await cartService.removeItem(userId, productId);
      res.status(200).json(cart);
    } catch (err) {
      next(err);
    }
  }

  // DELETE /api/cart or /api/cart/:userId
  async clearCart(req, res, next) {
    try {
      const userId = req.params.userId || req.query.userId || 'usr-001';
      const cart = await cartService.clearCart(userId);
      res.status(200).json(cart);
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new CartController();

