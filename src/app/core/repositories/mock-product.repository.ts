import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map, delay, shareReplay, of, catchError } from 'rxjs';
import { ProductRepository } from './product.repository';
import { Product, ProductQueryOptions, PagedResult } from '../../shared/models/product.model';
import { Category } from '../../shared/models/category.model';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class MockProductRepository extends ProductRepository {
  private http = inject(HttpClient);
  private productsCache$?: Observable<Product[]>;
  private categoriesCache$?: Observable<Category[]>;

  private loadProducts(): Observable<Product[]> {
    if (!this.productsCache$) {
      const url = `${environment.apiUrl}/products`;
      this.productsCache$ = this.http.get<Product[]>(url).pipe(
        catchError(err => {
          console.warn(`[PRODUCT REPO] Backend API error (${err.message}), using local mock fallback.`);
          return this.http.get<Product[]>('/mock/products.json').pipe(catchError(() => of([])));
        }),
        shareReplay(1)
      );
    }
    return this.productsCache$;
  }

  private loadCategories(): Observable<Category[]> {
    if (!this.categoriesCache$) {
      const url = `${environment.apiUrl}/categories`;
      this.categoriesCache$ = this.http.get<Category[]>(url).pipe(
        catchError(err => {
          console.warn(`[PRODUCT REPO] Backend API error (${err.message}), using local mock fallback.`);
          return this.http.get<Category[]>('/mock/categories.json').pipe(catchError(() => of([])));
        }),
        shareReplay(1)
      );
    }
    return this.categoriesCache$;
  }

  override getCategories(): Observable<Category[]> {
    return this.loadCategories().pipe(delay(50));
  }

  override getProducts(options: ProductQueryOptions = {}): Observable<PagedResult<Product>> {
    return this.loadProducts().pipe(
      map(products => {
        let filtered = [...products];

        if (options.search) {
          const q = options.search.toLowerCase();
          filtered = filtered.filter(p =>
            p.name.toLowerCase().includes(q) ||
            p.brand.toLowerCase().includes(q) ||
            p.description.toLowerCase().includes(q)
          );
        }

        if (options.categoryId) {
          filtered = filtered.filter(p => p.categoryId === options.categoryId);
        }

        if (options.brand && options.brand.length > 0) {
          filtered = filtered.filter(p => options.brand!.includes(p.brand));
        }

        if (options.minPrice !== undefined) {
          filtered = filtered.filter(p => p.price >= options.minPrice!);
        }
        if (options.maxPrice !== undefined) {
          filtered = filtered.filter(p => p.price <= options.maxPrice!);
        }

        if (options.minRating !== undefined) {
          filtered = filtered.filter(p => p.rating >= options.minRating!);
        }

        if (options.inStockOnly) {
          filtered = filtered.filter(p => p.stock > 0);
        }

        switch (options.sortBy) {
          case 'price-asc':
            filtered.sort((a, b) => a.price - b.price);
            break;
          case 'price-desc':
            filtered.sort((a, b) => b.price - a.price);
            break;
          case 'rating-desc':
            filtered.sort((a, b) => b.rating - a.rating);
            break;
          case 'newest':
            filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
            break;
          default:
            filtered.sort((a, b) => (b.featured ? 1 : 0) - (a.featured ? 1 : 0));
            break;
        }

        const page = options.page || 1;
        const pageSize = options.pageSize || 8;
        const total = filtered.length;
        const totalPages = Math.ceil(total / pageSize) || 1;
        const start = (page - 1) * pageSize;
        const items = filtered.slice(start, start + pageSize);

        return { items, total, page, pageSize, totalPages };
      }),
      delay(150)
    );
  }

  override getProductById(id: string): Observable<Product | null> {
    return this.loadProducts().pipe(
      map(products => products.find(p => p.id === id) || null),
      delay(100)
    );
  }

  override getFeaturedProducts(): Observable<Product[]> {
    return this.loadProducts().pipe(
      map(products => products.filter(p => p.featured).slice(0, 4)),
      delay(120)
    );
  }

  override getPopularProducts(): Observable<Product[]> {
    return this.loadProducts().pipe(
      map(products => products.filter(p => p.popular).slice(0, 4)),
      delay(120)
    );
  }

  override getRelatedProducts(productId: string, categoryId: string): Observable<Product[]> {
    return this.loadProducts().pipe(
      map(products => products.filter(p => p.id !== productId && p.categoryId === categoryId).slice(0, 4)),
      delay(100)
    );
  }
}

