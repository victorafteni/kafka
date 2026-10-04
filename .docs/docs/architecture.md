# System Architecture — Angular + Express + Redis + Kafka

## 1. High-Level Architecture

The Commerce Hub application is built using a modern event-driven, decoupled micro-architecture:

```text
                             ┌───────────────────────────────┐
                             │          Angular SPA          │
                             │        localhost:4200         │
                             │                               │
                             │  • CatalogService             │
                             │  • MockProductRepository      │
                             │  • PageTrackingService        │
                             └───────────────┬───────────────┘
                                             │
                        ┌────────────────────┴───────────────────┐
                        │ HTTP GET /api/products                 │ HTTP POST
                        │ HTTP GET /api/categories               │ /api/analytics/page-view
                        ▼                                        ▼
             ┌────────────────────────────────────────────────────────┐
             │               Node.js + Express Backend                │
             │                     localhost:3000                     │
             │                                                        │
             │  • CatalogController       • TrackingController        │
             │  • CatalogService          • KafkaService (Producer)   │
             │  • RedisService (Client)   • AnalyticsConsumer         │
             └───────────────┬────────────────────────┬───────────────┘
                             │                        │
                             │ Redis TCP (:6379)      │ Kafka TCP (:9092)
                             ▼                        ▼
              ┌─────────────────────────────┐ ┌─────────────────────────────┐
              │       Redis Container       │ │     Kafka Broker + UI       │
              │       (commerce-redis)      │ │      (commerce-kafka)       │
              │                             │ │                             │
              │  Keys:                      │ │  Topics:                    │
              │   • shop:catalog:products   │ │   • shop.analytics.page_views│
              │   • shop:catalog:categories │ │   • shop.analytics.page_views.dlq
              └─────────────────────────────┘ └──────────────┬──────────────┘
                                                             │
                                                             ▼
                                              ┌─────────────────────────────┐
                                              │      Kafka Consumer         │
                                              │  (shop-analytics-consumer)  │
                                              │                             │
                                              │  • Idempotency (event_id)   │
                                              │  • Retry & DLQ Routing      │
                                              └─────────────────────────────┘
```

---

## 2. Redis vs Kafka: Roles & Responsibilities

| Dimension | Redis (In-Memory Key-Value) | Kafka (Distributed Event Streaming) |
|---|---|---|
| **Primary Role** | Fast Catalog Data Access & Caching | Asynchronous Event Streaming & Analytics |
| **Data Nature** | Current State (Products, Categories) | Immutable Event Log (Page Views, User Actions) |
| **Latency** | Sub-millisecond read/write | Low-latency stream processing, high throughput |
| **Consumer Model** | Direct point-to-point queries (`GET`, `SET`) | Publish/Subscribe with Consumer Groups and offsets |
| **Persistence** | In-memory with append-only file / snapshot backup | Distributed disk-backed partitioned commit log |

---

## 3. Failure Isolation

The application strictly isolates failures between storage and streaming layers:

1. **Redis Offline**:
   - The catalog service logs a warning and falls back to local seed data if needed.
   - Page view tracking to Kafka continues completely unaffected.
   - Health check endpoint `/api/health` reports `{ status: "degraded", redis: "unavailable", kafka: "connected" }`.

2. **Kafka Offline**:
   - The `PageTrackingService` in Angular and `TrackingController` in Express execute in a **non-blocking** manner.
   - Catalog browsing, product display, category filtering, cart, and orders continue to function without disruption.
   - The user is never blocked or presented with technical infrastructure errors.
   - Health check endpoint `/api/health` reports `{ status: "degraded", redis: "connected", kafka: "unavailable" }`.

---

## 4. Endpoints Overview

| Method | Endpoint | Description | Backing Store |
|---|---|---|---|
| `GET` | `/api/products` | Retrieve all catalog products | Redis (`shop:catalog:products`) |
| `GET` | `/api/categories` | Retrieve all catalog categories | Redis (`shop:catalog:categories`) |
| `GET` | `/api/catalog` | Retrieve combined catalog | Redis (`shop:catalog:*`) |
| `POST` | `/api/analytics/page-view` | Ingest user navigation event | Kafka (`shop.analytics.page_views`) |
| `GET` | `/api/analytics/events` | Inspect consumed Kafka events | In-memory buffer of Kafka Consumer |
| `GET` | `/api/health` | Comprehensive infrastructure health | Redis ping & Kafka broker status |
