import { Injectable, inject, signal, computed } from '@angular/core';
import { CartRepository } from '../repositories/cart.repository';
import { EventBusService } from '../event-bus/event-bus.service';
import { TelemetryService } from './telemetry.service';
import { Cart, CartItem } from '../../shared/models/cart.model';
import { Product } from '../../shared/models/product.model';

export interface CartState {
  cart: Cart | null;
  loading: boolean;
  error: string | null;
}

@Injectable({
  providedIn: 'root'
})
export class CartService {
  private cartRepo = inject(CartRepository);
  private eventBus = inject(EventBusService);
  private telemetry = inject(TelemetryService);

  private readonly userId = 'usr-001';

  private state = signal<CartState>({
    cart: null,
    loading: false,
    error: null
  });

  readonly cart = computed(() => this.state().cart);
  readonly items = computed(() => this.state().cart?.items || []);
  readonly totalItemsCount = computed(() => {
    return (this.state().cart?.items || []).reduce((acc, item) => acc + item.quantity, 0);
  });
  readonly subtotal = computed(() => this.state().cart?.subtotal || 0);
  readonly shipping = computed(() => this.state().cart?.shipping || 0);
  readonly discount = computed(() => this.state().cart?.discount || 0);
  readonly total = computed(() => this.state().cart?.total || 0);
  readonly currency = computed(() => this.state().cart?.currency || 'EUR');
  readonly loading = computed(() => this.state().loading);
  readonly error = computed(() => this.state().error);

  constructor() {
    this.loadCart();
  }

  loadCart(): void {
    this.state.update(s => ({ ...s, loading: true, error: null }));

    this.cartRepo.getCart(this.userId).subscribe({
      next: cart => {
        this.state.set({ cart, loading: false, error: null });
      },
      error: err => {
        this.state.update(s => ({ ...s, loading: false, error: err.message }));
      }
    });
  }

  addProduct(product: Product, quantity = 1): void {
    this.state.update(s => ({ ...s, loading: true, error: null }));

    const item: Omit<CartItem, 'totalPrice'> = {
      productId: product.id,
      productSku: product.sku,
      productName: product.name,
      image: product.thumbnail,
      brand: product.brand,
      quantity,
      unitPrice: product.price,
      availableStock: product.stock
    };

    this.cartRepo.addItem(this.userId, item).subscribe({
      next: updatedCart => {
        this.state.set({ cart: updatedCart, loading: false, error: null });
        this.telemetry.recordCartEvent();

        this.eventBus.emit('CART_ITEM_ADDED', {
          cartId: updatedCart.id,
          productId: product.id,
          productName: product.name,
          quantity,
          unitPrice: product.price,
          userId: this.userId
        }, this.userId);
      },
      error: err => {
        this.state.update(s => ({ ...s, loading: false, error: err.message }));
      }
    });
  }

  updateQuantity(productId: string, quantity: number): void {
    this.state.update(s => ({ ...s, loading: true, error: null }));

    this.cartRepo.updateItemQuantity(this.userId, productId, quantity).subscribe({
      next: updatedCart => {
        this.state.set({ cart: updatedCart, loading: false, error: null });
        this.telemetry.recordCartEvent();

        this.eventBus.emit('CART_UPDATED', {
          cartId: updatedCart.id,
          productId,
          newQuantity: quantity,
          userId: this.userId
        }, this.userId);
      },
      error: err => {
        this.state.update(s => ({ ...s, loading: false, error: err.message }));
      }
    });
  }

  removeItem(productId: string): void {
    this.state.update(s => ({ ...s, loading: true, error: null }));

    this.cartRepo.removeItem(this.userId, productId).subscribe({
      next: updatedCart => {
        this.state.set({ cart: updatedCart, loading: false, error: null });
        this.telemetry.recordCartEvent();

        this.eventBus.emit('CART_ITEM_REMOVED', {
          cartId: updatedCart.id,
          productId,
          userId: this.userId
        }, this.userId);
      },
      error: err => {
        this.state.update(s => ({ ...s, loading: false, error: err.message }));
      }
    });
  }

  clear(): void {
    this.state.update(s => ({ ...s, loading: true, error: null }));

    this.cartRepo.clearCart(this.userId).subscribe({
      next: updatedCart => {
        this.state.set({ cart: updatedCart, loading: false, error: null });
        this.telemetry.recordCartEvent();
      },
      error: err => {
        this.state.update(s => ({ ...s, loading: false, error: err.message }));
      }
    });
  }
}

