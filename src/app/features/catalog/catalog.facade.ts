import { Injectable, inject } from '@angular/core';
import { CatalogService } from '../../core/services/catalog.service';
import { ProductQueryOptions } from '../../shared/models/product.model';

@Injectable({
  providedIn: 'root'
})
export class CatalogFacade {
  private catalogService = inject(CatalogService);

  readonly products = this.catalogService.products;
  readonly pagedResult = this.catalogService.pagedResult;
  readonly totalProducts = this.catalogService.totalProducts;
  readonly currentPage = this.catalogService.currentPage;
  readonly totalPages = this.catalogService.totalPages;
  readonly categories = this.catalogService.categories;
  readonly featuredProducts = this.catalogService.featuredProducts;
  readonly popularProducts = this.catalogService.popularProducts;
  readonly selectedProduct = this.catalogService.selectedProduct;
  readonly relatedProducts = this.catalogService.relatedProducts;
  readonly queryOptions = this.catalogService.queryOptions;
  readonly loading = this.catalogService.loading;
  readonly error = this.catalogService.error;

  loadProducts(options?: ProductQueryOptions): void {
    this.catalogService.loadProducts(options);
  }

  loadProductById(id: string): void {
    this.catalogService.loadProductById(id);
  }

  setPage(page: number): void {
    this.catalogService.setPage(page);
  }

  setSorting(sortBy: ProductQueryOptions['sortBy']): void {
    this.catalogService.setSorting(sortBy);
  }

  filterByCategory(categoryId?: string): void {
    this.catalogService.setCategory(categoryId);
  }
}

