import { Injectable, inject } from '@angular/core';
import { Observable, of, delay, tap } from 'rxjs';
import { AnalyticsRepository, IngestedKafkaRecord } from './analytics.repository';
import { PageViewPayload } from '../../shared/models/event.model';
import { EventBusService } from '../event-bus/event-bus.service';
import { TelemetryService } from '../services/telemetry.service';

@Injectable({
  providedIn: 'root'
})
export class MockAnalyticsRepository extends AnalyticsRepository {
  private eventBus = inject(EventBusService);
  private telemetry = inject(TelemetryService);

  trackPageView(payload: PageViewPayload): Observable<IngestedKafkaRecord> {
    const startTime = performance.now();
    const partitionKey = payload.userId || payload.sessionId || 'anonymous-session';

    // 1. Emit to Kafka via Event Bus (Producer -> topic 'page_views')
    const appEvent = this.eventBus.emit<PageViewPayload>('PAGE_VIEW', payload, partitionKey);

    const record: IngestedKafkaRecord = {
      status: 'INGESTED',
      topic: 'page_views',
      partition: 0,
      offset: Date.now() % 100000 + 1000,
      key: partitionKey,
      eventId: appEvent.id,
      timestamp: Date.now()
    };

    // Simulate backend network round-trip & telemetry tracking
    return of(record).pipe(
      delay(35),
      tap(() => {
        const duration = Math.round(performance.now() - startTime);
        this.telemetry.recordApiRequest(duration, false);
      })
    );
  }
}
