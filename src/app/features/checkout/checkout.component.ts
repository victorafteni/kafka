import { Component, ChangeDetectionStrategy, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { CartFacade } from '../cart/cart.facade';
import { OrderService } from '../../core/services/order.service';
import { EventBusService } from '../../core/event-bus/event-bus.service';
import { AppButtonComponent } from '../../shared/components/app-button/app-button.component';
import { TranslatePipe } from '../../core/i18n/translate.pipe';

@Component({
  selector: 'app-checkout',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule, AppButtonComponent, TranslatePipe],
  template: `
    <div class="checkout-page">
      <div class="container">
        <h1 class="page-title">{{ 'CHECKOUT.TITLE' | translate }}</h1>
        <p class="subtitle">{{ 'CHECKOUT.SHIPPING_INFO' | translate }}</p>

        @if (items().length === 0) {
          <div class="empty-checkout">
            <p>{{ 'CART.EMPTY_DESC' | translate }}</p>
            <a routerLink="/products">
              <app-button variant="primary">{{ 'CART.START_SHOPPING' | translate }}</app-button>
            </a>
          </div>
        } @else {
          <form [formGroup]="checkoutForm" (ngSubmit)="onSubmit()" class="checkout-grid">
            <div class="form-col">
              <div class="form-section">
                <h3 class="section-title">
                  <span class="material-icons-outlined">local_shipping</span>
                  {{ 'CHECKOUT.SHIPPING_INFO' | translate }}
                </h3>

                <div class="form-row">
                  <div class="form-group full-width">
                    <label for="fullName">{{ 'CHECKOUT.FULL_NAME' | translate }}</label>
                    <input id="fullName" type="text" formControlName="fullName" placeholder="Alex Ionescu" />
                  </div>
                </div>

                <div class="form-row">
                  <div class="form-group full-width">
                    <label for="street">{{ 'CHECKOUT.ADDRESS' | translate }}</label>
                    <input id="street" type="text" formControlName="street" placeholder="Bd. Dimitrie Pompeiu 10A" />
                  </div>
                </div>

                <div class="form-row two-cols">
                  <div class="form-group">
                    <label for="city">{{ 'CHECKOUT.CITY' | translate }}</label>
                    <input id="city" type="text" formControlName="city" placeholder="București" />
                  </div>
                  <div class="form-group">
                    <label for="postalCode">{{ 'CHECKOUT.POSTAL_CODE' | translate }}</label>
                    <input id="postalCode" type="text" formControlName="postalCode" placeholder="020337" />
                  </div>
                </div>

                <div class="form-row two-cols">
                  <div class="form-group">
                    <label for="country">Țară / Country</label>
                    <select id="country" formControlName="country">
                      <option value="Romania">România</option>
                      <option value="Germany">Germania</option>
                      <option value="France">Franța</option>
                      <option value="United Kingdom">Marea Britanie</option>
                    </select>
                  </div>
                  <div class="form-group">
                    <label for="phone">{{ 'CHECKOUT.PHONE' | translate }}</label>
                    <input id="phone" type="tel" formControlName="phone" placeholder="+40 722 000 111" />
                  </div>
                </div>
              </div>

              <div class="form-section">
                <h3 class="section-title">
                  <span class="material-icons-outlined">payment</span>
                  {{ 'CHECKOUT.PAYMENT_METHOD' | translate }}
                </h3>

                <div class="payment-options">
                  <label class="pay-option">
                    <input type="radio" formControlName="paymentMethod" value="card" />
                    <span class="material-icons-outlined">credit_card</span>
                    <span>{{ 'CHECKOUT.CARD' | translate }}</span>
                  </label>
                  <label class="pay-option">
                    <input type="radio" formControlName="paymentMethod" value="cash-on-delivery" />
                    <span class="material-icons-outlined">local_atm</span>
                    <span>{{ 'CHECKOUT.CASH_ON_DELIVERY' | translate }}</span>
                  </label>
                </div>
              </div>
            </div>

            <div class="review-col">
              <div class="review-card">
                <h3 class="review-title">{{ 'CHECKOUT.ORDER_SUMMARY' | translate }} ({{ items().length }} {{ 'COMMON.ITEMS' | translate }})</h3>

                <div class="review-items">
                  @for (item of items(); track item.productId) {
                    <div class="review-item">
                      <img [src]="item.image" [alt]="item.productName" class="item-thumb" />
                      <div class="item-info">
                        <span class="item-name">{{ item.productName }}</span>
                        <span class="item-qty">{{ 'PRODUCT.QUANTITY' | translate }}: {{ item.quantity }}</span>
                      </div>
                      <span class="item-price">€{{ item.totalPrice.toFixed(2) }}</span>
                    </div>
                  }
                </div>

                <div class="totals-breakdown">
                  <div class="total-line">
                    <span>{{ 'CART.SUBTOTAL' | translate }}</span>
                    <span>€{{ subtotal().toFixed(2) }}</span>
                  </div>
                  <div class="total-line">
                    <span>{{ 'CART.SHIPPING' | translate }}</span>
                    <span>{{ shipping() === 0 ? ('CART.SHIPPING_FREE' | translate) : ('€' + shipping().toFixed(2)) }}</span>
                  </div>
                  @if (discount() > 0) {
                    <div class="total-line discount">
                      <span>{{ 'CART.DISCOUNT' | translate }}</span>
                      <span>-€{{ discount().toFixed(2) }}</span>
                    </div>
                  }
                  <div class="divider"></div>
                  <div class="total-line grand">
                    <span>{{ 'CART.TOTAL' | translate }}</span>
                    <span>€{{ total().toFixed(2) }}</span>
                  </div>
                </div>

                <app-button
                  type="submit"
                  variant="primary"
                  size="lg"
                  [fullWidth]="true"
                  [loading]="submitting()"
                  [disabled]="checkoutForm.invalid">
                  {{ 'CHECKOUT.PLACE_ORDER' | translate }}
                </app-button>
              </div>
            </div>
          </form>
        }
      </div>
    </div>
  `,
  styles: [`
    @use 'styles/variables' as *;
    @use 'styles/mixins' as *;

    .checkout-page {
      padding: 32px 0 60px;
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
      margin-bottom: 32px;
    }

    .checkout-grid {
      display: grid;
      grid-template-columns: 1fr 380px;
      gap: 36px;
      align-items: start;

      @media (max-width: $bp-lg) {
        grid-template-columns: 1fr;
      }
    }

    .form-col {
      display: flex;
      flex-direction: column;
      gap: 28px;
    }

    .form-section {
      background: #ffffff;
      border: 1px solid $gray-200;
      border-radius: $radius-lg;
      padding: 24px;
    }

    .section-title {
      font-size: 1.15rem;
      font-weight: 700;
      color: $gray-900;
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 20px;
      padding-bottom: 12px;
      border-bottom: 1px solid $gray-100;

      .material-icons-outlined {
        color: $primary-600;
      }
    }

    .form-row {
      display: flex;
      gap: 16px;
      margin-bottom: 16px;

      &.two-cols {
        @media (max-width: $bp-sm) {
          flex-direction: column;
        }
      }
    }

    .form-group {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 6px;

      label {
        font-size: 0.8125rem;
        font-weight: 600;
        color: $gray-700;
      }

      input, select {
        padding: 10px 14px;
        border: 1px solid $gray-300;
        border-radius: $radius-md;
        font-size: 0.875rem;
        outline: none;
        transition: border-color $transition-fast;

        &:focus {
          border-color: $primary-500;
          box-shadow: 0 0 0 3px $primary-100;
        }
      }
    }

    .payment-options {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .pay-option {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 12px 16px;
      border: 1px solid $gray-200;
      border-radius: $radius-md;
      cursor: pointer;
      font-size: 0.875rem;
      font-weight: 500;

      input {
        accent-color: $primary-600;
      }

      .material-icons-outlined {
        color: $gray-500;
      }

      &:hover {
        background: $gray-50;
      }
    }

    .review-card {
      background: #ffffff;
      border: 1px solid $gray-200;
      border-radius: $radius-lg;
      padding: 24px;
      position: sticky;
      top: 90px;
    }

    .review-title {
      font-size: 1.15rem;
      font-weight: 700;
      margin-bottom: 16px;
      padding-bottom: 12px;
      border-bottom: 1px solid $gray-100;
    }

    .review-items {
      display: flex;
      flex-direction: column;
      gap: 12px;
      max-height: 240px;
      overflow-y: auto;
      margin-bottom: 20px;
    }

    .review-item {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .item-thumb {
      width: 48px;
      height: 48px;
      border-radius: $radius-sm;
      object-fit: cover;
    }

    .item-info {
      flex: 1;
      display: flex;
      flex-direction: column;
    }

    .item-name {
      font-size: 0.8125rem;
      font-weight: 600;
      color: $gray-800;
    }

    .item-qty {
      font-size: 0.75rem;
      color: $gray-400;
    }

    .item-price {
      font-size: 0.875rem;
      font-weight: 700;
      color: $gray-900;
    }

    .totals-breakdown {
      display: flex;
      flex-direction: column;
      gap: 10px;
      margin-bottom: 24px;
    }

    .total-line {
      display: flex;
      justify-content: space-between;
      font-size: 0.875rem;
      color: $gray-600;

      &.discount {
        color: $success;
        font-weight: 600;
      }

      &.grand {
        font-size: 1.2rem;
        font-weight: 800;
        color: $gray-900;
      }
    }

    .divider {
      height: 1px;
      background: $gray-200;
      margin: 6px 0;
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CheckoutComponent implements OnInit {
  private fb = inject(FormBuilder);
  private cartFacade = inject(CartFacade);
  private orderService = inject(OrderService);
  private eventBus = inject(EventBusService);
  private router = inject(Router);

  readonly items = this.cartFacade.items;
  readonly subtotal = this.cartFacade.subtotal;
  readonly shipping = this.cartFacade.shipping;
  readonly discount = this.cartFacade.discount;
  readonly total = this.cartFacade.total;

  submitting = signal<boolean>(false);

  checkoutForm = this.fb.group({
    fullName: ['Alex Ionescu', Validators.required],
    street: ['Bulevardul Dimitrie Pompeiu 10A', Validators.required],
    city: ['Bucharest', Validators.required],
    postalCode: ['020337', Validators.required],
    country: ['Romania', Validators.required],
    phone: ['+40 722 000 111', Validators.required],
    paymentMethod: ['card', Validators.required]
  });

  ngOnInit(): void {
    if (this.items().length > 0) {
      this.eventBus.emit('CHECKOUT_STARTED', {
        cartId: this.cartFacade.cart()?.id,
        itemsCount: this.items().length,
        total: this.total()
      }, 'usr-001');
    }
  }

  async onSubmit(): Promise<void> {
    if (this.checkoutForm.invalid) return;

    this.submitting.set(true);
    const formVal = this.checkoutForm.value;

    const shippingAddress = {
      fullName: formVal.fullName!,
      street: formVal.street!,
      city: formVal.city!,
      postalCode: formVal.postalCode!,
      country: formVal.country!,
      phone: formVal.phone!
    };

    const paymentMethod = {
      type: (formVal.paymentMethod as any) || 'card',
      lastFourDigits: '4242'
    };

    await this.orderService.createOrder(shippingAddress, paymentMethod);
    this.submitting.set(false);
    this.router.navigate(['/orders']);
  }
}

