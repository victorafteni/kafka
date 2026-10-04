import { Injectable, inject, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap, catchError, of } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface KafkaNavigationEvent {
  event_id: string;
  event_type: string;
  topic: string;
  partition: number;
  offset: number;
  key: string;
  session_id: string;
  anonymous_id?: string | null;
  user_id?: string | null;
  path: string;
  route: string;
  title: string;
  timestamp: string;
  payload: any;
  consumedAt: number;
}

export interface AnalyticsStats {
  totalViews: number;
  uniqueSessions: number;
  topRoute: string;
  topRouteCount: number;
  activeBrokers: number;
  activePartitions: number;
  routeDistribution: Record<string, number>;
  latestTimestamp: string | null;
  status: string;
}

export interface AnalyticsEventsResponse {
  success: boolean;
  topic: string;
  totalConsumed: number;
  stats: AnalyticsStats;
  events: KafkaNavigationEvent[];
}

@Injectable({
  providedIn: 'root'
})
export class AnalyticsMonitoringService {
  private http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/analytics`;

  readonly events = signal<KafkaNavigationEvent[]>([]);
  readonly stats = signal<AnalyticsStats>({
    totalViews: 0,
    uniqueSessions: 0,
    topRoute: 'None',
    topRouteCount: 0,
    activeBrokers: 1,
    activePartitions: 1,
    routeDistribution: {},
    latestTimestamp: null,
    status: 'ONLINE'
  });

  readonly isLoading = signal<boolean>(false);
  readonly error = signal<string | null>(null);
  readonly lastUpdated = signal<Date | null>(null);

  /**
   * Fetches real-time consumed events and statistics directly from backend Kafka consumer.
   */
  fetchEvents(): Observable<AnalyticsEventsResponse> {
    this.isLoading.set(true);
    return this.http.get<AnalyticsEventsResponse>(`${this.baseUrl}/events`).pipe(
      tap({
        next: (res) => {
          this.isLoading.set(false);
          this.error.set(null);
          this.lastUpdated.set(new Date());

          if (res && Array.isArray(res.events)) {
            // Guarantee descending order by timestamp
            const sorted = [...res.events].sort(
              (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
            );
            this.events.set(sorted);
          }

          if (res && res.stats) {
            this.stats.set(res.stats);
          }
        },
        error: (err) => {
          this.isLoading.set(false);
          this.error.set(err?.message || 'Nu s-a putut conecta la fluxul Kafka');
        }
      }),
      catchError((err) => {
        this.isLoading.set(false);
        this.error.set(err?.message || 'Eroare conexiune Kafka');
        return of({
          success: false,
          topic: 'page_views',
          totalConsumed: 0,
          stats: this.stats(),
          events: this.events()
        });
      })
    );
  }
}
