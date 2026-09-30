import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { CartFacade } from './cart.facade';
import { AppButtonComponent } from '../../shared/components/app-button/app-button.component';
import { AppEmptyStateComponent } from '../../shared/components/app-empty-state/app-empty-state.component';
import { AppSpinnerComponent } from '../../shared/components/app-spinner/app-spinner.component';

@Component({
  selector: 'app-cart',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    AppButtonComponent,
    AppEmptyStateComponent,
    AppSpinnerComponent
  ],
  template: `
    <div class="cart-page">
      <div class="container">
        <div class="cart-header">
          <div>
            <h1 class="page-title">Shopping Cart</h1>
            <p class="cart-subtitle">
              Session-backed state managed via Redis key-value simulation
            </p>
          </div>
          @if (items().length > 0) {
            <app-button variant="ghost" size="sm" icon="delete_sweep" (clicked)="clearCart()">
              Clear Cart
            </app-button>
          }
        </div>

        @if (loading()) {
          <div class="loading-box">
            <app-spinner label="Synchronizing cart with Redis session store..."></app-spinner>
          </div>
        } @else if (items().length === 0) {
          <app-empty-state
            icon="shopping_cart"
            title="Your cart is empty"
            description="Explore our catalog to find enterprise computing hardware, smartphones, and accessories."
            actionLabel="Start Shopping"
            [routerLink]="['/products']">
          </app-empty-state>
        } @else {
          <div class="cart-grid">
            <div class="items-list">
              @for (item of items(); track item.productId) {
                <div class="cart-item-card">
                  <div class="item-img-wrapper" [routerLink]="['/products', item.productId]">
                    <img [src]="item.image" [alt]="item.productName" />
                  </div>

                  <div class="item-details">
                    <div class="item-meta">
                      <span class="item-brand">{{ item.brand }}</span>
                      <span class="item-sku">SKU: {{ item.productSku }}</span>
                    </div>

                    <h3 class="item-title" [routerLink]="['/products', item.productId]">
                      {{ item.productName }}
                    </h3>

                    <div class="item-pricing">
                      <span class="unit-price">
                        €{{ item.unitPrice.toFixed(2) }} each
                      </span>
                    </div>

                    <div class="item-controls">
                      <div class="qty-control">
                        <button
                          type="button"
                          class="qty-btn"
                          [disabled]="item.quantity <= 1"
                          (click)="updateQty(item.productId, item.quantity - 1)">
                          -
                        </button>
                        <span class="qty-num">{{ item.quantity }}</span>
                        <button
                          type="button"
                          class="qty-btn"
                          [disabled]="item.quantity >= item.availableStock"
                          (click)="updateQty(item.productId, item.quantity + 1)">
                          +
                        </button>
                      </div>

                      <button
                        type="button"
                        class="remove-btn"
                        (click)="removeItem(item.productId)"
                        title="Remove product">
                        <span class="material-icons-outlined">delete_outline</span>
                        <span>Remove</span>
                      </button>
                    </div>
                  </div>

                  <div class="item-total-col">
                    <span class="total-label">Total</span>
                    <span class="item-total-price">€{{ item.totalPrice.toFixed(2) }}</span>
                  </div>
                </div>
              }
            </div>

            <div class="summary-col">
              <div class="summary-card">
                <h3 class="summary-title">Order Summary</h3>

                <div class="summary-rows">
                  <div class="summary-row">
                    <span>Subtotal</span>
                    <span>€{{ subtotal().toFixed(2) }}</span>
                  </div>

                  <div class="summary-row">
                    <span>Estimated Shipping</span>
                    <span>{{ shipping() === 0 ? 'FREE' : ('€' + shipping().toFixed(2)) }}</span>
                  </div>

                  @if (discount() > 0) {
                    <div class="summary-row discount-row">
                      <span>Enterprise Discount</span>
                      <span>-€{{ discount().toFixed(2) }}</span>
                    </div>
                  }

                  <div class="summary-divider"></div>

                  <div class="summary-row total-row">
                    <span>Total</span>
                    <span class="grand-total">€{{ total().toFixed(2) }}</span>
                  </div>
                </div>

                <div class="checkout-actions">
                  <a routerLink="/checkout" class="checkout-link">
                    <app-button variant="primary" size="lg" [fullWidth]="true" icon="lock">
                      Proceed to Checkout
                    </app-button>
                  </a>
                  <a routerLink="/products" class="continue-link">
                    Continue Shopping
                  </a>
                </div>

                <div class="redis-badge-box">
                  <div class="redis-status-line">
                    <span class="material-icons-outlined">memory</span>
                    <strong>Redis Session Store Simulation</strong>
                  </div>
                  <p>
                    Cart state is updated through <code>CartService → CartRepository → MockCartRepository</code> with transactional lock and stock verification semantics.
                  </p>
                </div>
              </div>
            </div>
          </div>
        }
      </div>
    </div>
  `,
  styles: [`
    @use 'styles/variables' as *;
    @use 'styles/mixins' as *;

    .cart-page {
      padding: 32px 0 60px;
    }

    .cart-header {
      @include flex-between;
      margin-bottom: 32px;
      padding-bottom: 20px;
      border-bottom: 1px solid $gray-200;
    }

    .page-title {
      font-size: 2rem;
      font-weight: 800;
      letter-spacing: -0.02em;
      color: $gray-900;
    }

    .cart-subtitle {
      font-size: 0.875rem;
      color: $gray-500;
      margin-top: 4px;
    }

    .cart-grid {
      display: grid;
      grid-template-columns: 1fr 380px;
      gap: 36px;
      align-items: start;

      @media (max-width: $bp-lg) {
        grid-template-columns: 1fr;
      }
    }

    .items-list {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .cart-item-card {
      display: grid;
      grid-template-columns: 120px 1fr auto;
      gap: 20px;
      background: #ffffff;
      border: 1px solid $gray-200;
      border-radius: $radius-lg;
      padding: 16px;
      transition: border-color $transition-fast;

      &:hover {
        border-color: $gray-300;
      }

      @media (max-width: $bp-sm) {
        grid-template-columns: 80px 1fr;
      }
    }

    .item-img-wrapper {
      width: 120px;
      height: 100px;
      border-radius: $radius-md;
      overflow: hidden;
      background: $gray-50;
      cursor: pointer;

      img {
        width: 100%;
        height: 100%;
        object-fit: cover;
      }

      @media (max-width: $bp-sm) {
        width: 80px;
        height: 80px;
      }
    }

    .item-details {
      display: flex;
      flex-direction: column;
    }

    .item-meta {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 4px;
    }

    .item-brand {
      font-size: 0.75rem;
      font-weight: 700;
      color: $primary-600;
      text-transform: uppercase;
      letter-spacing: 0.04em;
    }

    .item-sku {
      font-size: 0.6875rem;
      color: $gray-400;
      font-family: 'JetBrains Mono', monospace;
    }

    .item-title {
      font-size: 1rem;
      font-weight: 700;
      color: $gray-900;
      margin-bottom: 6px;
      cursor: pointer;

      &:hover {
        color: $primary-600;
      }
    }

    .item-pricing {
      margin-bottom: 12px;

      .unit-price {
        font-size: 0.875rem;
        color: $gray-500;
      }
    }

    .item-controls {
      display: flex;
      align-items: center;
      gap: 16px;
      margin-top: auto;
    }

    .qty-control {
      display: inline-flex;
      align-items: center;
      border: 1px solid $gray-300;
      border-radius: $radius-md;
      overflow: hidden;
      background: #ffffff;
    }

    .qty-btn {
      width: 32px;
      height: 32px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1rem;
      background: $gray-100;
      color: $gray-700;

      &:hover:not(:disabled) {
        background: $gray-200;
      }

      &:disabled {
        opacity: 0.4;
      }
    }

    .qty-num {
      min-width: 36px;
      text-align: center;
      font-size: 0.875rem;
      font-weight: 700;
    }

    .remove-btn {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      font-size: 0.8125rem;
      color: $gray-400;
      transition: color $transition-fast;

      &:hover {
        color: $danger;
      }

      .material-icons-outlined {
        font-size: 16px;
      }
    }

    .item-total-col {
      display: flex;
      flex-direction: column;
      align-items: flex-end;
      justify-content: center;
      padding-left: 16px;

      @media (max-width: $bp-sm) {
        grid-column: 1 / -1;
        flex-direction: row;
        justify-content: space-between;
        padding-left: 0;
        padding-top: 12px;
        border-top: 1px solid $gray-100;
      }
    }

    .total-label {
      font-size: 0.75rem;
      color: $gray-400;
      text-transform: uppercase;
      font-weight: 600;
    }

    .item-total-price {
      font-size: 1.15rem;
      font-weight: 800;
      color: $gray-900;
    }

    .summary-card {
      background: #ffffff;
      border: 1px solid $gray-200;
      border-radius: $radius-lg;
      padding: 24px;
      box-shadow: $shadow-xs;
      position: sticky;
      top: 90px;
    }

    .summary-title {
      font-size: 1.25rem;
      font-weight: 800;
      color: $gray-900;
      margin-bottom: 20px;
      padding-bottom: 12px;
      border-bottom: 1px solid $gray-100;
    }

    .summary-rows {
      display: flex;
      flex-direction: column;
      gap: 12px;
      margin-bottom: 24px;
    }

    .summary-row {
      display: flex;
      justify-content: space-between;
      font-size: 0.9375rem;
      color: $gray-600;

      &.discount-row {
        color: $success;
        font-weight: 600;
      }

      &.total-row {
        font-size: 1.25rem;
        font-weight: 800;
        color: $gray-900;
      }
    }

    .summary-divider {
      height: 1px;
      background: $gray-200;
      margin: 8px 0;
    }

    .grand-total {
      color: $primary-600;
    }

    .checkout-actions {
      display: flex;
      flex-direction: column;
      gap: 12px;
      text-align: center;
    }

    .checkout-link {
      display: block;
    }

    .continue-link {
      font-size: 0.875rem;
      color: $gray-500;
      font-weight: 600;

      &:hover {
        color: $primary-600;
      }
    }

    .redis-badge-box {
      margin-top: 24px;
      padding: 12px;
      background: #f8fafc;
      border-radius: $radius-md;
      border: 1px dashed $gray-300;
      font-size: 0.75rem;
      color: $gray-600;

      .redis-status-line {
        display: flex;
        align-items: center;
        gap: 6px;
        color: $gray-800;
        margin-bottom: 6px;

        .material-icons-outlined {
          font-size: 16px;
          color: #ef4444;
        }
      }

      p {
        line-height: 1.4;
      }
    }

    .loading-box {
      padding: 60px 0;
      display: flex;
      justify-content: center;
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CartComponent {
  private cartFacade = inject(CartFacade);

  readonly items = this.cartFacade.items;
  readonly subtotal = this.cartFacade.subtotal;
  readonly shipping = this.cartFacade.shipping;
  readonly discount = this.cartFacade.discount;
  readonly total = this.cartFacade.total;
  readonly loading = this.cartFacade.loading;

  updateQty(productId: string, quantity: number): void {
    this.cartFacade.updateQuantity(productId, quantity);
  }

  removeItem(productId: string): void {
    this.cartFacade.removeItem(productId);
  }

  clearCart(): void {
    this.cartFacade.clearCart();
  }
}
