import { Component, ChangeDetectionStrategy, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { CatalogFacade } from '../catalog/catalog.facade';
import { CartFacade } from '../cart/cart.facade';
import { Product } from '../../shared/models/product.model';
import { AppRatingComponent } from '../../shared/components/app-rating/app-rating.component';
import { AppPriceComponent } from '../../shared/components/app-price/app-price.component';
import { AppButtonComponent } from '../../shared/components/app-button/app-button.component';
import { AppSpinnerComponent } from '../../shared/components/app-spinner/app-spinner.component';
import { AppProductCardComponent } from '../../shared/components/app-product-card/app-product-card.component';

@Component({
  selector: 'app-product-detail',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    AppRatingComponent,
    AppPriceComponent,
    AppButtonComponent,
    AppSpinnerComponent,
    AppProductCardComponent
  ],
  template: `
    <div class="product-detail-page">
      <div class="container">
        @if (loading()) {
          <div class="loading-wrapper">
            <app-spinner label="Fetching product telemetry and specifications..."></app-spinner>
          </div>
        } @else if (product()) {
          <nav class="breadcrumb">
            <a routerLink="/">Home</a>
            <span class="sep">/</span>
            <a routerLink="/products">Products</a>
            <span class="sep">/</span>
            <span class="current">{{ product()!.name }}</span>
          </nav>

          <div class="detail-main">
            <div class="gallery-col">
              <div class="main-image-box">
                <img [src]="selectedImage() || product()!.images[0]" [alt]="product()!.name" class="main-image" />
              </div>
              @if (product()!.images.length > 1) {
                <div class="thumbnails-row">
                  @for (img of product()!.images; track img) {
                    <div
                      class="thumb-box"
                      [class.active]="(selectedImage() || product()!.images[0]) === img"
                      (click)="selectedImage.set(img)">
                      <img [src]="img" [alt]="product()!.name" />
                    </div>
                  }
                </div>
              }
            </div>

            <div class="info-col">
              <div class="brand-row">
                <span class="brand-badge">{{ product()!.brand }}</span>
                <span class="sku-code">SKU: {{ product()!.sku }}</span>
              </div>

              <h1 class="product-title">{{ product()!.name }}</h1>

              <div class="rating-row">
                <app-rating
                  [rating]="product()!.rating"
                  [reviewCount]="product()!.reviewCount"
                  [showScore]="true">
                </app-rating>
                <span class="verified-buyer">• Verified Purchase Reviews</span>
              </div>

              <div class="price-box">
                <app-price
                  [price]="product()!.price"
                  [originalPrice]="product()!.originalPrice"
                  [currency]="product()!.currency"
                  size="lg">
                </app-price>
              </div>

              <div class="stock-status">
                @if (product()!.stock > 5) {
                  <span class="stock-indicator in-stock">
                    <span class="material-icons-outlined">check_circle</span>
                    In Stock ({{ product()!.stock }} units available in warehouse)
                  </span>
                } @else if (product()!.stock > 0) {
                  <span class="stock-indicator low-stock">
                    <span class="material-icons-outlined">warning</span>
                    Hurry! Only {{ product()!.stock }} left in stock
                  </span>
                } @else {
                  <span class="stock-indicator out-stock">
                    <span class="material-icons-outlined">cancel</span>
                    Temporarily Out of Stock
                  </span>
                }
              </div>

              <p class="product-summary">{{ product()!.description }}</p>

              <div class="actions-box">
                <div class="quantity-picker">
                  <button
                    class="qty-btn"
                    [disabled]="quantity() <= 1"
                    (click)="decrementQty()">
                    -
                  </button>
                  <span class="qty-val">{{ quantity() }}</span>
                  <button
                    class="qty-btn"
                    [disabled]="quantity() >= product()!.stock"
                    (click)="incrementQty()">
                    +
                  </button>
                </div>

                <app-button
                  variant="primary"
                  size="lg"
                  icon="shopping_cart"
                  [disabled]="product()!.stock === 0"
                  (clicked)="onAddToCart()">
                  Add to Cart
                </app-button>
              </div>

              <div class="quick-perks">
                <div class="perk-item">
                  <span class="material-icons-outlined">local_shipping</span>
                  <div>
                    <strong>Express Shipping Available</strong>
                    <p>Free standard delivery on orders above €1,000</p>
                  </div>
                </div>
                <div class="perk-item">
                  <span class="material-icons-outlined">verified_user</span>
                  <div>
                    <strong>2-Year Warranty Included</strong>
                    <p>Official manufacturer warranty & 30-day money back</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div class="tabs-section">
            <div class="tabs-header">
              <button
                class="tab-btn"
                [class.active]="activeTab() === 'specs'"
                (click)="activeTab.set('specs')">
                Technical Specifications
              </button>
              <button
                class="tab-btn"
                [class.active]="activeTab() === 'desc'"
                (click)="activeTab.set('desc')">
                Full Description
              </button>
              <button
                class="tab-btn"
                [class.active]="activeTab() === 'reviews'"
                (click)="activeTab.set('reviews')">
                Customer Reviews ({{ product()!.reviewCount }})
              </button>
            </div>

            <div class="tab-content">
              @if (activeTab() === 'specs') {
                <div class="specs-grid">
                  @for (attr of product()!.attributes; track attr.name) {
                    <div class="spec-row">
                      <span class="spec-name">{{ attr.name }}</span>
                      <span class="spec-value">{{ attr.value }}</span>
                    </div>
                  }
                </div>
              } @else if (activeTab() === 'desc') {
                <div class="description-body">
                  <p>{{ product()!.description }}</p>
                  <p>
                    Engineered to meet stringent commercial demands, featuring optimized thermal architecture, enterprise-grade components, and future-proof connectivity interfaces.
                  </p>
                </div>
              } @else {
                <div class="reviews-preview">
                  <div class="review-card">
                    <div class="review-top">
                      <strong>Mihai D.</strong>
                      <span class="review-date">2 weeks ago</span>
                    </div>
                    <app-rating [rating]="5" [showCount]="false"></app-rating>
                    <p class="review-text">
                      Outstanding build quality and blazingly fast delivery. Runs quiet under heavy workloads. Highly recommended!
                    </p>
                  </div>
                </div>
              }
            </div>
          </div>

          @if (relatedProducts().length > 0) {
            <div class="related-section">
              <h2 class="related-title">Related Products in {{ product()!.categoryName }}</h2>
              <div class="related-grid">
                @for (rel of relatedProducts(); track rel.id) {
                  <app-product-card
                    [product]="rel"
                    (addToCart)="cartFacade.addToCart($event, 1)">
                  </app-product-card>
                }
              </div>
            </div>
          }
        }
      </div>
    </div>
  `,
  styles: [`
    @use 'styles/variables' as *;
    @use 'styles/mixins' as *;

    .product-detail-page {
      padding: 32px 0 60px;
    }

    .breadcrumb {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 0.8125rem;
      color: $gray-500;
      margin-bottom: 24px;

      a:hover {
        color: $primary-600;
      }

      .current {
        color: $gray-800;
        font-weight: 600;
      }
    }

    .detail-main {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 48px;
      margin-bottom: 48px;

      @media (max-width: $bp-lg) {
        grid-template-columns: 1fr;
        gap: 32px;
      }
    }

    .gallery-col {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .main-image-box {
      width: 100%;
      aspect-ratio: 4 / 3;
      border-radius: $radius-lg;
      overflow: hidden;
      border: 1px solid $gray-200;
      background: #ffffff;
      @include flex-center;

      .main-image {
        width: 100%;
        height: 100%;
        object-fit: cover;
      }
    }

    .thumbnails-row {
      display: flex;
      gap: 12px;
    }

    .thumb-box {
      width: 72px;
      height: 72px;
      border-radius: $radius-md;
      border: 2px solid $gray-200;
      overflow: hidden;
      cursor: pointer;
      transition: all $transition-fast;

      img {
        width: 100%;
        height: 100%;
        object-fit: cover;
      }

      &.active, &:hover {
        border-color: $primary-600;
      }
    }

    .info-col {
      display: flex;
      flex-direction: column;
    }

    .brand-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 8px;
    }

    .brand-badge {
      font-size: 0.8125rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: $primary-600;
    }

    .sku-code {
      font-size: 0.75rem;
      color: $gray-400;
      font-family: 'JetBrains Mono', monospace;
    }

    .product-title {
      font-size: 2rem;
      font-weight: 800;
      line-height: 1.25;
      letter-spacing: -0.02em;
      color: $gray-900;
      margin-bottom: 12px;
    }

    .rating-row {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 20px;
    }

    .verified-buyer {
      font-size: 0.8125rem;
      color: $gray-400;
    }

    .price-box {
      margin-bottom: 20px;
    }

    .stock-status {
      margin-bottom: 20px;
    }

    .stock-indicator {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      font-size: 0.875rem;
      font-weight: 600;

      .material-icons-outlined {
        font-size: 18px;
      }

      &.in-stock {
        color: $success;
      }
      &.low-stock {
        color: $warning;
      }
      &.out-stock {
        color: $danger;
      }
    }

    .product-summary {
      font-size: 1rem;
      line-height: 1.6;
      color: $gray-600;
      margin-bottom: 28px;
    }

    .actions-box {
      display: flex;
      align-items: center;
      gap: 16px;
      margin-bottom: 32px;
      padding-bottom: 24px;
      border-bottom: 1px solid $gray-200;
    }

    .quantity-picker {
      display: inline-flex;
      align-items: center;
      border: 1.5px solid $gray-300;
      border-radius: $radius-md;
      overflow: hidden;
      background: #ffffff;
    }

    .qty-btn {
      width: 40px;
      height: 44px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.15rem;
      font-weight: 600;
      color: $gray-700;
      background: $gray-50;
      transition: background $transition-fast;

      &:hover:not(:disabled) {
        background: $gray-200;
      }

      &:disabled {
        opacity: 0.4;
      }
    }

    .qty-val {
      min-width: 44px;
      text-align: center;
      font-weight: 700;
      font-size: 1rem;
      color: $gray-900;
    }

    .quick-perks {
      display: flex;
      flex-direction: column;
      gap: 14px;
    }

    .perk-item {
      display: flex;
      align-items: flex-start;
      gap: 12px;

      .material-icons-outlined {
        font-size: 22px;
        color: $primary-600;
      }

      strong {
        display: block;
        font-size: 0.875rem;
        color: $gray-900;
      }

      p {
        font-size: 0.8125rem;
        color: $gray-500;
      }
    }

    .tabs-section {
      background: #ffffff;
      border: 1px solid $gray-200;
      border-radius: $radius-lg;
      margin-bottom: 48px;
      overflow: hidden;
    }

    .tabs-header {
      display: flex;
      border-bottom: 1px solid $gray-200;
      background: $gray-50;
    }

    .tab-btn {
      padding: 14px 24px;
      font-size: 0.9375rem;
      font-weight: 600;
      color: $gray-600;
      border-bottom: 2px solid transparent;
      transition: all $transition-fast;

      &.active {
        color: $primary-600;
        background: #ffffff;
        border-bottom-color: $primary-600;
      }

      &:hover:not(.active) {
        color: $gray-900;
      }
    }

    .tab-content {
      padding: 28px;
    }

    .specs-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
      gap: 16px;
    }

    .spec-row {
      display: flex;
      flex-direction: column;
      gap: 4px;
      padding: 12px;
      background: $gray-50;
      border-radius: $radius-sm;
    }

    .spec-name {
      font-size: 0.75rem;
      text-transform: uppercase;
      font-weight: 700;
      color: $gray-400;
      letter-spacing: 0.04em;
    }

    .spec-value {
      font-size: 0.9375rem;
      font-weight: 600;
      color: $gray-800;
    }

    .description-body {
      line-height: 1.7;
      color: $gray-700;
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .reviews-preview {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .review-card {
      padding: 16px;
      background: $gray-50;
      border-radius: $radius-md;
    }

    .review-top {
      display: flex;
      justify-content: space-between;
      margin-bottom: 6px;
    }

    .review-date {
      font-size: 0.8125rem;
      color: $gray-400;
    }

    .review-text {
      margin-top: 8px;
      font-size: 0.875rem;
      color: $gray-700;
    }

    .related-section {
      margin-top: 48px;
    }

    .related-title {
      font-size: 1.5rem;
      font-weight: 800;
      margin-bottom: 24px;
      color: $gray-900;
    }

    .related-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
      gap: 20px;
    }

    .loading-wrapper {
      padding: 80px 0;
      display: flex;
      justify-content: center;
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ProductDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private catalogFacade = inject(CatalogFacade);
  readonly cartFacade = inject(CartFacade);

  readonly product = this.catalogFacade.selectedProduct;
  readonly relatedProducts = this.catalogFacade.relatedProducts;
  readonly loading = this.catalogFacade.loading;

  selectedImage = signal<string | null>(null);
  quantity = signal<number>(1);
  activeTab = signal<'specs' | 'desc' | 'reviews'>('specs');

  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      const id = params.get('id');
      if (id) {
        this.catalogFacade.loadProductById(id);
        this.selectedImage.set(null);
        this.quantity.set(1);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    });
  }

  incrementQty(): void {
    const prod = this.product();
    if (prod && this.quantity() < prod.stock) {
      this.quantity.update(q => q + 1);
    }
  }

  decrementQty(): void {
    if (this.quantity() > 1) {
      this.quantity.update(q => q - 1);
    }
  }

  onAddToCart(): void {
    const prod = this.product();
    if (prod) {
      this.cartFacade.addToCart(prod, this.quantity());
    }
  }
}

