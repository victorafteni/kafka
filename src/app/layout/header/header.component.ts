import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { CartFacade } from '../../features/cart/cart.facade';
import { AuthService } from '../../core/auth/auth.service';
import { AppSearchBoxComponent } from '../../shared/components/app-search-box/app-search-box.component';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterModule, AppSearchBoxComponent],
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
          <div class="arch-badge">
            <a routerLink="/monitoring" class="monitoring-link">
              <span class="material-icons-outlined">insights</span>
              <span>Ops Dashboard</span>
            </a>
          </div>
        </div>
      </div>

      <div class="main-bar">
        <div class="container main-bar-inner">
          <a routerLink="/" class="brand-logo">
            <div class="logo-icon">
              <span class="material-icons-outlined">hub</span>
            </div>
            <div class="logo-text">
              <span class="brand-name">Commerce<span class="highlight">Hub</span></span>
              <span class="brand-tag">Enterprise SPA</span>
            </div>
          </a>

          <div class="header-search">
            <app-search-box (search)="onSearch($event)"></app-search-box>
          </div>

          <div class="header-actions">
            <nav class="nav-links">
              <a routerLink="/" routerLinkActive="active" [routerLinkActiveOptions]="{exact: true}">Home</a>
              <a routerLink="/products" routerLinkActive="active">Catalog</a>
              <a routerLink="/orders" routerLinkActive="active">Orders</a>
            </nav>

            <div class="actions-divider"></div>

            <a routerLink="/cart" class="cart-btn" aria-label="Shopping Cart">
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
              <a routerLink="/login" class="login-link">Login</a>
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
      background: $gray-900;
      color: $gray-300;
      font-size: 0.75rem;
      padding: 6px 0;
      border-bottom: 1px solid rgba(255, 255, 255, 0.08);
    }

    .banner-inner {
      @include flex-between;
    }

    .system-status {
      display: flex;
      align-items: center;
      gap: 8px;

      strong {
        color: #34d399;
      }
    }

    .status-dot {
      width: 7px;
      height: 7px;
      border-radius: 50%;
      background: #10b981;
      box-shadow: 0 0 8px #10b981;
      display: inline-block;
    }

    .sep {
      color: $gray-600;
    }

    .monitoring-link {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      color: $accent-500;
      font-weight: 600;
      transition: color $transition-fast;

      .material-icons-outlined {
        font-size: 14px;
      }

      &:hover {
        color: #67e8f9;
      }
    }

    .main-bar {
      padding: 12px 0;
      border-bottom: 1px solid $gray-200;
    }

    .main-bar-inner {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 24px;
    }

    .brand-logo {
      display: flex;
      align-items: center;
      gap: 10px;
      user-select: none;
    }

    .logo-icon {
      width: 38px;
      height: 38px;
      border-radius: $radius-md;
      background: linear-gradient(135deg, $primary-600, $primary-800);
      color: #ffffff;
      @include flex-center;

      .material-icons-outlined {
        font-size: 22px;
      }
    }

    .logo-text {
      display: flex;
      flex-direction: column;
    }

    .brand-name {
      font-size: 1.25rem;
      font-weight: 800;
      letter-spacing: -0.03em;
      color: $gray-900;
      line-height: 1.1;

      .highlight {
        color: $primary-600;
      }
    }

    .brand-tag {
      font-size: 0.6875rem;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      color: $gray-400;
    }

    .header-search {
      flex: 1;
      max-width: 480px;
    }

    .header-actions {
      display: flex;
      align-items: center;
      gap: 16px;
    }

    .nav-links {
      display: flex;
      align-items: center;
      gap: 20px;

      a {
        font-size: 0.875rem;
        font-weight: 600;
        color: $gray-600;
        transition: color $transition-fast;

        &:hover, &.active {
          color: $primary-600;
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
      display: flex;
      align-items: center;
      justify-content: center;
      width: 40px;
      height: 40px;
      border-radius: 50%;
      background: $gray-100;
      color: $gray-800;
      transition: all $transition-fast;

      &:hover {
        background: $primary-50;
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

    @keyframes pulse {
      0% { transform: scale(0.8); }
      50% { transform: scale(1.2); }
      100% { transform: scale(1); }
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class HeaderComponent {
  private cartFacade = inject(CartFacade);
  private authService = inject(AuthService);
  private router = inject(Router);

  readonly cartCount = this.cartFacade.totalItemsCount;
  readonly currentUser = this.authService.currentUser;
  readonly isAuthenticated = this.authService.isAuthenticated;
  readonly userFullName = this.authService.userFullName;

  onSearch(query: string): void {
    if (query) {
      this.router.navigate(['/search'], { queryParams: { q: query } });
    }
  }

  logout(): void {
    this.authService.logout();
  }
}
