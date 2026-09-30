import { Component, ChangeDetectionStrategy, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Product } from '../../models/product.model';
import { AppRatingComponent } from '../app-rating/app-rating.component';
import { AppPriceComponent } from '../app-price/app-price.component';
import { AppButtonComponent } from '../app-button/app-button.component';
import { AppBadgeComponent } from '../app-badge/app-badge.component';

@Component({
  selector: 'app-product-card',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    AppRatingComponent,
    AppPriceComponent,
    AppButtonComponent,
    AppBadgeComponent
  ],
  template: `
    <div class="product-card" [class.list-mode]="viewMode() === 'list'">
      <div class="image-wrapper" [routerLink]="['/products', product().id]">
        <img
          [src]="product().thumbnail"
          [alt]="product().name"
          loading="lazy"
          class="product-image"
        />
        <div class="badges-top">
          @if (product().stock <= 5 && product().stock > 0) {
            <app-badge variant="warning">Only {{ product().stock }} left</app-badge>
          } @else if (product().stock === 0) {
            <app-badge variant="danger">Out of stock</app-badge>
          } @else if (product().featured) {
            <app-badge variant="accent">Featured</app-badge>
          }
        </div>
      </div>

      <div class="card-content">
        <div class="meta-row">
          <span class="brand">{{ product().brand }}</span>
          <span class="category">{{ product().categoryName }}</span>
        </div>

        <h3 class="product-title" [routerLink]="['/products', product().id]">
          {{ product().name }}
        </h3>

        @if (viewMode() === 'list') {
          <p class="description">{{ product().description }}</p>
        }

        <div class="rating-wrapper">
          <app-rating [rating]="product().rating" [reviewCount]="product().reviewCount"></app-rating>
        </div>

        <div class="footer-row">
          <app-price
            [price]="product().price"
            [originalPrice]="product().originalPrice"
            [currency]="product().currency"
            size="md">
          </app-price>

          <app-button
            variant="primary"
            size="sm"
            icon="add_shopping_cart"
            [disabled]="product().stock === 0"
            (clicked)="onAddToCart($event)">
            Add to Cart
          </app-button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    @use 'styles/variables' as *;
    @use 'styles/mixins' as *;

    .product-card {
      background: #ffffff;
      border: 1px solid $gray-200;
      border-radius: $radius-lg;
      overflow: hidden;
      display: flex;
      flex-direction: column;
      height: 100%;
      box-shadow: $shadow-xs;
      transition: all $transition-base;

      &:hover {
        transform: translateY(-4px);
        box-shadow: $shadow-lg;
        border-color: $gray-300;

        .product-image {
          transform: scale(1.04);
        }
      }

      &.list-mode {
        flex-direction: row;
        height: auto;

        .image-wrapper {
          width: 220px;
          min-width: 220px;
          height: auto;
          aspect-ratio: auto;
        }

        .card-content {
          flex: 1;
        }

        .description {
          display: block;
          font-size: 0.875rem;
          color: $gray-600;
          margin-top: 6px;
          margin-bottom: 12px;
          line-height: 1.4;
        }
      }
    }

    .image-wrapper {
      position: relative;
      width: 100%;
      aspect-ratio: 4 / 3;
      background: $gray-50;
      overflow: hidden;
      cursor: pointer;
    }

    .product-image {
      width: 100%;
      height: 100%;
      object-fit: cover;
      transition: transform $transition-slow;
    }

    .badges-top {
      position: absolute;
      top: 10px;
      left: 10px;
      display: flex;
      flex-direction: column;
      gap: 6px;
      z-index: 2;
    }

    .card-content {
      padding: 16px;
      display: flex;
      flex-direction: column;
      flex: 1;
    }

    .meta-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 6px;
    }

    .brand {
      font-size: 0.75rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: $primary-600;
    }

    .category {
      font-size: 0.75rem;
      color: $gray-400;
    }

    .product-title {
      font-size: 0.95rem;
      font-weight: 600;
      color: $gray-900;
      line-height: 1.4;
      margin-bottom: 8px;
      cursor: pointer;
      @include line-clamp(2);

      &:hover {
        color: $primary-600;
      }
    }

    .rating-wrapper {
      margin-bottom: 14px;
    }

    .footer-row {
      margin-top: auto;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 8px;
      padding-top: 12px;
      border-top: 1px solid $gray-100;
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AppProductCardComponent {
  product = input.required<Product>();
  viewMode = input<'grid' | 'list'>('grid');

  addToCart = output<Product>();

  onAddToCart(event: MouseEvent): void {
    event.stopPropagation();
    this.addToCart.emit(this.product());
  }
}
