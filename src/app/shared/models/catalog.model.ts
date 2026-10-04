import { Product } from './product.model';
import { Category } from './category.model';

export interface CatalogResponse {
  products: Product[];
  categories: Category[];
  _meta?: {
    productsSource: string;
    categoriesSource: string;
    retrievedAt: string;
  };
}
