import { Injectable, inject, signal, DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { EventBusService } from './event-bus.service';
import { AnalyticsStoreService, ConsumedPageViewRecord } from '../services/analytics-store.service';
import { AppEvent, PageViewPayload } from '../../shared/models/event.model';

@Injectable({
  providedIn: 'root'
})
export class KafkaConsumerService {
  private eventBus = inject(EventBusService);
  private analyticsStore = inject(AnalyticsStoreService);
  private destroyRef = inject(DestroyRef);

  readonly consumerGroupId = signal<string>('analytics-consumer-group-1');
  readonly topicSubscribed = signal<string>('page_views');
  readonly assignedPartitions = signal<number[]>([0]);
  readonly committedOffset = signal<number>(1043);
  readonly consumerStatus = signal<'RUNNING' | 'PAUSED'>('RUNNING');
  readonly totalConsumed = signal<number>(142);
  readonly consumerLag = signal<number>(0);

  constructor() {
    this.startConsumerLoop();
  }

  private startConsumerLoop(): void {
    this.eventBus.on<PageViewPayload>('PAGE_VIEW').pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe((event: AppEvent<PageViewPayload>) => {
      if (this.consumerStatus() !== 'RUNNING') return;

      this.processKafkaRecord(event);
    });
  }

  private processKafkaRecord(event: AppEvent<PageViewPayload>): void {
    const receiveTime = Date.now();
    const eventTime = new Date(event.timestamp).getTime();
    const processingLagMs = Math.max(1, Math.round(receiveTime - eventTime));

    const offset = this.committedOffset() + 1;
    this.committedOffset.set(offset);
    this.totalConsumed.update(c => c + 1);

    const consumedRecord: ConsumedPageViewRecord = {
      id: event.id,
      topic: event.topic || 'page_views',
      partition: 0,
      offset,
      key: event.payload.userId || event.payload.sessionId || 'anonymous',
      payload: event.payload,
      consumedAt: receiveTime,
      processingLagMs
    };

    console.log(
      `%c[KAFKA CONSUMER]%c Group: %c${this.consumerGroupId()}%c | Topic: %c${consumedRecord.topic}%c | Partition: 0 | Offset: ${offset}`,
      'color: #f59e0b; font-weight: bold;',
      'color: inherit;',
      'color: #06b6d4; font-weight: bold;',
      'color: inherit;',
      'color: #3b82f6; font-weight: bold;',
      'color: inherit;',
      consumedRecord
    );

    // Forward to Database / Analytics layer
    this.analyticsStore.recordConsumedPageView(consumedRecord);
  }

  toggleConsumerStatus(): void {
    this.consumerStatus.update(status => status === 'RUNNING' ? 'PAUSED' : 'RUNNING');
  }
}
