import { CartItem } from './cart.model';

export type OrderStatus = 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';

export interface ShippingAddress {
  fullName: string;
  street: string;
  city: string;
  postalCode: string;
  country: string;
  phone: string;
}

export interface PaymentMethod {
  type: 'card' | 'apple-pay' | 'google-pay' | 'cash-on-delivery';
  lastFourDigits?: string;
}

export interface Order {
  id: string;
  orderNumber: string;
  userId: string;
  items: CartItem[];
  subtotal: number;
  shipping: number;
  discount: number;
  total: number;
  currency: string;
  status: OrderStatus;
  shippingAddress: ShippingAddress;
  paymentMethod: PaymentMethod;
  createdAt: string;
  estimatedDelivery: string;
}
