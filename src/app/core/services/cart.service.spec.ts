import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { CartService } from './cart.service';
import { CartRepository } from '../repositories/cart.repository';
import { MockCartRepository } from '../repositories/mock-cart.repository';
import { EventBusService } from '../event-bus/event-bus.service';
import { TelemetryService } from './telemetry.service';
import { Product } from '../../shared/models/product.model';

describe('CartService', () => {
  let service: CartService;
  let eventBus: EventBusService;

  const mockProduct: Product = {
    id: 'prod-999',
    sku: 'TEST-SKU',
    name: 'Test Smartphone Pro',
    description: 'Test description',
    categoryId: 'cat-phones',
    categoryName: 'Telefoane Mobile',
    brand: 'Apple',
    price: 1000.00,
    currency: 'EUR',
    stock: 5,
    rating: 5,
    reviewCount: 10,
    images: ['https://example.com/image.jpg'],
    thumbnail: 'https://example.com/image.jpg',
    attributes: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        CartService,
        { provide: CartRepository, useClass: MockCartRepository },
        EventBusService,
        TelemetryService,
        provideHttpClient()
      ]
    });

    service = TestBed.inject(CartService);
    eventBus = TestBed.inject(EventBusService);
  });

  it('should be created and have initial state', () => {
    expect(service).toBeTruthy();
  });

  it('should emit CART_ITEM_ADDED event when product is added', (done) => {
    eventBus.on('CART_ITEM_ADDED').subscribe(event => {
      expect(event.payload).toBeDefined();
      done();
    });

    service.addProduct(mockProduct, 1);
  });
});
