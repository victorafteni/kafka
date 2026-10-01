import { TestBed } from '@angular/core/testing';
import { KafkaConsumerService } from './kafka-consumer.service';
import { EventBusService } from './event-bus.service';
import { AnalyticsStoreService } from '../services/analytics-store.service';
import { PageViewPayload } from '../../shared/models/event.model';

describe('KafkaConsumerService & AnalyticsStoreService', () => {
  let consumer: KafkaConsumerService;
  let eventBus: EventBusService;
  let analyticsStore: AnalyticsStoreService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        KafkaConsumerService,
        EventBusService,
        AnalyticsStoreService
      ]
    });

    consumer = TestBed.inject(KafkaConsumerService);
    eventBus = TestBed.inject(EventBusService);
    analyticsStore = TestBed.inject(AnalyticsStoreService);
  });

  it('should be created and have consumer group configured', () => {
    expect(consumer).toBeTruthy();
    expect(consumer.consumerGroupId()).toBe('analytics-consumer-group-1');
    expect(consumer.topicSubscribed()).toBe('page_views');
  });

  it('should consume PAGE_VIEW events and store them in AnalyticsStoreService', () => {
    const initialTotal = analyticsStore.totalPageViews();
    const payload: PageViewPayload = {
      url: '/cart',
      path: '/cart',
      title: 'Shopping Cart',
      referrer: '/products',
      sessionId: 'sess-unit-test',
      language: 'ro-RO',
      timestamp: new Date().toISOString()
    };

    eventBus.emit<PageViewPayload>('PAGE_VIEW', payload, payload.sessionId);

    expect(analyticsStore.totalPageViews()).toBe(initialTotal + 1);
    expect(analyticsStore.recentPageViews()[0].payload.path).toBe('/cart');
    expect(analyticsStore.pageViewsByPath()['/cart']).toBeGreaterThan(0);
  });
});
