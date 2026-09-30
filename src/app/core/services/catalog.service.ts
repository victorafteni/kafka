import { Injectable, inject, signal, computed } from '@angular/core';
import { ProductRepository } from '../repositories/product.repository';
import { EventBusService } from '../event-bus/event-bus.service';
import { TelemetryService } from './telemetry.service';
import { Product, ProductQueryOptions, PagedResult } from '../../shared/models/product.model';
import { Category } from '../../shared/models/category.model';

export interface CatalogState {
  products: PagedResult<Product>;
  categories: Category[];
  featuredProducts: Product[];
  popularProducts: Product[];
  selectedProduct: Product | null;
  relatedProducts: Product[];
  queryOptions: ProductQueryOptions;
  loading: boolean;
  error: string | null;
}

const initialPagedResult: PagedResult<Product> = {
  items: [],
  total: 0,
  page: 1,
  pageSize: 8,
  totalPages: 1
};

@Injectable({
  providedIn: 'root'
})
export class CatalogService {
  private productRepo = inject(ProductRepository);
  private eventBus = inject(EventBusService);
  private telemetry = inject(TelemetryService);

  private state = signal<CatalogState>({
    products: initialPagedResult,
    categories: [],
    featuredProducts: [],
    popularProducts: [],
    selectedProduct: null,
    relatedProducts: [],
    queryOptions: { page: 1, pageSize: 8, sortBy: 'featured' },
    loading: false,
    error: null
  });

  readonly products = computed(() => this.state().products.items);
  readonly pagedResult = computed(() => this.state().products);
  readonly totalProducts = computed(() => this.state().products.total);
  readonly currentPage = computed(() => this.state().products.page);
  readonly totalPages = computed(() => this.state().products.totalPages);
  readonly categories = computed(() => this.state().categories);
  readonly featuredProducts = computed(() => this.state().featuredProducts);
  readonly popularProducts = computed(() => this.state().popularProducts);
  readonly selectedProduct = computed(() => this.state().selectedProduct);
  readonly relatedProducts = computed(() => this.state().relatedProducts);
  readonly queryOptions = computed(() => this.state().queryOptions);
  readonly loading = computed(() => this.state().loading);
  readonly error = computed(() => this.state().error);

  constructor() {
    this.loadCategories();
    this.loadFeaturedAndPopular();
  }

  loadCategories(): void {
    this.productRepo.getCategories().subscribe({
      next: categories => {
        this.state.update(s => ({ ...s, categories }));
      },
      error: err => console.error('Failed to load categories', err)
    });
  }

  loadFeaturedAndPopular(): void {
    this.productRepo.getFeaturedProducts().subscribe({
      next: featuredProducts => {
        this.state.update(s => ({ ...s, featuredProducts }));
      }
    });

    this.productRepo.getPopularProducts().subscribe({
      next: popularProducts => {
        this.state.update(s => ({ ...s, popularProducts }));
      }
    });
  }

  loadProducts(options: ProductQueryOptions = {}): void {
    const mergedOptions: ProductQueryOptions = {
      ...this.state().queryOptions,
      ...options
    };

    this.state.update(s => ({ ...s, loading: true, error: null, queryOptions: mergedOptions }));

    this.productRepo.getProducts(mergedOptions).subscribe({
      next: paged => {
        this.state.update(s => ({
          ...s,
          products: paged,
          loading: false,
          error: null
        }));
      },
      error: err => {
        this.state.update(s => ({
          ...s,
          loading: false,
          error: err.message || 'Failed to fetch catalog products'
        }));
      }
    });
  }

  loadProductById(id: string): void {
    this.state.update(s => ({ ...s, loading: true, selectedProduct: null, error: null }));

    this.productRepo.getProductById(id).subscribe({
      next: product => {
        this.state.update(s => ({
          ...s,
          selectedProduct: product,
          loading: false,
          error: null
        }));

        if (product) {
          this.eventBus.emit('PRODUCT_VIEWED', {
            productId: product.id,
            productName: product.name,
            categoryId: product.categoryId,
            price: product.price
          }, product.id);

          this.productRepo.getRelatedProducts(product.id, product.categoryId).subscribe({
            next: relatedProducts => {
              this.state.update(s => ({ ...s, relatedProducts }));
            }
          });
        }
      },
      error: err => {
        this.state.update(s => ({
          ...s,
          loading: false,
          error: err.message || 'Product not found'
        }));
      }
    });
  }

  setPage(page: number): void {
    this.loadProducts({ page });
  }

  setSorting(sortBy: ProductQueryOptions['sortBy']): void {
    this.loadProducts({ sortBy, page: 1 });
  }

  setCategory(categoryId?: string): void {
    this.loadProducts({ categoryId, page: 1 });
  }
}

