import { Component, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <footer class="app-footer">
      <div class="container footer-content">
        <div class="footer-column brand-col">
          <div class="brand-row">
            <span class="material-icons-outlined logo-icon">hub</span>
            <span class="brand-name">Commerce<span class="highlight">Hub</span></span>
          </div>
          <p class="brand-desc">
            Modern enterprise e-commerce Single Page Application engineered for high throughput, sub-100ms faceted discovery, decoupled state management, and real-time event-driven streaming.
          </p>
          <div class="tech-stack-tags">
            <span class="tech-tag">Angular 19</span>
            <span class="tech-tag">RxJS & Signals</span>
            <span class="tech-tag">Kafka Events</span>
            <span class="tech-tag">Redis Simulation</span>
            <span class="tech-tag">Avro Schemas</span>
            <span class="tech-tag">Docker</span>
          </div>
        </div>

        <div class="footer-column">
          <h4 class="col-title">Navigation</h4>
          <ul class="col-links">
            <li><a routerLink="/">Home</a></li>
            <li><a routerLink="/products">Product Catalog</a></li>
            <li><a routerLink="/cart">Shopping Cart</a></li>
            <li><a routerLink="/orders">My Orders</a></li>
          </ul>
        </div>

        <div class="footer-column">
          <h4 class="col-title">Enterprise & Ops</h4>
          <ul class="col-links">
            <li><a routerLink="/monitoring">Telemetry & Monitoring</a></li>
            <li><a href="https://kafka.apache.org/" target="_blank" rel="noopener">Apache Kafka Architecture</a></li>
            <li><a href="https://redis.io/" target="_blank" rel="noopener">Redis Cache Pattern</a></li>
            <li><a href="https://avro.apache.org/" target="_blank" rel="noopener">Avro Event Schemas</a></li>
          </ul>
        </div>

        <div class="footer-column">
          <h4 class="col-title">Architecture Highlights</h4>
          <div class="arch-box">
            <div class="arch-item">
              <span class="material-icons-outlined">layers</span>
              <span>Clean Architecture: Facade → Service → Repository</span>
            </div>
            <div class="arch-item">
              <span class="material-icons-outlined">bolt</span>
              <span>OnPush + Signals Zero Overhead Change Detection</span>
            </div>
            <div class="arch-item">
              <span class="material-icons-outlined">swap_horiz</span>
              <span>Replaceable Microservice & Algolia Providers</span>
            </div>
          </div>
        </div>
      </div>

      <div class="footer-bottom">
        <div class="container bottom-inner">
          <p>© 2026 Commerce Hub Enterprise SPA. All rights reserved.</p>
          <p class="made-with">Built with Angular 19 Standalone & Clean Enterprise Design</p>
        </div>
      </div>
    </footer>
  `,
  styles: [`
    @use 'styles/variables' as *;
    @use 'styles/mixins' as *;

    .app-footer {
      background: #0f172a;
      color: #94a3b8;
      padding-top: 50px;
      margin-top: auto;
    }

    .footer-content {
      display: grid;
      grid-template-columns: 2fr 1fr 1.2fr 1.8fr;
      gap: 36px;
      padding-bottom: 40px;

      @media (max-width: $bp-lg) {
        grid-template-columns: 1fr 1fr;
      }

      @media (max-width: $bp-md) {
        grid-template-columns: 1fr;
      }
    }

    .brand-row {
      display: flex;
      align-items: center;
      gap: 10px;
      margin-bottom: 14px;
      color: #ffffff;
    }

    .logo-icon {
      font-size: 26px;
      color: $primary-400;
    }

    .brand-name {
      font-size: 1.35rem;
      font-weight: 800;
      letter-spacing: -0.02em;

      .highlight {
        color: $primary-400;
      }
    }

    .brand-desc {
      font-size: 0.875rem;
      line-height: 1.6;
      color: #94a3b8;
      margin-bottom: 18px;
    }

    .tech-stack-tags {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
    }

    .tech-tag {
      font-size: 0.6875rem;
      font-weight: 600;
      background: rgba(255, 255, 255, 0.08);
      color: #cbd5e1;
      padding: 3px 8px;
      border-radius: $radius-xs;
      border: 1px solid rgba(255, 255, 255, 0.1);
    }

    .col-title {
      color: #ffffff;
      font-size: 0.9375rem;
      font-weight: 700;
      margin-bottom: 16px;
      letter-spacing: 0.02em;
    }

    .col-links {
      list-style: none;
      display: flex;
      flex-direction: column;
      gap: 10px;

      a {
        font-size: 0.875rem;
        color: #94a3b8;
        transition: color $transition-fast;

        &:hover {
          color: $primary-400;
        }
      }
    }

    .arch-box {
      display: flex;
      flex-direction: column;
      gap: 10px;
    }

    .arch-item {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 0.8125rem;
      color: #cbd5e1;
      background: rgba(255, 255, 255, 0.04);
      padding: 8px 12px;
      border-radius: $radius-sm;
      border-left: 3px solid $primary-500;

      .material-icons-outlined {
        font-size: 16px;
        color: $accent-500;
      }
    }

    .footer-bottom {
      border-top: 1px solid rgba(255, 255, 255, 0.08);
      padding: 20px 0;
      font-size: 0.8125rem;
      color: #64748b;
    }

    .bottom-inner {
      @include flex-between;

      @media (max-width: $bp-sm) {
        flex-direction: column;
        gap: 8px;
        text-align: center;
      }
    }

    .made-with {
      color: #94a3b8;
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class FooterComponent {}
