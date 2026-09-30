import { Component, ChangeDetectionStrategy, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { CatalogFacade } from './catalog.facade';
import { CartFacade } from '../cart/cart.facade';
import { SearchFacade } from '../search/search.facade';
import { Product, ProductQueryOptions } from '../../shared/models/product.model';
import { AppProductCardComponent } from '../../shared/components/app-product-card/app-product-card.component';
import { AppFilterPanelComponent } from '../../shared/components/app-filter-panel/app-filter-panel.component';
import { AppPaginationComponent } from '../../shared/components/app-pagination/app-pagination.component';
import { AppSpinnerComponent } from '../../shared/components/app-spinner/app-spinner.component';
import { AppEmptyStateComponent } from '../../shared/components/app-empty-state/app-empty-state.component';
import { AppErrorStateComponent } from '../../shared/components/app-error-state/app-error-state.component';

import { TranslatePipe } from '../../core/i18n/translate.pipe';

@Component({
  selector: 'app-catalog',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    AppProductCardComponent,
    AppFilterPanelComponent,
    AppPaginationComponent,
    AppSpinnerComponent,
    AppEmptyStateComponent,
    AppErrorStateComponent,
    TranslatePipe
  ],
  template: `
    <div class="catalog-page">
      <div class="container">
        <div class="catalog-header">
          <div>
            <nav class="breadcrumb">
              <a routerLink="/">{{ 'NAV.HOME' | translate }}</a>
              <span class="sep">/</span>
              <span class="current">{{ 'NAV.PRODUCTS' | translate }}</span>
            </nav>
            <h1 class="page-title">{{ 'CATALOG.TITLE' | translate }}</h1>
            <p class="results-summary">
              {{ totalProducts() }} {{ 'CATALOG.RESULTS_FOUND' | translate }}
            </p>
          </div>

          <div class="header-controls">
            <div class="sort-box">
              <label for="sortSelect">{{ 'CATALOG.SORT_BY' | translate }}</label>
              <select
                id="sortSelect"
                [value]="queryOptions().sortBy || 'featured'"
                (change)="onSortChange($event)">
                <option value="featured">{{ 'CATALOG.SORT_FEATURED' | translate }}</option>
                <option value="price-asc">{{ 'CATALOG.SORT_PRICE_ASC' | translate }}</option>
                <option value="price-desc">{{ 'CATALOG.SORT_PRICE_DESC' | translate }}</option>
                <option value="rating-desc">{{ 'CATALOG.SORT_RATING' | translate }}</option>
                <option value="newest">{{ 'CATALOG.SORT_NEWEST' | translate }}</option>
              </select>
            </div>

            <div class="view-switch">
              <button
                type="button"
                [class.active]="viewMode() === 'grid'"
                (click)="viewMode.set('grid')"
                [title]="'CATALOG.VIEW_GRID' | translate">
                <span class="material-icons-outlined">grid_view</span>
              </button>
              <button
                type="button"
                [class.active]="viewMode() === 'list'"
                (click)="viewMode.set('list')"
                [title]="'CATALOG.VIEW_LIST' | translate">
                <span class="material-icons-outlined">view_list</span>
              </button>
            </div>
          </div>
        </div>

        <div class="catalog-layout">
          <div class="sidebar-wrapper">
            <app-filter-panel
              [facets]="searchFacade.facets()"
              [activeFilters]="searchFacade.activeFacets()"
              [hasActiveFilters]="searchFacade.hasActiveFilters()"
              (filterChange)="onFilterChange($event)"
              (resetAll)="onResetFilters()">
            </app-filter-panel>
          </div>

          <div class="catalog-content">
            @if (loading()) {
              <div class="loading-state-wrapper">
                <app-spinner [label]="'COMMON.LOADING' | translate"></app-spinner>
              </div>
            } @else if (error()) {
              <app-error-state
                [message]="error()!"
                (retry)="reload()">
              </app-error-state>
            } @else if (products().length === 0) {
              <app-empty-state
                [title]="'CATALOG.NO_PRODUCTS' | translate"
                [description]="'CATALOG.NO_PRODUCTS_DESC' | translate"
                [actionLabel]="'COMMON.CLEAR_ALL' | translate"
                (actionClicked)="onResetFilters()">
              </app-empty-state>
            } @else {
              <div [class]="'products-container ' + viewMode() + '-layout'">
                @for (prod of products(); track prod.id) {
                  <app-product-card
                    [product]="prod"
                    [viewMode]="viewMode()"
                    (addToCart)="onAddToCart($event)">
                  </app-product-card>
                }
              </div>

              @if (totalPages() > 1) {
                <app-pagination
                  [page]="currentPage()"
                  [totalPages]="totalPages()"
                  (pageChange)="onPageChange($event)">
                </app-pagination>
              }
            }
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    @use 'styles/variables' as *;
    @use 'styles/mixins' as *;

    .catalog-page {
      padding: 32px 0 60px;
    }

    .breadcrumb {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 0.8125rem;
      color: $gray-500;
      margin-bottom: 8px;

      a:hover {
        color: $primary-600;
      }

      .current {
        color: $gray-800;
        font-weight: 600;
      }
    }

    .catalog-header {
      @include flex-between;
      margin-bottom: 32px;
      padding-bottom: 20px;
      border-bottom: 1px solid $gray-200;

      @media (max-width: $bp-md) {
        flex-direction: column;
        align-items: flex-start;
        gap: 16px;
      }
    }

    .page-title {
      font-size: 2rem;
      font-weight: 800;
      letter-spacing: -0.02em;
      color: $gray-900;
    }

    .results-summary {
      font-size: 0.875rem;
      color: $gray-500;
      margin-top: 4px;
    }

    .header-controls {
      display: flex;
      align-items: center;
      gap: 16px;
    }

    .sort-box {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 0.875rem;
      color: $gray-600;
      font-weight: 500;

      select {
        padding: 8px 12px;
        border-radius: $radius-md;
        border: 1px solid $gray-200;
        background: #ffffff;
        color: $gray-800;
        font-size: 0.875rem;
        outline: none;
        cursor: pointer;

        &:focus {
          border-color: $primary-500;
        }
      }
    }

    .view-switch {
      display: flex;
      border: 1px solid $gray-200;
      border-radius: $radius-md;
      overflow: hidden;
      background: #ffffff;

      button {
        padding: 6px 10px;
        display: flex;
        align-items: center;
        color: $gray-500;
        transition: all $transition-fast;

        &.active {
          background: $primary-50;
          color: $primary-600;
        }

        &:hover:not(.active) {
          background: $gray-100;
        }

        .material-icons-outlined {
          font-size: 20px;
        }
      }
    }

    .catalog-layout {
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

    .products-container {
      &.grid-layout {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
        gap: 20px;
      }

      &.list-layout {
        display: flex;
        flex-direction: column;
        gap: 16px;
      }
    }

    .loading-state-wrapper {
      padding: 60px 0;
      display: flex;
      justify-content: center;
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CatalogComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private catalogFacade = inject(CatalogFacade);
  private cartFacade = inject(CartFacade);
  readonly searchFacade = inject(SearchFacade);

  readonly products = this.catalogFacade.products;
  readonly totalProducts = this.catalogFacade.totalProducts;
  readonly currentPage = this.catalogFacade.currentPage;
  readonly totalPages = this.catalogFacade.totalPages;
  readonly queryOptions = this.catalogFacade.queryOptions;
  readonly loading = this.catalogFacade.loading;
  readonly error = this.catalogFacade.error;

  viewMode = signal<'grid' | 'list'>('grid');

  ngOnInit(): void {
    this.searchFacade.executeSearch('');

    this.route.queryParams.subscribe(params => {
      const categoryId = params['categoryId'];
      this.catalogFacade.loadProducts({
        categoryId,
        page: 1
      });
    });
  }

  onSortChange(event: Event): void {
    const value = (event.target as HTMLSelectElement).value as ProductQueryOptions['sortBy'];
    this.catalogFacade.setSorting(value);
  }

  onPageChange(page: number): void {
    this.catalogFacade.setPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  onFilterChange(change: { facetId: string; selectedValues: string[] }): void {
    this.searchFacade.setFacet(change.facetId, change.selectedValues);

    const brandFilters = change.facetId === 'brand' ? change.selectedValues : this.searchFacade.activeFacets()['brand'];
    this.catalogFacade.loadProducts({
      brand: brandFilters && brandFilters.length > 0 ? brandFilters : undefined,
      page: 1
    });
  }

  onResetFilters(): void {
    this.searchFacade.resetFilters();
    this.catalogFacade.loadProducts({
      brand: undefined,
      categoryId: undefined,
      minPrice: undefined,
      maxPrice: undefined,
      page: 1
    });
  }

  onAddToCart(product: Product): void {
    this.cartFacade.addToCart(product, 1);
  }

  reload(): void {
    this.catalogFacade.loadProducts();
  }
}

