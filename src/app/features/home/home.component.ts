import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { CatalogFacade } from '../catalog/catalog.facade';
import { CartFacade } from '../cart/cart.facade';
import { Product } from '../../shared/models/product.model';
import { AppProductCardComponent } from '../../shared/components/app-product-card/app-product-card.component';
import { AppButtonComponent } from '../../shared/components/app-button/app-button.component';
import { AppSpinnerComponent } from '../../shared/components/app-spinner/app-spinner.component';
import { AppBadgeComponent } from '../../shared/components/app-badge/app-badge.component';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    AppProductCardComponent,
    AppButtonComponent,
    AppSpinnerComponent,
    AppBadgeComponent
  ],
  template: `
    <div class="home-page">
      <section class="hero-section">
        <div class="container hero-container">
          <div class="hero-text">
            <app-badge variant="accent" [dot]="true">Next-Generation Commerce Architecture</app-badge>
            <h1 class="hero-title">
              Engineered for Speed, Scalability & Precision.
            </h1>
            <p class="hero-subtitle">
              Discover top-tier enterprise computing, flagship mobile devices, and high-fidelity audio with real-time event streaming and sub-millisecond session state.
            </p>
            <div class="hero-actions">
              <a routerLink="/products">
                <app-button variant="primary" size="lg" icon="shopping_bag">
                  Explore Catalog
                </app-button>
              </a>
              <a routerLink="/monitoring">
                <app-button variant="secondary" size="lg" icon="speed">
                  View Ops Live
                </app-button>
              </a>
            </div>
          </div>

          <div class="hero-card">
            <div class="hero-product-preview">
              <img
                src="https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=800&auto=format&fit=crop&q=80"
                alt="MacBook Pro M3"
                class="hero-img"
              />
              <div class="hero-card-overlay">
                <span class="deal-tag">Featured Highlight</span>
                <h3>Apple MacBook Pro 14 M3 Pro</h3>
                <span class="price-tag">€2,499.00</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section class="section categories-section">
        <div class="container">
          <div class="section-header">
            <div>
              <h2 class="section-title">Popular Categories</h2>
              <p class="section-subtitle">Browse products by category</p>
            </div>
            <a routerLink="/products" class="view-all-link">
              View All <span class="material-icons-outlined">arrow_forward</span>
            </a>
          </div>

          <div class="categories-grid">
            @for (cat of categories(); track cat.id) {
              <a [routerLink]="['/products']" [queryParams]="{ categoryId: cat.id }" class="category-card">
                <div class="category-icon-box">
                  <span class="material-icons-outlined">{{ cat.icon || 'devices' }}</span>
                </div>
                <h4 class="category-name">{{ cat.name }}</h4>
                <span class="category-count">{{ cat.productCount || 0 }} Products</span>
              </a>
            }
          </div>
        </div>
      </section>

      <section class="section">
        <div class="container">
          <div class="section-header">
            <div>
              <h2 class="section-title">Recommended Products</h2>
              <p class="section-subtitle">Curated enterprise performance devices for power users</p>
            </div>
            <a routerLink="/products" class="view-all-link">
              All Recommendations <span class="material-icons-outlined">arrow_forward</span>
            </a>
          </div>

          @if (featuredProducts().length === 0) {
            <app-spinner label="Loading recommended products..."></app-spinner>
          } @else {
            <div class="products-grid">
              @for (product of featuredProducts(); track product.id) {
                <app-product-card
                  [product]="product"
                  (addToCart)="onAddToCart($event)">
                </app-product-card>
              }
            </div>
          }
        </div>
      </section>

      <section class="section promo-banner-section">
        <div class="container">
          <div class="promo-banner">
            <div class="banner-content">
              <span class="banner-tag">Distributed Systems Design</span>
              <h2>Event-Driven Architecture with Kafka & Redis Simulation</h2>
              <p>
                Every user action (product views, searches, cart items) is automatically dispatched through an internal EventBus to a Kafka producer and mapped against formal Avro schemas. Session states are stored behind clean repository interfaces ready for Redis clustering.
              </p>
              <div class="banner-btns">
                <a routerLink="/monitoring">
                  <app-button variant="outline" icon="hub">
                    Inspect Event Stream
                  </app-button>
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section class="section">
        <div class="container">
          <div class="section-header">
            <div>
              <h2 class="section-title">Popular Products</h2>
              <p class="section-subtitle">Trending among developers, architects, and engineering teams</p>
            </div>
            <a routerLink="/products" class="view-all-link">
              Browse All <span class="material-icons-outlined">arrow_forward</span>
            </a>
          </div>

          @if (popularProducts().length === 0) {
            <app-spinner label="Loading popular products..."></app-spinner>
          } @else {
            <div class="products-grid">
              @for (product of popularProducts(); track product.id) {
                <app-product-card
                  [product]="product"
                  (addToCart)="onAddToCart($event)">
                </app-product-card>
              }
            </div>
          }
        </div>
      </section>
    </div>
  `,
  styles: [`
    @use 'styles/variables' as *;
    @use 'styles/mixins' as *;

    .home-page {
      padding-bottom: 60px;
    }

    .hero-section {
      background: linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #311042 100%);
      color: #ffffff;
      padding: 60px 0 80px;
      position: relative;
      overflow: hidden;
    }

    .hero-container {
      display: grid;
      grid-template-columns: 1.2fr 0.8fr;
      align-items: center;
      gap: 48px;

      @media (max-width: $bp-lg) {
        grid-template-columns: 1fr;
        text-align: center;
      }
    }

    .hero-text {
      display: flex;
      flex-direction: column;
      gap: 20px;

      @media (max-width: $bp-lg) {
        align-items: center;
      }
    }

    .hero-title {
      font-size: 2.85rem;
      font-weight: 800;
      line-height: 1.15;
      letter-spacing: -0.03em;

      @media (max-width: $bp-md) {
        font-size: 2.1rem;
      }
    }

    .hero-subtitle {
      font-size: 1.125rem;
      line-height: 1.6;
      color: #cbd5e1;
      max-width: 580px;
    }

    .hero-actions {
      display: flex;
      gap: 14px;
      margin-top: 8px;
    }

    .hero-card {
      position: relative;
      border-radius: $radius-lg;
      overflow: hidden;
      box-shadow: $shadow-xl;
      border: 1px solid rgba(255, 255, 255, 0.1);
    }

    .hero-product-preview {
      position: relative;
      aspect-ratio: 16 / 11;

      .hero-img {
        width: 100%;
        height: 100%;
        object-fit: cover;
      }
    }

    .hero-card-overlay {
      position: absolute;
      bottom: 0;
      left: 0;
      right: 0;
      padding: 24px;
      background: linear-gradient(to top, rgba(15, 23, 42, 0.95), transparent);
      display: flex;
      flex-direction: column;
      gap: 4px;

      .deal-tag {
        font-size: 0.75rem;
        font-weight: 700;
        text-transform: uppercase;
        color: $accent-500;
        letter-spacing: 0.05em;
      }

      h3 {
        font-size: 1.25rem;
        font-weight: 700;
      }

      .price-tag {
        font-size: 1.35rem;
        font-weight: 800;
        color: #38bdf8;
      }
    }

    .section {
      padding: 48px 0;
    }

    .section-header {
      @include flex-between;
      margin-bottom: 28px;
    }

    .section-title {
      font-size: 1.65rem;
      font-weight: 800;
      letter-spacing: -0.02em;
      color: $gray-900;
    }

    .section-subtitle {
      font-size: 0.9375rem;
      color: $gray-500;
      margin-top: 4px;
    }

    .view-all-link {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      font-size: 0.875rem;
      font-weight: 600;
      color: $primary-600;
      transition: gap $transition-fast;

      &:hover {
        gap: 8px;
      }

      .material-icons-outlined {
        font-size: 16px;
      }
    }

    .categories-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 16px;
    }

    .category-card {
      background: #ffffff;
      border: 1px solid $gray-200;
      border-radius: $radius-lg;
      padding: 24px;
      display: flex;
      flex-direction: column;
      align-items: center;
      text-align: center;
      transition: all $transition-base;
      box-shadow: $shadow-xs;

      &:hover {
        transform: translateY(-4px);
        border-color: $primary-400;
        box-shadow: $shadow-md;

        .category-icon-box {
          background: $primary-50;
          color: $primary-600;
        }
      }
    }

    .category-icon-box {
      width: 56px;
      height: 56px;
      border-radius: 50%;
      background: $gray-100;
      color: $gray-700;
      @include flex-center;
      margin-bottom: 12px;
      transition: all $transition-fast;

      .material-icons-outlined {
        font-size: 28px;
      }
    }

    .category-name {
      font-size: 1rem;
      font-weight: 700;
      color: $gray-900;
      margin-bottom: 4px;
    }

    .category-count {
      font-size: 0.8125rem;
      color: $gray-500;
    }

    .products-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(270px, 1fr));
      gap: 24px;
    }

    .promo-banner {
      background: linear-gradient(135deg, #1e293b, #0f172a);
      border-radius: $radius-lg;
      padding: 48px;
      color: #ffffff;
      border: 1px solid $gray-700;
    }

    .banner-content {
      max-width: 720px;

      .banner-tag {
        font-size: 0.75rem;
        font-weight: 700;
        text-transform: uppercase;
        color: $accent-500;
        letter-spacing: 0.05em;
        margin-bottom: 8px;
        display: inline-block;
      }

      h2 {
        font-size: 1.85rem;
        font-weight: 800;
        margin-bottom: 12px;
      }

      p {
        font-size: 1rem;
        line-height: 1.6;
        color: $gray-300;
        margin-bottom: 24px;
      }
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class HomeComponent {
  private catalogFacade = inject(CatalogFacade);
  private cartFacade = inject(CartFacade);

  readonly categories = this.catalogFacade.categories;
  readonly featuredProducts = this.catalogFacade.featuredProducts;
  readonly popularProducts = this.catalogFacade.popularProducts;

  onAddToCart(product: Product): void {
    this.cartFacade.addToCart(product, 1);
  }
}

