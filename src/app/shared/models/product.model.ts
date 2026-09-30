export interface ProductAttribute {
  name: string;
  value: string;
}

export interface Product {
  id: string;
  sku: string;
  name: string;
  description: string;
  categoryId: string;
  categoryName: string;
  brand: string;

  price: number;
  originalPrice?: number;
  currency: string;

  stock: number;

  rating: number;
  reviewCount: number;

  images: string[];
  thumbnail: string;

  attributes: ProductAttribute[];

  featured?: boolean;
  popular?: boolean;

  createdAt: string;
  updatedAt: string;
}

export interface ProductQueryOptions {
  search?: string;
  categoryId?: string;
  brand?: string[];
  minPrice?: number;
  maxPrice?: number;
  minRating?: number;
  inStockOnly?: boolean;
  sortBy?: 'featured' | 'price-asc' | 'price-desc' | 'rating-desc' | 'newest';
  page?: number;
  pageSize?: number;
}

export interface PagedResult<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

