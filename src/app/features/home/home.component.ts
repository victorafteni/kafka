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
import { TranslatePipe } from '../../core/i18n/translate.pipe';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    AppProductCardComponent,
    AppButtonComponent,
    AppSpinnerComponent,
    AppBadgeComponent,
    TranslatePipe
  ],
  template: `
    <div class="home-page">
      <section class="hero-section">
        <div class="container hero-container">
          <div class="hero-text">
            <app-badge variant="accent" [dot]="true">{{ 'HOME.HERO_BADGE' | translate }}</app-badge>
            <h1 class="hero-title">
              {{ 'HOME.HERO_TITLE' | translate }}
            </h1>
            <p class="hero-subtitle">
              {{ 'HOME.HERO_SUBTITLE' | translate }}
            </p>
            <div class="hero-actions">
              <a routerLink="/products">
                <app-button variant="primary" size="lg" icon="smartphone">
                  {{ 'HOME.HERO_CTA' | translate }}
                </app-button>
              </a>
              <a [routerLink]="['/products']" [queryParams]="{ categoryId: 'cat-cases' }">
                <app-button variant="secondary" size="lg" icon="shield">
                  {{ 'HOME.HERO_SEC_CTA' | translate }}
                </app-button>
              </a>
            </div>
          </div>

          <div class="hero-card">
            <div class="hero-product-preview">
              <img
                src="https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=800&auto=format&fit=crop&q=80"
                alt="iPhone 16 Pro Max"
                class="hero-img"
              />
              <div class="hero-card-overlay">
                <span class="deal-tag">{{ 'COMMON.IN_STOCK' | translate }}</span>
                <h3>Apple iPhone 16 Pro Max</h3>
                <span class="price-tag">€1,479.00</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- Benefits bar -->
      <section class="benefits-bar">
        <div class="container benefits-grid">
          <div class="benefit-item">
            <span class="material-icons-outlined benefit-icon">local_shipping</span>
            <div class="benefit-info">
              <h4>{{ 'HOME.BENEFITS_SHIPPING_TITLE' | translate }}</h4>
              <p>{{ 'HOME.BENEFITS_SHIPPING_DESC' | translate }}</p>
            </div>
          </div>
          <div class="benefit-item">
            <span class="material-icons-outlined benefit-icon">verified_user</span>
            <div class="benefit-info">
              <h4>{{ 'HOME.BENEFITS_WARRANTY_TITLE' | translate }}</h4>
              <p>{{ 'HOME.BENEFITS_WARRANTY_DESC' | translate }}</p>
            </div>
          </div>
          <div class="benefit-item">
            <span class="material-icons-outlined benefit-icon">lock</span>
            <div class="benefit-info">
              <h4>{{ 'HOME.BENEFITS_SECURITY_TITLE' | translate }}</h4>
              <p>{{ 'HOME.BENEFITS_SECURITY_DESC' | translate }}</p>
            </div>
          </div>
        </div>
      </section>

      <section class="section categories-section">
        <div class="container">
          <div class="section-header">
            <div>
              <h2 class="section-title">{{ 'HOME.FEATURED_CATEGORIES' | translate }}</h2>
              <p class="section-subtitle">{{ 'HOME.FEATURED_SUBTITLE' | translate }}</p>
            </div>
            <a routerLink="/products" class="view-all-link">
              {{ 'COMMON.ALL' | translate }} <span class="material-icons-outlined">arrow_forward</span>
            </a>
          </div>

          <div class="categories-grid">
            @for (cat of categories(); track cat.id) {
              <a [routerLink]="['/products']" [queryParams]="{ categoryId: cat.id }" class="category-card">
                <div class="category-icon-box">
                  <span class="material-icons-outlined">{{ cat.icon || 'devices' }}</span>
                </div>
                <h4 class="category-name">{{ cat.name }}</h4>
                <span class="category-count">{{ cat.productCount || 0 }} {{ 'COMMON.ITEMS' | translate }}</span>
              </a>
            }
          </div>
        </div>
      </section>

      <section class="section">
        <div class="container">
          <div class="section-header">
            <div>
              <h2 class="section-title">{{ 'HOME.BEST_SELLERS' | translate }}</h2>
              <p class="section-subtitle">{{ 'HOME.BEST_SELLERS_SUBTITLE' | translate }}</p>
            </div>
            <a routerLink="/products" class="view-all-link">
              {{ 'COMMON.ALL' | translate }} <span class="material-icons-outlined">arrow_forward</span>
            </a>
          </div>

          @if (featuredProducts().length === 0) {
            <app-spinner [label]="'COMMON.LOADING' | translate"></app-spinner>
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
              <span class="banner-tag">Event-Driven Architecture</span>
              <h2>Kafka Event Streaming & Redis Session Persistence</h2>
              <p>
                Orice acțiune pe telefoane sau accesorii (vizualizare produs, adăugare în coș, plasare comandă) este dirijată instantaneu către brokerul Kafka cu validare Avro schema. Sesiunea de coș este decuplată și pregătită pentru Redis Cluster.
              </p>
              <div class="banner-btns">
                <a routerLink="/monitoring">
                  <app-button variant="outline" icon="hub">
                    {{ 'NAV.MONITORING' | translate }}
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
              <h2 class="section-title">Smartphones & Top Gear</h2>
              <p class="section-subtitle">Flagship-uri Apple, Samsung, Google și accesorii de încărcare rapidă</p>
            </div>
            <a routerLink="/products" class="view-all-link">
              {{ 'COMMON.ALL' | translate }} <span class="material-icons-outlined">arrow_forward</span>
            </a>
          </div>

          @if (popularProducts().length === 0) {
            <app-spinner [label]="'COMMON.LOADING' | translate"></app-spinner>
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
      background: linear-gradient(135deg, #090d16 0%, #1e1b4b 50%, #172554 100%);
      color: #ffffff;
      padding: 60px 0 80px;
      position: relative;
      overflow: hidden;

      &::after {
        content: '';
        position: absolute;
        top: -50%;
        right: -20%;
        width: 600px;
        height: 600px;
        background: radial-gradient(circle, rgba(99, 102, 241, 0.25) 0%, rgba(0,0,0,0) 70%);
        pointer-events: none;
      }
    }

    .hero-container {
      display: grid;
      grid-template-columns: 1.2fr 0.8fr;
      gap: 48px;
      align-items: center;

      @media (max-width: $bp-md) {
        grid-template-columns: 1fr;
        gap: 32px;
      }
    }

    .hero-text {
      display: flex;
      flex-direction: column;
      gap: 20px;
      position: relative;
      z-index: 1;

      .hero-title {
        font-size: 2.75rem;
        font-weight: 800;
        line-height: 1.15;
        letter-spacing: -0.03em;

        @media (max-width: $bp-sm) {
          font-size: 2rem;
        }
      }

      .hero-subtitle {
        font-size: 1.125rem;
        line-height: 1.6;
        color: $gray-300;
        max-width: 580px;
      }

      .hero-actions {
        display: flex;
        gap: 16px;
        flex-wrap: wrap;
        margin-top: 8px;
      }
    }

    .hero-card {
      position: relative;
      z-index: 1;
      display: flex;
      justify-content: center;
    }

    .hero-product-preview {
      position: relative;
      border-radius: $radius-xl;
      overflow: hidden;
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
      border: 1px solid rgba(255, 255, 255, 0.15);
      background: $dark-surface;
      max-width: 440px;
      width: 100%;

      .hero-img {
        width: 100%;
        height: 380px;
        object-fit: cover;
        display: block;
        transition: transform 0.5s ease;

        &:hover {
          transform: scale(1.03);
        }
      }

      .hero-card-overlay {
        position: absolute;
        bottom: 0;
        left: 0;
        right: 0;
        padding: 24px;
        background: linear-gradient(to top, rgba(15, 23, 42, 0.95) 0%, rgba(15, 23, 42, 0.4) 70%, transparent 100%);
        color: #ffffff;

        .deal-tag {
          display: inline-block;
          font-size: 0.6875rem;
          font-weight: 700;
          text-transform: uppercase;
          background: #10b981;
          color: #ffffff;
          padding: 3px 8px;
          border-radius: $radius-xs;
          margin-bottom: 8px;
        }

        h3 {
          font-size: 1.25rem;
          font-weight: 700;
          margin-bottom: 6px;
        }

        .price-tag {
          font-size: 1.35rem;
          font-weight: 800;
          color: $primary-300;
        }
      }
    }

    .benefits-bar {
      background: #ffffff;
      border-bottom: 1px solid $gray-200;
      padding: 24px 0;

      .benefits-grid {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 32px;

        @media (max-width: $bp-md) {
          grid-template-columns: 1fr;
          gap: 16px;
        }
      }

      .benefit-item {
        display: flex;
        align-items: center;
        gap: 16px;

        .benefit-icon {
          font-size: 32px;
          color: $primary-600;
          background: $primary-50;
          padding: 10px;
          border-radius: $radius-md;
        }

        .benefit-info {
          h4 {
            font-size: 0.9375rem;
            font-weight: 700;
            color: $gray-900;
            margin-bottom: 2px;
          }

          p {
            font-size: 0.8125rem;
            color: $gray-500;
          }
        }
      }
    }

    .section {
      padding: 48px 0;
    }

    .section-header {
      @include flex-between;
      margin-bottom: 28px;

      .section-title {
        font-size: 1.75rem;
        font-weight: 800;
        color: $gray-900;
        letter-spacing: -0.02em;
        margin-bottom: 4px;
      }

      .section-subtitle {
        font-size: 0.9375rem;
        color: $gray-500;
      }

      .view-all-link {
        display: flex;
        align-items: center;
        gap: 4px;
        color: $primary-600;
        font-weight: 600;
        font-size: 0.875rem;
        text-decoration: none;

        &:hover {
          color: $primary-700;
        }

        .material-icons-outlined {
          font-size: 18px;
        }
      }
    }

    .categories-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
      gap: 20px;
    }

    .category-card {
      background: #ffffff;
      border: 1px solid $gray-200;
      border-radius: $radius-lg;
      padding: 24px 16px;
      display: flex;
      flex-direction: column;
      align-items: center;
      text-align: center;
      text-decoration: none;
      transition: all $transition-normal;

      &:hover {
        transform: translateY(-4px);
        box-shadow: $shadow-md;
        border-color: $primary-300;

        .category-icon-box {
          background: $primary-600;
          color: #ffffff;
          transform: scale(1.1);
        }
      }
    }

    .category-icon-box {
      width: 56px;
      height: 56px;
      border-radius: 50%;
      background: $gray-100;
      color: $primary-600;
      @include flex-center;
      margin-bottom: 12px;
      transition: all $transition-fast;

      .material-icons-outlined {
        font-size: 28px;
      }
    }

    .category-name {
      font-size: 0.9375rem;
      font-weight: 700;
      color: $gray-900;
      margin-bottom: 4px;
    }

    .category-count {
      font-size: 0.75rem;
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
