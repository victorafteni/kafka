import { TestBed } from '@angular/core/testing';
import { EventBusService } from './event-bus.service';
import { MockKafkaProducer } from './mock-kafka.producer';
import { AppEvent } from '../../shared/models/event.model';

describe('EventBusService', () => {
  let service: EventBusService;
  let kafkaProducer: MockKafkaProducer;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [EventBusService, MockKafkaProducer]
    });
    service = TestBed.inject(EventBusService);
    kafkaProducer = TestBed.inject(MockKafkaProducer);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should emit event and forward to Kafka producer with correct topic', async () => {
    const publishSpy = spyOn(kafkaProducer, 'publish').and.callThrough();

    const emitted = service.emit('CART_ITEM_ADDED', {
      cartId: 'cart-1',
      productId: 'prod-101',
      quantity: 1,
      unitPrice: 1499.00
    }, 'usr-001');

    expect(emitted).toBeDefined();
    expect(emitted.type).toBe('CART_ITEM_ADDED');
    expect(emitted.topic).toBe('commerce.cart.events');
    expect(publishSpy).toHaveBeenCalledWith(
      'commerce.cart.events',
      'usr-001',
      jasmine.objectContaining({ type: 'CART_ITEM_ADDED' })
    );
  });

  it('should notify subscribers filtered by event type', (done) => {
    service.on('PRODUCT_VIEWED').subscribe((event: AppEvent<any>) => {
      expect(event.type).toBe('PRODUCT_VIEWED');
      expect(event.payload.productId).toBe('prod-102');
      done();
    });

    service.emit('PRODUCT_VIEWED', {
      productId: 'prod-102',
      productName: 'Samsung Galaxy S24 Ultra 512GB Titanium Black',
      categoryId: 'cat-phones',
      price: 1399
    });
  });
});
