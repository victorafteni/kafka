import { Injectable, inject, signal } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { filter } from 'rxjs/operators';
import { Observable, of } from 'rxjs';
import { PageViewPayload } from '../../shared/models/event.model';
import { AnalyticsRepository, IngestedKafkaRecord } from '../repositories/analytics.repository';
import { AuthService } from '../auth/auth.service';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class TrackingService {
  private router = inject(Router);
  private http = inject(HttpClient, { optional: true });
  private analyticsRepo = inject(AnalyticsRepository, { optional: true });
  private authService = inject(AuthService, { optional: true });

  private readonly SESSION_STORAGE_KEY = 'commerce_hub_session_id';
  private readonly ANON_STORAGE_KEY = 'commerce_hub_anon_id';

  readonly sessionId = this.getOrCreateSessionId();
  readonly anonymousId = this.getOrCreateAnonymousId();

  // Reactive state signals
  readonly lastTrackedPageView = signal<PageViewPayload | null>(null);
  readonly totalTrackedCount = signal<number>(0);
  readonly isTrackingEnabled = signal<boolean>(true);

  private lastTrackedPath = '';

  constructor() {
    this.initAutoPageTracking();
  }

  private initAutoPageTracking(): void {
    // 1. Ascultă navigările între pagini ale router-ului Angular
    this.router.events.pipe(
      filter((event): event is NavigationEnd => event instanceof NavigationEnd)
    ).subscribe((nav: NavigationEnd) => {
      if (this.isTrackingEnabled()) {
        this.captureAndSendPageView(nav.urlAfterRedirects || nav.url);
      }
    });

    // 2. Capturează ruta inițială la pornirea aplicației
    setTimeout(() => {
      if (this.isTrackingEnabled() && this.totalTrackedCount() === 0 && this.router.url) {
        this.captureAndSendPageView(this.router.url);
      }
    }, 150);
  }

  trackPageView(custom?: Partial<PageViewPayload>): Observable<IngestedKafkaRecord> {
    const currentUrl = this.router.url;
    const payload = this.buildPageViewPayload(currentUrl, custom);
    return this.sendToBackendApi(payload);
  }

  private captureAndSendPageView(url: string): void {
    if (!url) return;
    const [pathPart] = url.split('?');
    const path = pathPart || '/';

    // Evită transmiterea dublă a aceleiași rute consecutive
    if (this.lastTrackedPath === path && this.totalTrackedCount() > 0) {
      return;
    }
    this.lastTrackedPath = path;

    const payload = this.buildPageViewPayload(url);
    this.sendToBackendApi(payload).subscribe();
  }

  private sendToBackendApi(payload: PageViewPayload): Observable<IngestedKafkaRecord> {
    this.lastTrackedPageView.set(payload);
    this.totalTrackedCount.update(c => c + 1);

    console.log(
      `%c[TRACKING SERVICE]%c Page View captured: %c${payload.path}%c (Topic: shop.analytics.page_views)`,
      'color: #10b981; font-weight: bold;',
      'color: inherit;',
      'color: #3b82f6; font-weight: bold;',
      'color: inherit;',
      payload
    );

    // 1. Postare HTTP non-blocking direct către Backend Express Kafka API (/api/analytics/page-view)
    if (this.http) {
      const endpointUrl = `${environment.apiUrl}/analytics/page-view`;
      this.http.post(endpointUrl, {
        path: payload.path,
        route: payload.path.replace(/^\//, '') || 'home',
        title: payload.title,
        session_id: payload.sessionId,
        anonymous_id: this.anonymousId,
        referrer: payload.referrer,
        user_id: payload.userId
      }).subscribe({
        next: (res) => {
          console.log(
            `%c[KAFKA INGESTION SUCCESS]%c Event stored in Kafka:`,
            'color: #10b981; font-weight: bold;',
            'color: inherit;',
            res
          );
        },
        error: (err) => {
          console.warn(`[KAFKA INGESTION] Backend/Kafka offline (${err?.message || err}). Navigation continues.`);
        }
      });
    }

    // 2. Forward către AnalyticsRepository dacă este disponibil
    if (this.analyticsRepo) {
      return this.analyticsRepo.trackPageView(payload);
    }

    return of({
      status: 'INGESTED',
      topic: 'shop.analytics.page_views',
      partition: 0,
      offset: 0,
      key: payload.sessionId,
      eventId: 'ev-' + Date.now(),
      timestamp: Date.now()
    } as IngestedKafkaRecord);
  }

  private buildPageViewPayload(url: string, custom?: Partial<PageViewPayload>): PageViewPayload {
    const user = this.authService ? this.authService.currentUser() : null;
    const [pathPart, queryPart] = url.split('?');
    const queryParams: Record<string, string> = {};

    if (queryPart) {
      new URLSearchParams(queryPart).forEach((val, key) => {
        queryParams[key] = val;
      });
    }

    const title = this.resolvePageTitle(pathPart);
    const screenRes = typeof window !== 'undefined' ? `${window.screen?.width || 0}x${window.screen?.height || 0}` : '1920x1080';
    const language = typeof navigator !== 'undefined' ? navigator.language : 'ro-RO';
    const userAgent = typeof navigator !== 'undefined' ? navigator.userAgent : 'Mozilla/5.0';
    const referrer = typeof document !== 'undefined' ? (document.referrer || '/') : '/';

    return {
      url,
      path: pathPart || '/',
      title,
      referrer,
      sessionId: this.sessionId,
      userId: user?.id,
      userAgent,
      language,
      screenResolution: screenRes,
      timestamp: new Date().toISOString(),
      queryParams,
      ...custom
    };
  }

  private resolvePageTitle(path: string): string {
    if (path === '/' || path === '') return 'Home | CommerceHub';
    if (path.startsWith('/products/')) return 'Product Details | CommerceHub';
    if (path.startsWith('/products')) return 'Product Catalog | CommerceHub';
    if (path.startsWith('/cart')) return 'Shopping Cart | CommerceHub';
    if (path.startsWith('/checkout')) return 'Checkout | CommerceHub';
    if (path.startsWith('/orders')) return 'My Orders | CommerceHub';
    if (path.startsWith('/monitoring')) return 'Kafka Observability | CommerceHub';
    return 'CommerceHub';
  }

  private getOrCreateSessionId(): string {
    try {
      if (typeof window !== 'undefined' && window.sessionStorage) {
        let stored = sessionStorage.getItem(this.SESSION_STORAGE_KEY);
        if (!stored) {
          stored = 'sess-' + Math.random().toString(36).substring(2, 9) + '-' + Date.now().toString(36);
          sessionStorage.setItem(this.SESSION_STORAGE_KEY, stored);
        }
        return stored;
      }
    } catch {
      // Fallback
    }
    return 'sess-' + Math.random().toString(36).substring(2, 9) + '-' + Date.now().toString(36);
  }

  private getOrCreateAnonymousId(): string {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        let stored = localStorage.getItem(this.ANON_STORAGE_KEY);
        if (!stored) {
          stored = 'anon-' + Math.random().toString(36).substring(2, 9) + '-' + Date.now().toString(36);
          localStorage.setItem(this.ANON_STORAGE_KEY, stored);
        }
        return stored;
      }
    } catch {
      // Fallback
    }
    return 'anon-' + Math.random().toString(36).substring(2, 9) + '-' + Date.now().toString(36);
  }
}

