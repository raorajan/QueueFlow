# QueueFlow

Production-ready backend for ingesting and processing transactions reliably with a queue, cache, and database.

## Architecture

1. **Express API**: Receives transactions, validates payload, rate limits, and pushes to a queue.
2. **BullMQ Queue (Redis)**: Handles high throughput ingestion securely.
3. **BullMQ Worker**: Process transactions idempotently. Connects to PostgreSQL, deducts wallet balance, logs events. Handles retries with exponential backoff.
4. **Redis Cache**: Caches analytics queries to avoid overwhelming the database. Implements **Cache Stampede Protection**.
5. **PostgreSQL**: Primary data store with Drizzle ORM.

### Cache Stampede Protection (Redis Lock)

When caching analytics data, a sudden cache expiration (Cache Miss) under heavy traffic can lead to multiple requests simultaneously hitting the database (Cache Stampede). 

**How we solve it:**
1. Check cache. If miss, attempt to acquire a Redis Lock (`SETNX analytics:summary:lock`).
2. Only the **first request** acquires the lock. It queries the DB, saves to cache, and releases the lock.
3. **Other requests** fail to acquire the lock. They wait briefly (e.g. 500ms) and retry fetching from the cache directly.

## Prerequisites

- Node.js v18+
- PostgreSQL Server
- Redis Server

## Setup & Run

1. Clone and install dependencies:
   ```bash
   npm install
   ```

2. Configure environment variables in `.env`:
   ```env
   PORT=3000
   DATABASE=postgresql://username:password@localhost:5432/queueflow?sslmode=require
   REDIS_URL=redis://localhost:6379
   LOG_LEVEL=info
   ```

3. Database Migrations:
   ```bash
   npm run db:generate
   npm run db:migrate
   ```

4. Run locally (Server + Worker):
   ```bash
   npm run dev
   ```

## API Documentation

### 1. Submit Transaction
`POST /api/v1/transactions`

**Body:**
```json
{
  "id": "txn_101",
  "userId": "uuid-here",
  "amount": 250,
  "currency": "USD",
  "timestamp": "2026-06-19T10:00:00Z"
}
```

### 2. Get Analytics Summary
`GET /api/v1/analytics/summary`

**Response:**
```json
{
  "totalVolume": 250000,
  "topUsers": [
    {
      "userId": "uuid-here",
      "volume": 50000
    }
  ]
}
```
