import { Injectable, inject, signal, computed } from '@angular/core';
import { Order, ShippingAddress, PaymentMethod } from '../../shared/models/order.model';
import { CartFacade } from '../../features/cart/cart.facade';
import { EventBusService } from '../event-bus/event-bus.service';

@Injectable({
  providedIn: 'root'
})
export class OrderService {
  private cartFacade = inject(CartFacade);
  private eventBus = inject(EventBusService);

  private ordersState = signal<Order[]>([
    {
      id: 'ord-901',
      orderNumber: 'CH-2024-8842',
      userId: 'usr-001',
      items: [
        {
          productId: 'prod-103',
          productSku: 'APP-MBP-14-M3',
          productName: 'Apple MacBook Pro 14 (M3 Pro)',
          image: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=400&auto=format&fit=crop&q=80',
          brand: 'Apple',
          quantity: 1,
          unitPrice: 2499.00,
          totalPrice: 2499.00,
          availableStock: 19
        }
      ],
      subtotal: 2499.00,
      shipping: 0,
      discount: 100.00,
      total: 2399.00,
      currency: 'EUR',
      status: 'shipped',
      shippingAddress: {
        fullName: 'Alex Ionescu',
        street: 'Bulevardul Dimitrie Pompeiu 10A',
        city: 'Bucharest',
        postalCode: '020337',
        country: 'Romania',
        phone: '+40 722 000 111'
      },
      paymentMethod: {
        type: 'card',
        lastFourDigits: '4242'
      },
      createdAt: '2024-02-28T14:20:00Z',
      estimatedDelivery: '2024-03-03T18:00:00Z'
    }
  ]);

  readonly orders = computed(() => this.ordersState());

  createOrder(shippingAddress: ShippingAddress, paymentMethod: PaymentMethod): Promise<Order> {
    const items = [...this.cartFacade.items()];
    const subtotal = this.cartFacade.subtotal();
    const shipping = this.cartFacade.shipping();
    const discount = this.cartFacade.discount();
    const total = this.cartFacade.total();
    const currency = this.cartFacade.currency();

    const orderNumber = 'CH-' + new Date().getFullYear() + '-' + Math.floor(1000 + Math.random() * 9000);
    const orderId = 'ord-' + Date.now();

    const newOrder: Order = {
      id: orderId,
      orderNumber,
      userId: 'usr-001',
      items,
      subtotal,
      shipping,
      discount,
      total,
      currency,
      status: 'processing',
      shippingAddress,
      paymentMethod,
      createdAt: new Date().toISOString(),
      estimatedDelivery: new Date(Date.now() + 3 * 24 * 3600 * 1000).toISOString()
    };

    return new Promise(resolve => {
      setTimeout(() => {
        this.ordersState.update(list => [newOrder, ...list]);

        this.eventBus.emit('ORDER_CREATED', {
          orderId: newOrder.id,
          orderNumber: newOrder.orderNumber,
          userId: newOrder.userId,
          total: newOrder.total,
          itemCount: items.length
        }, newOrder.orderNumber);

        this.cartFacade.clearCart();

        resolve(newOrder);
      }, 500);
    });
  }
}

