# Redis Integration & Catalog Caching

## 1. Overview

Redis is used as the primary runtime catalog store in the Commerce Hub application. It guarantees sub-millisecond responses for product and category requests while relieving the filesystem or database from repetitive queries.

---

## 2. Key Conventions

All catalog keys adhere to the structured namespace:

```text
shop:catalog:products    -> JSON array of Product objects
shop:catalog:categories  -> JSON array of Category objects
```

---

## 3. Seed & Cache Flow

### First Startup (Cold Cache / Redis Empty)
```text
Angular (Browser)
       │
       │ GET /api/products
       ▼
Node.js Express Backend
       │
       │ EXISTS shop:catalog:products
       ▼
Redis (Empty)
       │
       └── MISS
             │
             ▼
      Read backend/data/products.json
             │
             ▼
      Redis SET shop:catalog:products
             │
             ▼
      Return Product[] to Angular
```

### Subsequent Requests (Warm Cache / Redis Populated)
```text
Angular (Browser)
       │
       │ GET /api/products
       ▼
Node.js Express Backend
       │
       │ GET shop:catalog:products
       ▼
Redis (Populated)
       │
       └── HIT
             │
             ▼
      Return Product[] from Redis directly
      (Filesystem JSON files are NEVER read)
```

---

## 4. Partial Cache Handling

Products and categories are managed completely independently:

- **Scenario A: Products exist, Categories missing**
  1. Products are retrieved directly from Redis.
  2. Categories trigger a seed from `categories.json` into Redis key `shop:catalog:categories`.
- **Scenario B: Categories exist, Products missing**
  1. Categories are retrieved directly from Redis.
  2. Products trigger a seed from `products.json` into Redis key `shop:catalog:products`.

---

## 5. Docker Container & Persistence

Redis runs as a containerized service defined in `docker-compose.yml`:

```yaml
services:
  redis:
    image: redis:7-alpine
    container_name: commerce-redis
    ports:
      - "6379:6379"
    volumes:
      - redis-data:/data
    networks:
      - commerce-net

volumes:
  redis-data:
```

### Data Persistence
The `redis-data` named volume maps container directory `/data` to Docker's host storage. Even if the container is restarted or recreated, stored catalog keys survive intact.

---

## 6. Inspecting Redis via CLI

You can connect to the running Redis instance directly from PowerShell:

```powershell
# List keys
docker exec merge-redis redis-cli keys "shop:catalog:*"

# Read products
docker exec merge-redis redis-cli get shop:catalog:products

# Read categories
docker exec merge-redis redis-cli get shop:catalog:categories
```
