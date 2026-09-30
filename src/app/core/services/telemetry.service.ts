import { Injectable, signal, computed } from '@angular/core';

export interface TelemetryMetrics {
  apiRequests: number;
  searchRequests: number;
  cartEvents: number;
  errors: number;
  averageResponseTimeMs: number;
  totalLatencySumMs: number;
  latencySamplesCount: number;
}

@Injectable({
  providedIn: 'root'
})
export class TelemetryService {
  private metricsState = signal<TelemetryMetrics>({
    apiRequests: 1248,
    searchRequests: 482,
    cartEvents: 120,
    errors: 3,
    averageResponseTimeMs: 112,
    totalLatencySumMs: 139776,
    latencySamplesCount: 1248
  });

  readonly metrics = computed(() => this.metricsState());
  readonly apiRequests = computed(() => this.metricsState().apiRequests);
  readonly searchRequests = computed(() => this.metricsState().searchRequests);
  readonly cartEvents = computed(() => this.metricsState().cartEvents);
  readonly errors = computed(() => this.metricsState().errors);
  readonly averageResponseTime = computed(() => this.metricsState().averageResponseTimeMs);

  recordApiRequest(durationMs: number, isError = false): void {
    this.metricsState.update(state => {
      const apiRequests = state.apiRequests + 1;
      const errors = isError ? state.errors + 1 : state.errors;
      const totalLatencySumMs = state.totalLatencySumMs + durationMs;
      const latencySamplesCount = state.latencySamplesCount + 1;
      const averageResponseTimeMs = Math.round(totalLatencySumMs / latencySamplesCount);

      return {
        ...state,
        apiRequests,
        errors,
        totalLatencySumMs,
        latencySamplesCount,
        averageResponseTimeMs
      };
    });
  }

  recordSearchRequest(): void {
    this.metricsState.update(s => ({
      ...s,
      searchRequests: s.searchRequests + 1
    }));
  }

  recordCartEvent(): void {
    this.metricsState.update(s => ({
      ...s,
      cartEvents: s.cartEvents + 1
    }));
  }
}
