import { Injectable, inject } from '@angular/core';
import { TrackingService } from './tracking.service';

export interface PageViewEventRequest {
  path: string;
  route: string;
  title: string;
  session_id: string;
  anonymous_id: string;
  referrer: string;
  user_id?: string | null;
}

export interface PageViewTrackingResponse {
  success: boolean;
  event_id: string;
  event_type: string;
  timestamp: string;
  topic: string;
  delivery: {
    status: string;
    topic?: string;
    partition?: number;
    offset?: number;
  };
}

/**
 * Unified delegate to TrackingService (for backwards compatibility)
 */
@Injectable({
  providedIn: 'root'
})
export class PageTrackingService {
  private trackingService = inject(TrackingService);

  readonly sessionId = this.trackingService.sessionId;
  readonly anonymousId = this.trackingService.anonymousId;

  readonly lastTrackedEvent = this.trackingService.lastTrackedPageView;
  readonly totalTrackedCount = this.trackingService.totalTrackedCount;
  readonly isTrackingEnabled = this.trackingService.isTrackingEnabled;

  trackPageView(custom?: any) {
    return this.trackingService.trackPageView(custom);
  }
}
