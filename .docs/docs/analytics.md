# Analytics & Page View Tracking

## 1. End-to-End Tracking Flow

```text
User Navigates in Angular
         │
         ▼
Angular Router (NavigationEnd event)
         │
         ▼
PageTrackingService (core/services/page-tracking.service.ts)
         │  • Enriches with session_id, anonymous_id, route, referrer
         │  • Non-blocking HttpClient POST
         ▼
HTTP POST /api/analytics/page-view
         │
         ▼
Express TrackingController (backend/src/controllers/tracking.controller.js)
         │  • Validates and sanitizes parameters
         │  • Wraps into Standard Event Envelope
         │  • Generates UUID event_id and ISO timestamp
         ▼
KafkaService Producer (backend/src/services/kafka.service.js)
         │
         ▼
Topic: shop.analytics.page_views
         │
         ▼
AnalyticsConsumer (backend/src/consumers/analytics.consumer.js)
         │  • Idempotency deduplication check
         │  • Structured processing & logging
```

---

## 2. Standard Event Envelope Schema

The event envelope is decoupled and generic, supporting upcoming business events without altering the pipeline schema:

```json
{
  "event_id": "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d",
  "event_type": "page_view",
  "event_version": 1,
  "timestamp": "2026-10-01T15:30:00.000Z",
  "source": "angular-shop",
  "session_id": "sess-a8odqji-mupd14rj",
  "anonymous_id": "anon-v92ka1x-mupd14rj",
  "user_id": null,
  "payload": {
    "path": "/products",
    "route": "products",
    "title": "Products",
    "referrer": "/"
  }
}
```

### Extensibility for Future Events
The envelope accommodates other e-commerce events:
- `product_viewed` (`payload: { productId, price, categoryId }`)
- `cart_updated` (`payload: { cartId, productId, quantity }`)
- `checkout_started` (`payload: { cartId, totalAmount, itemCount }`)
- `order_created` (`payload: { orderId, items, paymentMethod }`)

---

## 3. Non-Blocking & Failure Isolation

1. **Angular Client**:
   - `PageTrackingService` pipes the HTTP request through RxJS `catchError(() => of(null))`.
   - If the backend is slow or temporarily unreachable, user navigation is instantaneous and completely uninterrupted.

2. **Backend Express**:
   - If the Kafka broker is restarting or temporarily offline, `TrackingController` catches the publish error, logs a warning, and returns HTTP 200 with delivery status `QUEUED`.
   - Express never throws an unhandled exception or 500 error on tracking failures.
