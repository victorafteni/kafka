import { Injectable, signal, computed } from '@angular/core';
import { PageViewPayload } from '../../shared/models/event.model';

export interface ConsumedPageViewRecord {
  id: string;
  topic: string;
  partition: number;
  offset: number;
  key: string;
  payload: PageViewPayload;
  consumedAt: number;
  processingLagMs: number;
}

export interface PathMetric {
  path: string;
  title: string;
  views: number;
  percentage: number;
}

@Injectable({
  providedIn: 'root'
})
export class AnalyticsStoreService {
  readonly totalPageViews = signal<number>(142);
  readonly uniqueSessionsCount = signal<number>(38);
  readonly pageViewsByPath = signal<Record<string, number>>({
    '/': 58,
    '/products': 47,
    '/cart': 19,
    '/checkout': 8,
    '/monitoring': 10
  });

  readonly recentPageViews = signal<ConsumedPageViewRecord[]>([
    {
      id: 'pv-init-001',
      topic: 'page_views',
      partition: 0,
      offset: 1042,
      key: 'sess-usr-init',
      payload: {
        url: '/products',
        path: '/products',
        title: 'Product Catalog | CommerceHub',
        referrer: 'direct',
        sessionId: 'sess-alpha-001',
        language: 'ro-RO',
        timestamp: new Date(Date.now() - 45000).toISOString()
      },
      consumedAt: Date.now() - 44950,
      processingLagMs: 5
    },
    {
      id: 'pv-init-002',
      topic: 'page_views',
      partition: 0,
      offset: 1043,
      key: 'sess-usr-init',
      payload: {
        url: '/cart',
        path: '/cart',
        title: 'Shopping Cart | CommerceHub',
        referrer: '/products',
        sessionId: 'sess-alpha-001',
        language: 'ro-RO',
        timestamp: new Date(Date.now() - 25000).toISOString()
      },
      consumedAt: Date.now() - 24960,
      processingLagMs: 4
    }
  ]);

  readonly topPages = computed<PathMetric[]>(() => {
    const paths = this.pageViewsByPath();
    const total = this.totalPageViews() || 1;
    return Object.entries(paths)
      .map(([path, count]) => ({
        path,
        title: this.getPathDisplayTitle(path),
        views: count,
        percentage: Math.round((count / total) * 100)
      }))
      .sort((a, b) => b.views - a.views);
  });

  private knownSessions = new Set<string>(['sess-alpha-001', 'sess-beta-002']);

  recordConsumedPageView(record: ConsumedPageViewRecord): void {
    this.totalPageViews.update(count => count + 1);

    if (record.payload.sessionId && !this.knownSessions.has(record.payload.sessionId)) {
      this.knownSessions.add(record.payload.sessionId);
      this.uniqueSessionsCount.set(this.knownSessions.size);
    }

    const path = record.payload.path || '/';
    this.pageViewsByPath.update(map => ({
      ...map,
      [path]: (map[path] || 0) + 1
    }));

    this.recentPageViews.update(list => [record, ...list.slice(0, 49)]);

    console.log(
      `%c[DATABASE / ANALYTICS]%c Stored page_view event for %c${path}%c (Offset: ${record.offset})`,
      'color: #8b5cf6; font-weight: bold;',
      'color: inherit;',
      'color: #ec4899; font-weight: bold;',
      'color: inherit;',
      record
    );
  }

  private getPathDisplayTitle(path: string): string {
    if (path === '/') return 'Home Page';
    if (path === '/products') return 'Catalog (Telefoane & Accesorii)';
    if (path === '/cart') return 'Coș de cumpărături';
    if (path === '/checkout') return 'Checkout & Plată';
    if (path === '/orders') return 'Istoric Comenzi';
    if (path === '/monitoring') return 'Kafka Observability';
    return path;
  }
}
