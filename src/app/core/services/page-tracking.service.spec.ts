import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { PageTrackingService } from './page-tracking.service';

describe('PageTrackingService', () => {
  let service: PageTrackingService;
  let router: Router;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideRouter([]),
        PageTrackingService
      ]
    });

    service = TestBed.inject(PageTrackingService);
    router = TestBed.inject(Router);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should generate valid sessionId and anonymousId', () => {
    expect(service.sessionId).toBeTruthy();
    expect(service.anonymousId).toBeTruthy();
    expect(service.sessionId.startsWith('sess-')).toBeTrue();
    expect(service.anonymousId.startsWith('anon-')).toBeTrue();
  });

  it('should have initial state counts', () => {
    expect(service.totalTrackedCount()).toBe(0);
    expect(service.isTrackingEnabled()).toBeTrue();
  });
});

