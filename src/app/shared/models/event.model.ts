export type AppEventType =
  | 'PAGE_VIEW'
  | 'PRODUCT_VIEWED'
  | 'PRODUCT_SEARCHED'
  | 'CART_ITEM_ADDED'
  | 'CART_ITEM_REMOVED'
  | 'CART_UPDATED'
  | 'CHECKOUT_STARTED'
  | 'ORDER_CREATED'
  | 'USER_LOGGED_IN'
  | 'USER_LOGGED_OUT';

export interface AppEvent<T = unknown> {
  id: string;
  type: AppEventType;
  timestamp: string;
  topic: string;
  correlationId: string;
  payload: T;
  schemaVersion?: string;
}

export interface ProductViewedPayload {
  productId: string;
  productName: string;
  categoryId: string;
  price: number;
  userId?: string;
}

export interface ProductSearchedPayload {
  query: string;
  totalHits: number;
  facetsSelected?: Record<string, unknown>;
  userId?: string;
}

export interface CartItemAddedPayload {
  cartId: string;
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  userId?: string;
}

export interface CartItemRemovedPayload {
  cartId: string;
  productId: string;
  userId?: string;
}

export interface OrderCreatedPayload {
  orderId: string;
  orderNumber: string;
  userId: string;
  total: number;
  itemCount: number;
}

export interface PageViewPayload {
  url: string;
  path: string;
  title: string;
  referrer: string;
  sessionId: string;
  userId?: string;
  userAgent?: string;
  language: string;
  screenResolution?: string;
  timestamp: string;
  queryParams?: Record<string, string>;
}

