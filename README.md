# Commerce Hub — Modern Enterprise Commerce SPA

An enterprise-grade Single Page Application built with **Angular 19**, **TypeScript**, **RxJS**, and **Angular Signals**, engineered around **Clean Architecture**, **Event-Driven Streaming (Apache Kafka simulation)**, **In-Memory Session State (Redis simulation)**, and **Sub-100ms Faceted Discovery (Algolia engine simulation)**.

---

## 1. Architectural Blueprint & Philosophy

The application is structured around the **Replaceable Data Provider Principle**:

```
Component (UI Layer)
       │
       ▼
     Facade (Exposes Readonly Signals & User Intents)
       │
       ▼
    Service (Business Logic, Validation, State Orchestration)
       │
       ▼
  Repository Token (Abstract Dependency Inversion Contract)
       │
       ├── V1: MockRepository (In-Memory / HTTP JSON + Latency Simulation)
       └── V2: HttpRepository (Real Microservices / Backend API)
```

### Interview Pitch:
> *"The frontend was designed behind strict facade and repository abstractions. The feature components have zero awareness of whether data comes from local mock fixtures or distributed microservices. This allows the persistence layer to be swapped with Redis-backed cart services, Algolia search clusters, and Kafka-based event streaming without modifying a single line in the feature UI."*

---

## 2. Technology Stack & Key Highlights

| Dimension | Technologies & Patterns |
| :--- | :--- |
| **Framework** | Angular 19+ (Standalone Components, Control Flow `@for`, `@if`, Signals) |
| **State Management** | Angular Signals (`signal`, `computed`) + RxJS Streams (`Subject`, `debounceTime`, `switchMap`) |
| **Styling & System** | Internal SCSS Design Tokens + Mixins + Angular Material CDK integration |
| **Event Streaming** | `EventBusService` ➔ `MockKafkaProducer` ➔ Avro Schema Contracts (`.avsc`) |
| **Persistence Simulation** | `CartRepository` ➔ Redis Key-Value Session Store simulation |
| **Search Engine** | Algolia Faceted Search simulation with sub-100ms multi-facet filtering & autocomplete |
| **Observability** | `/monitoring` Dashboard tracking API calls, search metrics, error budgets & live Kafka logs |
| **DevOps & Containers** | Multi-stage `Dockerfile` (Node 20 + Nginx Alpine), `docker-compose.yml`, `Jenkinsfile`, Ansible |

---

## 3. Directory Layout

```
src/
├── app/
│   ├── core/
│   │   ├── auth/              # AuthService (JWT session simulation, login/logout events)
│   │   ├── event-bus/         # EventBusService + MockKafkaProducer (Kafka topic routing)
│   │   ├── http/              # Base HTTP clients and token handling
│   │   ├── interceptors/      # TelemetryInterceptor (latency/counts) & ErrorInterceptor
│   │   ├── repositories/      # ProductRepository, CartRepository, SearchRepository tokens + Mocks
│   │   └── services/          # CatalogService, CartService, SearchService, TelemetryService
│   │
│   ├── shared/
│   │   ├── components/        # AppButton, AppBadge, AppCard, AppPrice, AppRating, AppSearchBox, AppFilterPanel, etc.
│   │   └── models/            # Product, Category, Cart, User, Order, FacetGroup, AppEvent
│   │
│   ├── features/
│   │   ├── home/              # Hero, popular categories, recommended/popular products
│   │   ├── catalog/           # Product list, sorting, grid/list view, pagination
│   │   ├── product/           # Details, gallery, specs, reviews, stock status
│   │   ├── search/            # Algolia-like faceted filtering & metadata latency badge
│   │   ├── cart/              # CartFacade, Redis session simulation, order summary
│   │   ├── checkout/          # Shipping & payment reactive form, CHECKOUT_STARTED event
│   │   ├── orders/            # History, tracking status, ORDER_CREATED event details
│   │   └── monitoring/        # Real-time ops dashboard & live Kafka event audit log
│   │
│   ├── layout/
│   │   ├── header/            # Autocomplete search, real-time Kafka status indicator, cart counter
│   │   ├── footer/            # Enterprise architecture links, tech tags
│   │   └── main-layout/       # App shell wrapper
│   │
│   ├── app.routes.ts          # Lazy-loaded standalone routes
│   └── app.config.ts          # Dependency injection providers & interceptors
│
├── public/mock/               # Mock datasets (products.json, categories.json, users.json, carts.json)
├── schemas/                   # Formal Avro event contracts (.avsc)
├── ansible/                   # Deployment playbook, inventory, and frontend role
├── Jenkinsfile                # 6-Stage CI/CD automation pipeline
├── Dockerfile                 # Multi-stage production container build
└── docker-compose.yml         # Container stack (SPA + Redis + Kafka + Zookeeper)
```

---

## 4. Event-Driven Architecture & Avro Contracts

Every business action is translated into an `AppEvent` and automatically published to designated Kafka topics:

| Event Type | Kafka Topic | Avro Contract File | Trigger |
| :--- | :--- | :--- | :--- |
| `PRODUCT_VIEWED` | `commerce.catalog.events` | `schemas/product-viewed.avsc` | User opens product details |
| `PRODUCT_SEARCHED` | `commerce.catalog.events` | Inlined | User executes faceted query |
| `CART_ITEM_ADDED` | `commerce.cart.events` | `schemas/cart-item-added.avsc` | User adds product to cart |
| `CART_ITEM_REMOVED`| `commerce.cart.events` | Inlined | User removes product |
| `CART_UPDATED` | `commerce.cart.events` | Inlined | User adjusts item quantity |
| `CHECKOUT_STARTED` | `commerce.orders.events` | Inlined | User opens checkout screen |
| `ORDER_CREATED` | `commerce.orders.events` | `schemas/order-created.avsc` | User confirms order |
| `USER_LOGGED_IN` | `commerce.auth.events` | Inlined | User logs into session |

All messages published to the Kafka producer can be audited in real-time under `/monitoring`.

---

## 5. Getting Started

### Local Development

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Start the Angular Development Server:**
   ```bash
   npm start
   # or
   npx ng serve
   ```
   Open `http://localhost:4200` in your browser.

3. **Run Unit Tests:**
   ```bash
   npm test
   ```

4. **Build Production Bundle:**
   ```bash
   npm run build
   ```

---

## 6. Docker & Container Deployment

### Build and Run with Docker:
```bash
# Build multi-stage image
docker build -t commerce-hub-spa:latest .

# Run standalone container
docker run -d -p 8080:80 --name commerce-hub commerce-hub-spa:latest
```
Access the application at `http://localhost:8080`.

### Run Full Stack with Redis & Kafka (Docker Compose):
```bash
docker-compose up -d
```

---

## 7. GitFlow Workflow

The repository is structured following standard GitFlow:
* `main`: Production-ready code, triggered by release tags.
* `develop`: Integration branch for finished feature branches.
* `feature/<feature-name>`: Scoped branches (e.g. `feature/faceted-search`, `feature/kafka-event-bus`).
* `release/<version>`: Preparation for deployment and changelogs.
* `hotfix/<fix-name>`: Urgent patches applied directly to `main` and backported to `develop`.
