import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, delay, tap, catchError } from 'rxjs';
import { CartRepository } from './cart.repository';
import { Cart, CartItem } from '../../shared/models/cart.model';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class MockCartRepository extends CartRepository {
  private http = inject(HttpClient, { optional: true });
  private redisStore = new Map<string, Cart>();

  constructor() {
    super();
    this.initDefaultCart('usr-001');
  }

  /**
   * Inițializare coș gol la pornirea aplicației
   */
  private initDefaultCart(userId: string): void {
    const emptyCart: Cart = {
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
    this.redisStore.set(userId, emptyCart);
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
    if (this.http) {
      return this.http.get<Cart>(`${environment.apiUrl}/cart/${userId}`).pipe(
        tap(cart => {
          this.redisStore.set(userId, cart);
          console.log(`[REDIS CART SYNC] Cart fetched from Redis:`, cart);
        }),
        catchError(err => {
          console.warn(`[REDIS CART] Backend/Redis error (${err.message}). Using local cache.`);
          return of(this.getOrCreateRawCart(userId));
        })
      );
    }
    return of(this.getOrCreateRawCart(userId)).pipe(delay(40));
  }

  override addItem(userId: string, itemInput: Omit<CartItem, 'totalPrice'>): Observable<Cart> {
    if (this.http) {
      return this.http.post<Cart>(`${environment.apiUrl}/cart/items`, { userId, item: itemInput }).pipe(
        tap(cart => {
          this.redisStore.set(userId, cart);
          console.log(`[REDIS CART SYNC] Item added and saved to Redis:`, cart);
        }),
        catchError(err => {
          console.warn(`[REDIS CART] Backend/Redis add failed (${err.message}). Using local fallback.`);
          return of(this.addItemLocal(userId, itemInput));
        })
      );
    }
    return of(this.addItemLocal(userId, itemInput)).pipe(delay(40));
  }

  override updateItemQuantity(userId: string, productId: string, quantity: number): Observable<Cart> {
    if (this.http) {
      return this.http.put<Cart>(`${environment.apiUrl}/cart/items/${productId}`, { userId, quantity }).pipe(
        tap(cart => {
          this.redisStore.set(userId, cart);
          console.log(`[REDIS CART SYNC] Quantity updated in Redis:`, cart);
        }),
        catchError(err => {
          console.warn(`[REDIS CART] Backend/Redis update failed (${err.message}). Using local fallback.`);
          return of(this.updateItemQuantityLocal(userId, productId, quantity));
        })
      );
    }
    return of(this.updateItemQuantityLocal(userId, productId, quantity)).pipe(delay(40));
  }

  override removeItem(userId: string, productId: string): Observable<Cart> {
    if (this.http) {
      return this.http.delete<Cart>(`${environment.apiUrl}/cart/items/${productId}?userId=${userId}`).pipe(
        tap(cart => {
          this.redisStore.set(userId, cart);
          console.log(`[REDIS CART SYNC] Item removed from Redis:`, cart);
        }),
        catchError(err => {
          console.warn(`[REDIS CART] Backend/Redis remove failed (${err.message}). Using local fallback.`);
          return of(this.removeItemLocal(userId, productId));
        })
      );
    }
    return of(this.removeItemLocal(userId, productId)).pipe(delay(40));
  }

  override clearCart(userId: string): Observable<Cart> {
    if (this.http) {
      return this.http.delete<Cart>(`${environment.apiUrl}/cart/${userId}`).pipe(
        tap(cart => {
          this.redisStore.set(userId, cart);
          console.log(`[REDIS CART SYNC] Cart cleared in Redis.`);
        }),
        catchError(err => {
          console.warn(`[REDIS CART] Backend/Redis clear failed (${err.message}). Using local fallback.`);
          return of(this.clearCartLocal(userId));
        })
      );
    }
    return of(this.clearCartLocal(userId)).pipe(delay(40));
  }

  // Local fallback implementations (used when backend is offline or during testing)
  private addItemLocal(userId: string, itemInput: Omit<CartItem, 'totalPrice'>): Cart {
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
    return updated;
  }

  private updateItemQuantityLocal(userId: string, productId: string, quantity: number): Cart {
    const cart = this.getOrCreateRawCart(userId);
    if (quantity <= 0) {
      return this.removeItemLocal(userId, productId);
    }

    const item = cart.items.find(i => i.productId === productId);
    if (item) {
      item.quantity = Math.min(quantity, item.availableStock);
      item.totalPrice = Number((item.unitPrice * item.quantity).toFixed(2));
    }

    const updated = this.recalculateCart(cart);
    this.redisStore.set(userId, updated);
    return updated;
  }

  private removeItemLocal(userId: string, productId: string): Cart {
    const cart = this.getOrCreateRawCart(userId);
    cart.items = cart.items.filter(i => i.productId !== productId);
    const updated = this.recalculateCart(cart);
    this.redisStore.set(userId, updated);
    return updated;
  }

  private clearCartLocal(userId: string): Cart {
    const cart = this.getOrCreateRawCart(userId);
    cart.items = [];
    const updated = this.recalculateCart(cart);
    this.redisStore.set(userId, updated);
    return updated;
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

