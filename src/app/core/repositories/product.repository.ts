import { Observable } from 'rxjs';
import { Product, ProductQueryOptions, PagedResult } from '../../shared/models/product.model';
import { Category } from '../../shared/models/category.model';

export abstract class ProductRepository {
  abstract getProducts(options?: ProductQueryOptions): Observable<PagedResult<Product>>;
  abstract getProductById(id: string): Observable<Product | null>;
  abstract getCategories(): Observable<Category[]>;
  abstract getFeaturedProducts(): Observable<Product[]>;
  abstract getPopularProducts(): Observable<Product[]>;
  abstract getRelatedProducts(productId: string, categoryId: string): Observable<Product[]>;
}

