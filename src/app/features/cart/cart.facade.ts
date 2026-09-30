import { Injectable, inject } from '@angular/core';
import { CartService } from '../../core/services/cart.service';
import { Product } from '../../shared/models/product.model';

@Injectable({
  providedIn: 'root'
})
export class CartFacade {
  private cartService = inject(CartService);

  readonly cart = this.cartService.cart;
  readonly items = this.cartService.items;
  readonly totalItemsCount = this.cartService.totalItemsCount;
  readonly subtotal = this.cartService.subtotal;
  readonly shipping = this.cartService.shipping;
  readonly discount = this.cartService.discount;
  readonly total = this.cartService.total;
  readonly currency = this.cartService.currency;
  readonly loading = this.cartService.loading;
  readonly error = this.cartService.error;

  addToCart(product: Product, quantity = 1): void {
    this.cartService.addProduct(product, quantity);
  }

  updateQuantity(productId: string, quantity: number): void {
    this.cartService.updateQuantity(productId, quantity);
  }

  removeItem(productId: string): void {
    this.cartService.removeItem(productId);
  }

  clearCart(): void {
    this.cartService.clear();
  }

  reload(): void {
    this.cartService.loadCart();
  }
}

