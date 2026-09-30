import { Component, ChangeDetectionStrategy, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { SearchFacade } from './search.facade';
import { CartFacade } from '../cart/cart.facade';
import { Product } from '../../shared/models/product.model';
import { AppProductCardComponent } from '../../shared/components/app-product-card/app-product-card.component';
import { AppFilterPanelComponent } from '../../shared/components/app-filter-panel/app-filter-panel.component';
import { AppSpinnerComponent } from '../../shared/components/app-spinner/app-spinner.component';
import { AppEmptyStateComponent } from '../../shared/components/app-empty-state/app-empty-state.component';
import { TranslatePipe } from '../../core/i18n/translate.pipe';

@Component({
  selector: 'app-search',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    AppProductCardComponent,
    AppFilterPanelComponent,
    AppSpinnerComponent,
    AppEmptyStateComponent,
    TranslatePipe
  ],
  template: `
    <div class="search-page">
      <div class="container">
        <div class="search-header">
          <div class="header-text">
            <h1 class="page-title">
              @if (query()) {
                {{ 'SEARCH.RESULTS_FOR' | translate }} <span class="highlight">"{{ query() }}"</span>
              } @else {
                {{ 'CATALOG.TITLE' | translate }}
              }
            </h1>
            <p class="search-meta">
              <strong>{{ totalHits() }}</strong> {{ 'CATALOG.RESULTS_FOUND' | translate }} in
              <span class="latency-badge">{{ processingTimeMs() }} ms</span>
              (Algolia Engine Simulation)
            </p>
          </div>
        </div>

        <div class="search-layout">
          <div class="sidebar-wrapper">
            <app-filter-panel
              [facets]="facets()"
              [activeFilters]="activeFacets()"
              [hasActiveFilters]="hasActiveFilters()"
              (filterChange)="onFilterChange($event)"
              (resetAll)="onResetFilters()">
            </app-filter-panel>
          </div>

          <div class="results-content">
            @if (loading()) {
              <div class="loading-box">
                <app-spinner [label]="'COMMON.LOADING' | translate"></app-spinner>
              </div>
            } @else if (results().length === 0) {
              <app-empty-state
                [title]="'SEARCH.NO_RESULTS' | translate"
                [description]="'SEARCH.NO_RESULTS_DESC' | translate"
                [actionLabel]="'COMMON.CLEAR_ALL' | translate"
                (actionClicked)="onResetFilters()">
              </app-empty-state>
            } @else {
              <div class="results-grid">
                @for (prod of results(); track prod.id) {
                  <app-product-card
                    [product]="prod"
                    (addToCart)="onAddToCart($event)">
                  </app-product-card>
                }
              </div>
            }
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    @use 'styles/variables' as *;
    @use 'styles/mixins' as *;

    .search-page {
      padding: 32px 0 60px;
    }

    .search-header {
      margin-bottom: 32px;
      padding-bottom: 20px;
      border-bottom: 1px solid $gray-200;
    }

    .page-title {
      font-size: 2rem;
      font-weight: 800;
      letter-spacing: -0.02em;
      color: $gray-900;

      .highlight {
        color: $primary-600;
      }
    }

    .search-meta {
      font-size: 0.875rem;
      color: $gray-500;
      margin-top: 6px;
      display: flex;
      align-items: center;
      gap: 6px;
    }

    .latency-badge {
      display: inline-block;
      padding: 1px 6px;
      border-radius: $radius-xs;
      background: #ecfeff;
      color: #0891b2;
      font-weight: 700;
      font-size: 0.75rem;
      font-family: 'JetBrains Mono', monospace;
    }

    .search-layout {
      display: grid;
      grid-template-columns: 280px 1fr;
      gap: 32px;
      align-items: start;

      @media (max-width: $bp-lg) {
        grid-template-columns: 1fr;
      }
    }

    .sidebar-wrapper {
      position: sticky;
      top: 90px;
    }

    .results-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
      gap: 20px;
    }

    .loading-box {
      padding: 60px 0;
      display: flex;
      justify-content: center;
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SearchComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private searchFacade = inject(SearchFacade);
  private cartFacade = inject(CartFacade);

  readonly query = this.searchFacade.query;
  readonly results = this.searchFacade.results;
  readonly totalHits = this.searchFacade.totalHits;
  readonly facets = this.searchFacade.facets;
  readonly activeFacets = this.searchFacade.activeFacets;
  readonly processingTimeMs = this.searchFacade.processingTimeMs;
  readonly loading = this.searchFacade.loading;
  readonly hasActiveFilters = this.searchFacade.hasActiveFilters;

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      const q = params['q'] || '';
      this.searchFacade.executeSearch(q);
    });
  }

  onFilterChange(change: { facetId: string; selectedValues: string[] }): void {
    this.searchFacade.setFacet(change.facetId, change.selectedValues);
  }

  onResetFilters(): void {
    this.searchFacade.resetFilters();
  }

  onAddToCart(product: Product): void {
    this.cartFacade.addToCart(product, 1);
  }
}

