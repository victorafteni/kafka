import { Injectable } from '@angular/core';
import { Observable, of, delay } from 'rxjs';
import { CartRepository } from './cart.repository';
import { Cart, CartItem } from '../../shared/models/cart.model';

@Injectable({
  providedIn: 'root'
})
export class MockCartRepository extends CartRepository {
  private redisStore = new Map<string, Cart>();

  constructor() {
    super();
    this.initDefaultCart('usr-001');
  }

  private initDefaultCart(userId: string) {
    const initialCart: Cart = {
      id: `cart-${userId}`,
      userId,
      items: [
        {
          productId: 'prod-101',
          productSku: 'LEN-TP-X1-G11',
          productName: 'Lenovo ThinkPad X1 Carbon Gen 11',
          image: 'https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?w=400&auto=format&fit=crop&q=80',
          brand: 'Lenovo',
          quantity: 1,
          unitPrice: 1499.00,
          totalPrice: 1499.00,
          availableStock: 14
        }
      ],
      subtotal: 1499.00,
      discount: 0,
      shipping: 20.00,
      total: 1519.00,
      currency: 'EUR',
      updatedAt: new Date().toISOString()
    };
    this.redisStore.set(userId, initialCart);
  }

  private recalculateCart(cart: Cart): Cart {
    const subtotal = cart.items.reduce((sum, item) => sum + (item.unitPrice * item.quantity), 0);
    const shipping = subtotal > 1000 || subtotal === 0 ? 0 : 20;
    const discount = subtotal > 2000 ? 100 : 0;
    const total = Math.max(0, subtotal - discount + shipping);

    cart.subtotal = Number(subtotal.toFixed(2));
    cart.shipping = shipping;
    cart.discount = discount;
    cart.total = Number(total.toFixed(2));
    cart.updatedAt = new Date().toISOString();

    return { ...cart };
  }

  override getCart(userId: string): Observable<Cart> {
    let cart = this.redisStore.get(userId);
    if (!cart) {
      cart = {
        id: `cart-${userId}`,
        userId,
        items: [],
        subtotal: 0,
        discount: 0,
        shipping: 0,
        total: 0,
        currency: 'EUR',
        updatedAt: new Date().toISOString()
      };
      this.redisStore.set(userId, cart);
    }
    return of({ ...cart }).pipe(delay(80));
  }

  override addItem(userId: string, itemInput: Omit<CartItem, 'totalPrice'>): Observable<Cart> {
    const cart = this.getOrCreateRawCart(userId);
    const existingIndex = cart.items.findIndex(i => i.productId === itemInput.productId);

    if (existingIndex > -1) {
      const existing = cart.items[existingIndex];
      const newQty = Math.min(existing.quantity + itemInput.quantity, existing.availableStock);
      cart.items[existingIndex] = {
        ...existing,
        quantity: newQty,
        totalPrice: Number((existing.unitPrice * newQty).toFixed(2))
      };
    } else {
      const quantity = Math.min(itemInput.quantity, itemInput.availableStock);
      cart.items.push({
        ...itemInput,
        quantity,
        totalPrice: Number((itemInput.unitPrice * quantity).toFixed(2))
      });
    }

    const updated = this.recalculateCart(cart);
    this.redisStore.set(userId, updated);
    return of({ ...updated }).pipe(delay(80));
  }

  override updateItemQuantity(userId: string, productId: string, quantity: number): Observable<Cart> {
    const cart = this.getOrCreateRawCart(userId);
    if (quantity <= 0) {
      return this.removeItem(userId, productId);
    }

    const item = cart.items.find(i => i.productId === productId);
    if (item) {
      item.quantity = Math.min(quantity, item.availableStock);
      item.totalPrice = Number((item.unitPrice * item.quantity).toFixed(2));
    }

    const updated = this.recalculateCart(cart);
    this.redisStore.set(userId, updated);
    return of({ ...updated }).pipe(delay(80));
  }

  override removeItem(userId: string, productId: string): Observable<Cart> {
    const cart = this.getOrCreateRawCart(userId);
    cart.items = cart.items.filter(i => i.productId !== productId);
    const updated = this.recalculateCart(cart);
    this.redisStore.set(userId, updated);
    return of({ ...updated }).pipe(delay(80));
  }

  override clearCart(userId: string): Observable<Cart> {
    const cart = this.getOrCreateRawCart(userId);
    cart.items = [];
    const updated = this.recalculateCart(cart);
    this.redisStore.set(userId, updated);
    return of({ ...updated }).pipe(delay(80));
  }

  private getOrCreateRawCart(userId: string): Cart {
    let cart = this.redisStore.get(userId);
    if (!cart) {
      cart = {
        id: `cart-${userId}`,
        userId,
        items: [],
        subtotal: 0,
        discount: 0,
        shipping: 0,
        total: 0,
        currency: 'EUR',
        updatedAt: new Date().toISOString()
      };
      this.redisStore.set(userId, cart);
    }
    return cart;
  }
}

