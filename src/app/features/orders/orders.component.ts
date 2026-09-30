import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { OrderService } from '../../core/services/order.service';
import { AppBadgeComponent } from '../../shared/components/app-badge/app-badge.component';
import { AppEmptyStateComponent } from '../../shared/components/app-empty-state/app-empty-state.component';

@Component({
  selector: 'app-orders',
  standalone: true,
  imports: [CommonModule, RouterModule, AppBadgeComponent, AppEmptyStateComponent],
  template: `
    <div class="orders-page">
      <div class="container">
        <div class="orders-header">
          <h1 class="page-title">My Orders</h1>
          <p class="subtitle">History of dispatched orders and real-time Kafka event traces</p>
        </div>

        @if (orders().length === 0) {
          <app-empty-state
            icon="receipt_long"
            title="No orders placed yet"
            description="When you purchase items from Commerce Hub, your order details and delivery status will appear here."
            actionLabel="Start Shopping"
            [routerLink]="['/products']">
          </app-empty-state>
        } @else {
          <div class="orders-list">
            @for (order of orders(); track order.id) {
              <div class="order-card">
                <div class="order-card-header">
                  <div class="header-left">
                    <span class="order-num">{{ order.orderNumber }}</span>
                    <span class="order-date">Placed on {{ order.createdAt | date:'mediumDate' }}</span>
                  </div>

                  <div class="header-right">
                    <app-badge
                      [variant]="order.status === 'delivered' ? 'success' : (order.status === 'shipped' ? 'primary' : 'warning')"
                      [dot]="true">
                      {{ order.status }}
                    </app-badge>
                    <span class="order-total-header">€{{ order.total.toFixed(2) }}</span>
                  </div>
                </div>

                <div class="order-card-body">
                  <div class="order-items-col">
                    @for (item of order.items; track item.productId) {
                      <div class="order-item-row">
                        <img [src]="item.image" [alt]="item.productName" class="item-img" />
                        <div class="item-meta">
                          <h4 class="item-name">{{ item.productName }}</h4>
                          <span class="item-qty-price">Qty: {{ item.quantity }} × €{{ item.unitPrice.toFixed(2) }}</span>
                        </div>
                        <span class="item-row-total">€{{ item.totalPrice.toFixed(2) }}</span>
                      </div>
                    }
                  </div>

                  <div class="order-meta-col">
                    <div class="meta-block">
                      <span class="meta-label">Shipping Destination</span>
                      <p class="meta-val">{{ order.shippingAddress.fullName }}</p>
                      <p class="meta-sub">{{ order.shippingAddress.street }}, {{ order.shippingAddress.city }}</p>
                    </div>

                    <div class="meta-block">
                      <span class="meta-label">Estimated Delivery</span>
                      <p class="meta-val">{{ order.estimatedDelivery | date:'fullDate' }}</p>
                    </div>

                    <div class="meta-block">
                      <span class="meta-label">Payment</span>
                      <p class="meta-val">Card ending in {{ order.paymentMethod.lastFourDigits || '4242' }}</p>
                    </div>
                  </div>
                </div>
              </div>
            }
          </div>
        }
      </div>
    </div>
  `,
  styles: [`
    @use 'styles/variables' as *;
    @use 'styles/mixins' as *;

    .orders-page {
      padding: 32px 0 60px;
    }

    .orders-header {
      margin-bottom: 32px;
      padding-bottom: 20px;
      border-bottom: 1px solid $gray-200;
    }

    .page-title {
      font-size: 2rem;
      font-weight: 800;
      color: $gray-900;
    }

    .subtitle {
      font-size: 0.875rem;
      color: $gray-500;
      margin-top: 4px;
    }

    .orders-list {
      display: flex;
      flex-direction: column;
      gap: 24px;
    }

    .order-card {
      background: #ffffff;
      border: 1px solid $gray-200;
      border-radius: $radius-lg;
      overflow: hidden;
      box-shadow: $shadow-xs;
    }

    .order-card-header {
      @include flex-between;
      padding: 16px 24px;
      background: $gray-50;
      border-bottom: 1px solid $gray-200;

      @media (max-width: $bp-sm) {
        flex-direction: column;
        align-items: flex-start;
        gap: 12px;
      }
    }

    .header-left {
      display: flex;
      align-items: baseline;
      gap: 12px;
    }

    .order-num {
      font-size: 1.05rem;
      font-weight: 800;
      color: $gray-900;
      font-family: 'JetBrains Mono', monospace;
    }

    .order-date {
      font-size: 0.8125rem;
      color: $gray-500;
    }

    .header-right {
      display: flex;
      align-items: center;
      gap: 16px;
    }

    .order-total-header {
      font-size: 1.15rem;
      font-weight: 800;
      color: $gray-900;
    }

    .order-card-body {
      display: grid;
      grid-template-columns: 1.5fr 1fr;
      gap: 32px;
      padding: 24px;

      @media (max-width: $bp-md) {
        grid-template-columns: 1fr;
      }
    }

    .order-items-col {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .order-item-row {
      display: flex;
      align-items: center;
      gap: 16px;
    }

    .item-img {
      width: 56px;
      height: 56px;
      border-radius: $radius-md;
      object-fit: cover;
      background: $gray-100;
    }

    .item-meta {
      flex: 1;
      display: flex;
      flex-direction: column;
    }

    .item-name {
      font-size: 0.9375rem;
      font-weight: 600;
      color: $gray-900;
    }

    .item-qty-price {
      font-size: 0.8125rem;
      color: $gray-500;
    }

    .item-row-total {
      font-size: 0.9375rem;
      font-weight: 700;
      color: $gray-800;
    }

    .order-meta-col {
      display: flex;
      flex-direction: column;
      gap: 16px;
      padding-left: 24px;
      border-left: 1px solid $gray-100;

      @media (max-width: $bp-md) {
        padding-left: 0;
        border-left: none;
        border-top: 1px solid $gray-100;
        padding-top: 16px;
      }
    }

    .meta-block {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }

    .meta-label {
      font-size: 0.6875rem;
      text-transform: uppercase;
      font-weight: 700;
      letter-spacing: 0.05em;
      color: $gray-400;
    }

    .meta-val {
      font-size: 0.875rem;
      font-weight: 600;
      color: $gray-800;
    }

    .meta-sub {
      font-size: 0.8125rem;
      color: $gray-500;
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class OrdersComponent {
  private orderService = inject(OrderService);
  readonly orders = this.orderService.orders;
}
