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
                  <span class="flag-icon" aria-hidden="true">
                    @if (lang.code === 'ro') {
                      <!-- Romania Emoji Flag (Twemoji 🇷🇴) -->
                      <svg class="flag-emoji" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 36 36">
                        <path fill="#002B7F" d="M4 5C1.791 5 0 6.791 0 9v18c0 2.209 1.791 4 4 4h8V5H4z"/>
                        <path fill="#FCD116" d="M12 5h12v26H12z"/>
                        <path fill="#CE1126" d="M32 5h-8v26h8c2.209 0 4-1.791 4-4V9c0-2.209-1.791-4-4-4z"/>
                      </svg>
                    } @else {
                      <!-- Great Britain / UK Emoji Flag (Twemoji 🇬🇧) -->
                      <svg class="flag-emoji" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 36 36">
                        <path fill="#00247D" d="M0 9.059V13h5.628zM4.664 31H13v-5.837zM23 25.164V31h8.335zM0 23v3.941L5.63 23zM31.337 5H23v5.837zM36 26.942V23h-5.631zM36 13V9.059L30.371 13zM13 5H4.664L13 10.837z"/>
                        <path fill="#CF1B2B" d="M25.14 23l9.712 6.801c.471-.479.808-1.082.99-1.749L28.627 23H25.14zM13 23h-2.141l-9.711 6.8c.521.53 1.189.909 1.938 1.085L13 23.943V23zm10-10h2.141l9.711-6.8c-.521-.53-1.188-.909-1.937-1.085L23 12.057V13zm-12.141 0L1.148 6.2C.677 6.68.34 7.282.157 7.949L7.372 13h3.487z"/>
                        <path fill="#EEE" d="M36 21H21v10h2v-5.836L31.335 31H32c1.117 0 2.126-.461 2.852-1.199L25.14 23h3.487l7.215 5.052c.093-.337.158-.686.158-1.052v-.058L30.369 23H36v-2zM0 21v2h5.63L0 26.941V27c0 1.091.439 2.078 1.148 2.8l9.711-6.8H13v.943l-9.914 6.941c.294.07.598.116.914.116h.664L13 25.163V31h2V21H0zM36 9c0-1.091-.439-2.078-1.148-2.8L25.141 13H23v-.943l9.915-6.942C32.62 5.046 32.316 5 32 5h-.663L23 10.837V5h-2v10h15v-2h-5.629L36 9.059V9zM13 5v5.837L4.664 5H4c-1.118 0-2.126.461-2.852 1.2l9.711 6.8H7.372L.157 7.949C.065 8.286 0 8.634 0 9v.059L5.628 13H0v2h15V5h-2z"/>
                        <path fill="#CF1B2B" d="M21 15V5h-6v10H0v6h15v10h6V21h15v-6z"/>
                      </svg>
                    }
                  </span>
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
        gap: 6px;
        background: rgba(255, 255, 255, 0.08);
        padding: 3px 6px;
        border-radius: $radius-sm;

        .lang-btn {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 3px 8px;
          border-radius: $radius-xs;
          font-size: 0.75rem;
          font-weight: 700;
          color: $gray-300;
          background: transparent;
          border: 1px solid transparent;
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

          .flag-icon {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            width: 18px;
            height: 18px;

            .flag-emoji {
              width: 18px;
              height: 18px;
              display: block;
              border-radius: 3px;
              box-shadow: 0 1px 2px rgba(0, 0, 0, 0.25);
            }
          }

          .code {
            letter-spacing: 0.5px;
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
