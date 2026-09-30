import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map, delay, of, catchError } from 'rxjs';
import { SearchRepository } from './search.repository';
import { SearchResult, SearchSuggestion, FacetGroup } from '../../shared/models/facet.model';
import { Product } from '../../shared/models/product.model';

@Injectable({
  providedIn: 'root'
})
export class MockSearchRepository extends SearchRepository {
  private http = inject(HttpClient);

  private loadProducts(): Observable<Product[]> {
    return this.http.get<Product[]>('/mock/products.json').pipe(
      catchError(() => of([]))
    );
  }

  override search(query: string, activeFacets: Record<string, string[]> = {}): Observable<SearchResult<Product>> {
    const startTime = performance.now();
    const cleanQuery = (query || '').trim().toLowerCase();

    return this.loadProducts().pipe(
      map(products => {
        let hits = products.filter(p => {
          if (!cleanQuery) return true;
          return (
            p.name.toLowerCase().includes(cleanQuery) ||
            p.brand.toLowerCase().includes(cleanQuery) ||
            p.categoryName.toLowerCase().includes(cleanQuery) ||
            p.description.toLowerCase().includes(cleanQuery)
          );
        });

        const brandCounts = new Map<string, number>();
        products.forEach(p => {
          brandCounts.set(p.brand, (brandCounts.get(p.brand) || 0) + 1);
        });

        if (activeFacets['brand'] && activeFacets['brand'].length > 0) {
          hits = hits.filter(p => activeFacets['brand'].includes(p.brand));
        }

        if (activeFacets['category'] && activeFacets['category'].length > 0) {
          hits = hits.filter(p => activeFacets['category'].includes(p.categoryId));
        }

        if (activeFacets['price'] && activeFacets['price'].length > 0) {
          const selected = activeFacets['price'][0];
          if (selected === 'under-500') hits = hits.filter(p => p.price < 500);
          else if (selected === '500-1000') hits = hits.filter(p => p.price >= 500 && p.price <= 1000);
          else if (selected === '1000-2000') hits = hits.filter(p => p.price > 1000 && p.price <= 2000);
          else if (selected === 'over-2000') hits = hits.filter(p => p.price > 2000);
        }

        if (activeFacets['rating'] && activeFacets['rating'].length > 0) {
          const minRating = Math.max(...activeFacets['rating'].map(Number));
          hits = hits.filter(p => p.rating >= minRating);
        }

        const facets: FacetGroup[] = [
          {
            id: 'brand',
            name: 'Brand',
            type: 'checkbox',
            values: Array.from(brandCounts.entries()).map(([brand, count]) => ({
              label: brand,
              value: brand,
              count,
              selected: activeFacets['brand']?.includes(brand) ?? false
            }))
          },
          {
            id: 'price',
            name: 'Price Range',
            type: 'radio',
            values: [
              { label: '< €500', value: 'under-500', count: products.filter(p => p.price < 500).length, selected: activeFacets['price']?.includes('under-500') },
              { label: '€500 - €1,000', value: '500-1000', count: products.filter(p => p.price >= 500 && p.price <= 1000).length, selected: activeFacets['price']?.includes('500-1000') },
              { label: '€1,000 - €2,000', value: '1000-2000', count: products.filter(p => p.price > 1000 && p.price <= 2000).length, selected: activeFacets['price']?.includes('1000-2000') },
              { label: '> €2,000', value: 'over-2000', count: products.filter(p => p.price > 2000).length, selected: activeFacets['price']?.includes('over-2000') }
            ]
          },
          {
            id: 'rating',
            name: 'Customer Rating',
            type: 'checkbox',
            values: [
              { label: '4★ and above', value: '4', count: products.filter(p => p.rating >= 4).length, selected: activeFacets['rating']?.includes('4') },
              { label: '4.5★ and above', value: '4.5', count: products.filter(p => p.rating >= 4.5).length, selected: activeFacets['rating']?.includes('4.5') }
            ]
          }
        ];

        const processingTimeMs = Math.round(performance.now() - startTime + 35);

        return {
          hits,
          totalHits: hits.length,
          facets,
          processingTimeMs,
          query
        };
      }),
      delay(75)
    );
  }

  override getSuggestions(query: string): Observable<SearchSuggestion[]> {
    const q = (query || '').trim().toLowerCase();
    if (!q || q.length < 2) {
      return of([]);
    }

    return this.loadProducts().pipe(
      map(products => {
        const suggestions: SearchSuggestion[] = [];

        const matchedProducts = products.filter(p => p.name.toLowerCase().includes(q)).slice(0, 4);
        matchedProducts.forEach(p => {
          suggestions.push({
            query: p.name,
            highlighted: p.name,
            category: p.categoryName,
            type: 'product'
          });
        });

        const matchedCategories = Array.from(new Set(products.map(p => p.categoryName)))
          .filter(c => c.toLowerCase().includes(q))
          .slice(0, 2);

        matchedCategories.forEach(c => {
          suggestions.push({
            query: c,
            highlighted: c,
            type: 'category'
          });
        });

        const popularTokens = ['laptop gaming', 'ultrabook lenovo', 'apple macbook pro', 'headphones anc', '4k monitor'];
        popularTokens.filter(item => item.includes(q) && !suggestions.some(s => s.query.toLowerCase() === item))
          .slice(0, 2)
          .forEach(item => {
            suggestions.push({
              query: item,
              highlighted: item,
              type: 'popular'
            });
          });

        return suggestions;
      }),
      delay(50)
    );
  }

  override getFacets(): Observable<FacetGroup[]> {
    return this.search('').pipe(map(res => res.facets));
  }
}
