import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { TrackingService } from './tracking.service';
import { AnalyticsRepository } from '../repositories/analytics.repository';
import { MockAnalyticsRepository } from '../repositories/mock-analytics.repository';
import { AuthService } from '../auth/auth.service';
import { provideHttpClient } from '@angular/common/http';
import { of } from 'rxjs';

describe('TrackingService', () => {
  let service: TrackingService;
  let analyticsRepo: AnalyticsRepository;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        TrackingService,
        { provide: AnalyticsRepository, useClass: MockAnalyticsRepository },
        AuthService
      ]
    });

    service = TestBed.inject(TrackingService);
    analyticsRepo = TestBed.inject(AnalyticsRepository);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should generate a valid session ID', () => {
    expect(service.sessionId).toBeTruthy();
    expect(service.sessionId.startsWith('sess-')).toBeTrue();
  });

  it('should track a page view and increment totalTrackedCount', (done) => {
    const initialCount = service.totalTrackedCount();
    service.trackPageView({ path: '/products', title: 'Product Catalog' }).subscribe(record => {
      expect(record).toBeTruthy();
      expect(record.topic).toBe('page_views');
      expect(service.totalTrackedCount()).toBe(initialCount + 1);
      expect(service.lastTrackedPageView()?.path).toBe('/products');
      done();
    });
  });
});
