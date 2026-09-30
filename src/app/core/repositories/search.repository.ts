import { Observable } from 'rxjs';
import { SearchResult, SearchSuggestion, FacetGroup } from '../../shared/models/facet.model';
import { Product } from '../../shared/models/product.model';

export abstract class SearchRepository {
  abstract search(query: string, activeFacets?: Record<string, string[]>): Observable<SearchResult<Product>>;
  abstract getSuggestions(query: string): Observable<SearchSuggestion[]>;
  abstract getFacets(): Observable<FacetGroup[]>;
}

