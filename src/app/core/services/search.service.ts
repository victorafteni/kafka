import { Injectable, inject, signal, computed } from '@angular/core';
import { SearchRepository } from '../repositories/search.repository';
import { EventBusService } from '../event-bus/event-bus.service';
import { TelemetryService } from './telemetry.service';
import { Product } from '../../shared/models/product.model';
import { FacetGroup } from '../../shared/models/facet.model';

export interface SearchState {
  query: string;
  results: Product[];
  totalHits: number;
  facets: FacetGroup[];
  activeFacets: Record<string, string[]>;
  processingTimeMs: number;
  loading: boolean;
  error: string | null;
}

@Injectable({
  providedIn: 'root'
})
export class SearchService {
  private searchRepo = inject(SearchRepository);
  private eventBus = inject(EventBusService);
  private telemetry = inject(TelemetryService);

  private state = signal<SearchState>({
    query: '',
    results: [],
    totalHits: 0,
    facets: [],
    activeFacets: {},
    processingTimeMs: 0,
    loading: false,
    error: null
  });

  readonly query = computed(() => this.state().query);
  readonly results = computed(() => this.state().results);
  readonly totalHits = computed(() => this.state().totalHits);
  readonly facets = computed(() => this.state().facets);
  readonly activeFacets = computed(() => this.state().activeFacets);
  readonly processingTimeMs = computed(() => this.state().processingTimeMs);
  readonly loading = computed(() => this.state().loading);
  readonly error = computed(() => this.state().error);
  readonly hasActiveFilters = computed(() => {
    const filters = this.state().activeFacets;
    return Object.values(filters).some(arr => arr.length > 0);
  });

  search(query: string, activeFacets?: Record<string, string[]>): void {
    const currentFacets = activeFacets !== undefined ? activeFacets : this.state().activeFacets;
    this.state.update(s => ({
      ...s,
      query,
      activeFacets: currentFacets,
      loading: true,
      error: null
    }));

    this.telemetry.recordSearchRequest();

    this.searchRepo.search(query, currentFacets).subscribe({
      next: response => {
        this.state.update(s => ({
          ...s,
          results: response.hits,
          totalHits: response.totalHits,
          facets: response.facets,
          processingTimeMs: response.processingTimeMs,
          loading: false,
          error: null
        }));

        this.eventBus.emit('PRODUCT_SEARCHED', {
          query,
          totalHits: response.totalHits,
          facetsSelected: currentFacets
        }, query || 'all');
      },
      error: err => {
        this.state.update(s => ({
          ...s,
          loading: false,
          error: err.message || 'Search execution failed'
        }));
      }
    });
  }

  setFacet(facetId: string, selectedValues: string[]): void {
    const updated = {
      ...this.state().activeFacets,
      [facetId]: selectedValues
    };
    if (selectedValues.length === 0) {
      delete updated[facetId];
    }
    this.search(this.state().query, updated);
  }

  resetFilters(): void {
    this.search(this.state().query, {});
  }
}
