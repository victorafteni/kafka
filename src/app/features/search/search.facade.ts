import { Injectable, inject } from '@angular/core';
import { SearchService } from '../../core/services/search.service';

@Injectable({
  providedIn: 'root'
})
export class SearchFacade {
  private searchService = inject(SearchService);

  readonly query = this.searchService.query;
  readonly results = this.searchService.results;
  readonly totalHits = this.searchService.totalHits;
  readonly facets = this.searchService.facets;
  readonly activeFacets = this.searchService.activeFacets;
  readonly processingTimeMs = this.searchService.processingTimeMs;
  readonly loading = this.searchService.loading;
  readonly error = this.searchService.error;
  readonly hasActiveFilters = this.searchService.hasActiveFilters;

  executeSearch(query: string): void {
    this.searchService.search(query);
  }

  setFacet(facetId: string, selectedValues: string[]): void {
    this.searchService.setFacet(facetId, selectedValues);
  }

  resetFilters(): void {
    this.searchService.resetFilters();
  }
}
