import { Injectable, inject, signal, computed, DestroyRef } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { PageViewPayload } from '../../shared/models/event.model';
import { AnalyticsRepository, IngestedKafkaRecord } from '../repositories/analytics.repository';
import { AuthService } from '../auth/auth.service';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class TrackingService {
  private router = inject(Router);
  private analyticsRepo = inject(AnalyticsRepository);
  private authService = inject(AuthService);
  private destroyRef = inject(DestroyRef);

  private readonly SESSION_STORAGE_KEY = 'commerce_hub_session_id';
  readonly sessionId = this.getOrCreateSessionId();

  // Reactive state signals
  readonly lastTrackedPageView = signal<PageViewPayload | null>(null);
  readonly totalTrackedCount = signal<number>(0);
  readonly isTrackingEnabled = signal<boolean>(true);

  constructor() {
    this.initAutoPageTracking();
  }

  private initAutoPageTracking(): void {
    this.router.events.pipe(
      filter((event): event is NavigationEnd => event instanceof NavigationEnd),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe((nav: NavigationEnd) => {
      if (this.isTrackingEnabled()) {
        this.captureAndSendPageView(nav.urlAfterRedirects);
      }
    });
  }

  trackPageView(custom?: Partial<PageViewPayload>): Observable<IngestedKafkaRecord> {
    const currentUrl = this.router.url;
    const payload = this.buildPageViewPayload(currentUrl, custom);
    return this.sendToBackendApi(payload);
  }

  private captureAndSendPageView(url: string): void {
    const payload = this.buildPageViewPayload(url);
    this.sendToBackendApi(payload).subscribe();
  }

  private sendToBackendApi(payload: PageViewPayload): Observable<IngestedKafkaRecord> {
    this.lastTrackedPageView.set(payload);
    this.totalTrackedCount.update(c => c + 1);

    console.log(
      `%c[TRACKING SERVICE]%c Page View captured: %c${payload.path}%c (Session: ${payload.sessionId})`,
      'color: #10b981; font-weight: bold;',
      'color: inherit;',
      'color: #3b82f6; font-weight: bold;',
      'color: inherit;',
      payload
    );

    // Forward to Backend API layer
    return this.analyticsRepo.trackPageView(payload);
  }

  private buildPageViewPayload(url: string, custom?: Partial<PageViewPayload>): PageViewPayload {
    const user = this.authService.currentUser();
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
    const referrer = typeof document !== 'undefined' ? document.referrer || 'direct' : 'direct';

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
    if (path.startsWith('/products')) return 'Product Catalog | CommerceHub';
    if (path.startsWith('/product/')) return 'Product Details | CommerceHub';
    if (path.startsWith('/cart')) return 'Shopping Cart | CommerceHub';
    if (path.startsWith('/checkout')) return 'Checkout | CommerceHub';
    if (path.startsWith('/orders')) return 'My Orders | CommerceHub';
    if (path.startsWith('/monitoring')) return 'Kafka Observability & Telemetry | CommerceHub';
    return 'CommerceHub';
  }

  private getOrCreateSessionId(): string {
    try {
      let stored = sessionStorage.getItem(this.SESSION_STORAGE_KEY);
      if (!stored) {
        stored = 'sess-' + Math.random().toString(36).substring(2, 9) + '-' + Date.now().toString(36);
        sessionStorage.setItem(this.SESSION_STORAGE_KEY, stored);
      }
      return stored;
    } catch {
      return 'sess-' + Math.random().toString(36).substring(2, 9) + '-' + Date.now().toString(36);
    }
  }
}
