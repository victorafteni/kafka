import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { CartFacade } from '../../features/cart/cart.facade';
import { AuthService } from '../../core/auth/auth.service';
import { TranslationService, SupportedLang } from '../../core/i18n/translation.service';
import { TranslatePipe } from '../../core/i18n/translate.pipe';
import { AppSearchBoxComponent } from '../../shared/components/app-search-box/app-search-box.component';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterModule, AppSearchBoxComponent, TranslatePipe],
  template: `
    <header class="app-header">
      <div class="top-banner">
        <div class="container banner-inner">
          <div class="system-status">
            <span class="status-dot"></span>
            <span>Kafka Event Bus: <strong>Active</strong></span>
            <span class="sep">•</span>
            <span>Redis Session: <strong>Connected</strong></span>
            <span class="sep">•</span>
            <span>Algolia Engine: <strong>Ready</strong></span>
          </div>

          <div class="top-right-group">
            <div class="lang-switcher">
              @for (lang of translationService.languages; track lang.code) {
                <button
                  type="button"
                  class="lang-btn"
                  [class.active]="currentLang() === lang.code"
                  (click)="setLanguage(lang.code)"
                  [title]="lang.label"
                >
                  <span class="flag">{{ lang.flag }}</span>
                  <span class="code">{{ lang.code | uppercase }}</span>
                </button>
              }
            </div>

            <div class="arch-badge">
              <a routerLink="/monitoring" class="monitoring-link">
                <span class="material-icons-outlined">insights</span>
                <span>{{ 'NAV.MONITORING' | translate }}</span>
              </a>
            </div>
          </div>
        </div>
      </div>

      <div class="main-bar">
        <div class="container main-bar-inner">
          <a routerLink="/" class="brand-logo">
            <div class="logo-icon">
              <span class="material-icons-outlined">smartphone</span>
            </div>
            <div class="logo-text">
              <span class="brand-name">Commerce<span class="highlight">Hub</span></span>
              <span class="brand-tag">Phones & Gear</span>
            </div>
          </a>

          <div class="header-search">
            <app-search-box (search)="onSearch($event)"></app-search-box>
          </div>

          <div class="header-actions">
            <nav class="nav-links">
              <a routerLink="/" routerLinkActive="active" [routerLinkActiveOptions]="{exact: true}">
                {{ 'NAV.HOME' | translate }}
              </a>
              <a routerLink="/products" routerLinkActive="active">
                {{ 'NAV.PRODUCTS' | translate }}
              </a>
              <a routerLink="/orders" routerLinkActive="active">
                {{ 'NAV.ORDERS' | translate }}
              </a>
            </nav>

            <div class="actions-divider"></div>

            <a routerLink="/cart" class="cart-btn" [attr.aria-label]="'NAV.CART' | translate">
              <span class="material-icons-outlined cart-icon">shopping_bag</span>
              @if (cartCount() > 0) {
                <span class="cart-count-badge">{{ cartCount() }}</span>
              }
            </a>

            @if (isAuthenticated()) {
              <div class="user-profile" [title]="userFullName()">
                <img [src]="currentUser()?.avatarUrl" [alt]="userFullName()" class="user-avatar" />
                <span class="user-name">{{ currentUser()?.firstName }}</span>
                <button class="logout-btn" (click)="logout()" title="Logout">
                  <span class="material-icons-outlined">logout</span>
                </button>
              </div>
            } @else {
              <a routerLink="/login" class="login-link">{{ 'NAV.SIGN_IN' | translate }}</a>
            }
          </div>
        </div>
      </div>
    </header>
  `,
  styles: [`
    @use 'styles/variables' as *;
    @use 'styles/mixins' as *;

    .app-header {
      position: sticky;
      top: 0;
      z-index: 1000;
      background: #ffffff;
      box-shadow: $shadow-sm;
    }

    .top-banner {
      background: $dark;
      color: $gray-300;
      font-size: 0.75rem;
      padding: 6px 0;
      border-bottom: 1px solid rgba(255, 255, 255, 0.08);

      .banner-inner {
        @include flex-between;
      }

      .system-status {
        display: flex;
        align-items: center;
        gap: 8px;

        strong {
          color: $primary-300;
        }

        .sep {
          color: $gray-600;
        }
      }

      .status-dot {
        width: 8px;
        height: 8px;
        background: #10b981;
        border-radius: 50%;
        display: inline-block;
        box-shadow: 0 0 6px rgba(16, 185, 129, 0.8);
        animation: pulse 2s infinite;
      }

      .top-right-group {
        display: flex;
        align-items: center;
        gap: 16px;
      }

      .lang-switcher {
        display: flex;
        align-items: center;
        gap: 4px;
        background: rgba(255, 255, 255, 0.08);
        padding: 2px 4px;
        border-radius: $radius-sm;

        .lang-btn {
          display: flex;
          align-items: center;
          gap: 4px;
          padding: 2px 6px;
          border-radius: $radius-xs;
          font-size: 0.6875rem;
          font-weight: 600;
          color: $gray-400;
          background: transparent;
          cursor: pointer;
          transition: $transition-fast;

          &:hover {
            color: #ffffff;
            background: rgba(255, 255, 255, 0.12);
          }

          &.active {
            color: #ffffff;
            background: $primary-600;
            box-shadow: 0 1px 3px rgba(0, 0, 0, 0.3);
          }

          .flag {
            font-size: 0.8125rem;
          }
        }
      }

      .monitoring-link {
        display: inline-flex;
        align-items: center;
        gap: 4px;
        color: $primary-400;
        text-decoration: none;
        font-weight: 500;
        transition: $transition-fast;

        &:hover {
          color: $primary-300;
        }

        .material-icons-outlined {
          font-size: 14px;
        }
      }
    }

    .main-bar {
      padding: 12px 0;
      border-bottom: 1px solid $gray-200;

      .main-bar-inner {
        display: flex;
        align-items: center;
        gap: 32px;
      }
    }

    .brand-logo {
      display: flex;
      align-items: center;
      gap: 10px;
      text-decoration: none;
      color: $gray-900;
      flex-shrink: 0;

      .logo-icon {
        width: 38px;
        height: 38px;
        background: linear-gradient(135deg, $primary-600, $primary-800);
        border-radius: $radius-md;
        @include flex-center;
        color: #ffffff;

        .material-icons-outlined {
          font-size: 22px;
        }
      }

      .logo-text {
        display: flex;
        flex-direction: column;

        .brand-name {
          font-size: 1.25rem;
          font-weight: 800;
          letter-spacing: -0.5px;
          line-height: 1.1;

          .highlight {
            color: $primary-600;
          }
        }

        .brand-tag {
          font-size: 0.6875rem;
          font-weight: 600;
          color: $gray-500;
          text-transform: uppercase;
          letter-spacing: 0.8px;
        }
      }
    }

    .header-search {
      flex: 1;
      max-width: 640px;
    }

    .header-actions {
      display: flex;
      align-items: center;
      gap: 18px;
      margin-left: auto;
    }

    .nav-links {
      display: flex;
      align-items: center;
      gap: 20px;

      a {
        text-decoration: none;
        color: $gray-700;
        font-weight: 600;
        font-size: 0.875rem;
        transition: $transition-fast;
        position: relative;
        padding-bottom: 2px;

        &:hover, &.active {
          color: $primary-600;
        }

        &.active::after {
          content: '';
          position: absolute;
          bottom: -16px;
          left: 0;
          right: 0;
          height: 2px;
          background: $primary-600;
        }
      }
    }

    .actions-divider {
      width: 1px;
      height: 24px;
      background: $gray-200;
    }

    .cart-btn {
      position: relative;
      width: 40px;
      height: 40px;
      border-radius: $radius-md;
      @include flex-center;
      color: $gray-700;
      text-decoration: none;
      transition: $transition-fast;

      &:hover {
        background: $gray-100;
        color: $primary-600;
      }

      .cart-icon {
        font-size: 22px;
      }
    }

    .cart-count-badge {
      position: absolute;
      top: -2px;
      right: -2px;
      background: $primary-600;
      color: #ffffff;
      font-size: 0.6875rem;
      font-weight: 700;
      height: 18px;
      min-width: 18px;
      padding: 0 4px;
      border-radius: $radius-full;
      @include flex-center;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.15);
      animation: pulse 0.3s ease-out;
    }

    .user-profile {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .user-avatar {
      width: 32px;
      height: 32px;
      border-radius: 50%;
      object-fit: cover;
      border: 1.5px solid $gray-200;
    }

    .user-name {
      font-size: 0.875rem;
      font-weight: 600;
      color: $gray-800;
    }

    .logout-btn {
      color: $gray-400;
      padding: 4px;
      display: flex;
      align-items: center;
      border-radius: $radius-xs;

      &:hover {
        color: $danger;
        background: $danger-light;
      }

      .material-icons-outlined {
        font-size: 18px;
      }
    }

    .login-link {
      font-size: 0.875rem;
      font-weight: 600;
      color: $primary-600;
      text-decoration: none;
      padding: 8px 14px;
      border-radius: $radius-sm;
      border: 1px solid $primary-200;

      &:hover {
        background: $primary-50;
      }
    }

    @keyframes pulse {
      0% { transform: scale(0.8); }
      50% { transform: scale(1.2); }
      100% { transform: scale(1); }
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class HeaderComponent {
  readonly translationService = inject(TranslationService);
  private cartFacade = inject(CartFacade);
  private authService = inject(AuthService);
  private router = inject(Router);

  readonly currentLang = this.translationService.currentLang;
  readonly cartCount = this.cartFacade.totalItemsCount;
  readonly currentUser = this.authService.currentUser;
  readonly isAuthenticated = this.authService.isAuthenticated;
  readonly userFullName = this.authService.userFullName;

  setLanguage(lang: SupportedLang): void {
    this.translationService.setLanguage(lang);
  }

  onSearch(query: string): void {
    if (query) {
      this.router.navigate(['/search'], { queryParams: { q: query } });
    }
  }

  logout(): void {
    this.authService.logout();
  }
}
