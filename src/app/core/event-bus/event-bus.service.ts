import { Injectable, inject } from '@angular/core';
import { Subject, Observable, filter } from 'rxjs';
import { AppEvent, AppEventType } from '../../shared/models/event.model';
import { MockKafkaProducer } from './mock-kafka.producer';

@Injectable({
  providedIn: 'root'
})
export class EventBusService {
  private kafkaProducer = inject(MockKafkaProducer);
  private eventStream$ = new Subject<AppEvent<unknown>>();

  emit<T>(type: AppEventType, payload: T, key = 'anonymous'): AppEvent<T> {
    const topic = this.mapEventToKafkaTopic(type);
    const event: AppEvent<T> = {
      id: this.generateUUID(),
      type,
      timestamp: new Date().toISOString(),
      topic,
      correlationId: this.generateUUID(),
      payload,
      schemaVersion: '1.0.0'
    };

    this.eventStream$.next(event as AppEvent<unknown>);
    this.kafkaProducer.publish(topic, key, event);

    return event;
  }

  onAll(): Observable<AppEvent<unknown>> {
    return this.eventStream$.asObservable();
  }

  on<T>(type: AppEventType): Observable<AppEvent<T>> {
    return this.eventStream$.asObservable().pipe(
      filter(event => event.type === type)
    ) as Observable<AppEvent<T>>;
  }

  private mapEventToKafkaTopic(type: AppEventType): string {
    switch (type) {
      case 'PAGE_VIEW':
        return 'page_views';
      case 'PRODUCT_VIEWED':
      case 'PRODUCT_SEARCHED':
        return 'commerce.catalog.events';
      case 'CART_ITEM_ADDED':
      case 'CART_ITEM_REMOVED':
      case 'CART_UPDATED':
        return 'commerce.cart.events';
      case 'CHECKOUT_STARTED':
      case 'ORDER_CREATED':
        return 'commerce.orders.events';
      case 'USER_LOGGED_IN':
      case 'USER_LOGGED_OUT':
        return 'commerce.auth.events';
      default:
        return 'commerce.general.events';
    }
  }

  private generateUUID(): string {
    return 'ev-' + Math.random().toString(36).substring(2, 9) + '-' + Date.now().toString(36);
  }
}

