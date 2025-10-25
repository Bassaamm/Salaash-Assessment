# Notification Service - Multi-Channel Event-Driven System

A notification service supporting Email, SMS, and Push notifications with event-driven architecture, retry logic, and idempotency.

## Table of Contents

- [How to Run Locally](#-how-to-run-locally)
- [Major Design Decisions](#-major-design-decisions)
- [Future Improvements](#-future-improvements)

---

## How to Run Locally

### Prerequisites

- **Docker** & **Docker Compose**
- **Git**

### Quick Start (One Command!)

**1. Clone Repository**

```bash
git clone https://github.com/Bassaamm/Salaash-Assessment.git
cd salaash-assessment-v2
```

**2. Start Everything**

```bash
docker-compose up -d
```

I developed a small front-end application to see the data visually if wanted
```bash
cd notifications-dashboard
npm run dev
```

also postman .json file is provided if want to test the endpoints using postman

This starts all services:

- PostgreSQL (Database)
- Redis (Cache)
- RabbitMQ (Message Queue)
- Mailpit (Email Testing)
- **API Service** (NestJS on port 3000)
- **Worker Service** (NestJS)
- **Front-end Application** (React on port 3001)

**3. Verify**

```bash
docker-compose ps
```

All services should show "Up".

### Access Services

| Service          | URL                       | Credentials |
| ---------------- | ------------------------- | ----------- |
| **API**          | http://localhost:3000     | -           |
| **Swagger Docs** | http://localhost:3000/api | -           |
| **Mailpit UI**   | http://localhost:8025     | -           |
| **RabbitMQ**     | http://localhost:15672    | admin/admin |

### Test the System

**Check API health:**

```bash
curl http://localhost:3000/api/health
```

### Useful Commands

```bash
# View logs
docker-compose logs -f api
docker-compose logs -f worker

# Restart a service
docker-compose restart api

# Stop all
docker-compose down

# Clean restart
docker-compose down -v && docker-compose up -d
```

---

## Major Design Decisions

### 1. Event-Driven Architecture

**Decision:** Async processing via RabbitMQ instead of synchronous calls.

**Why:**

- Non-blocking API (instant response <50ms) otherwise we would wait for the response
- Independent scaling (workers scale based on queue depth)
- Fault tolerance (messages persist if workers crash)
- Built-in retry logic with exponential backoff
- Dead Letter Queue for easier debugging

**Trade-off:** Eventual consistency vs immediate delivery.

### 2. Separate API & Worker Services

**Decision:** Two NestJS apps instead of monolith.

**Why:**

- Scale independently (API for traffic, Workers for queue volume)
- Fault isolation, if one service (worker) crashes the other will continue to work (api)
- Resource optimization, heavy long-time processing offloaded to workers

**Trade-off:** More deployment complexity.

### 3. Redis for Idempotency

**Decision:** In-memory cache for duplicate checks.

**Why:**

- faster than database
- Automatic TTL cleanup
- Reduces database load

**Trade-off:** Additional infrastructure component.

### 4. Database-Driven Templates

**Decision:** Store templates in PostgreSQL.

**Why:**

- Update content without code deployments we just do migration without needing to push new code
- Version control for templates
- A/B testing ready to see which template is better

**Trade-off:** Requires admin UI to manage templates (future work).

### 5. Retry with Exponential Backoff

**Decision:** 3 retries with delays: 1s → 2s → 4s

**Why:**

- Handles transient failures (network issues, provider throttling)
- Prevents overwhelming recovering services
- Dead Letter Queue for manual inspection after max retries

**Trade-off:** Failed notifications take up to 7s, but improves delivery rate.

---

## Future Improvements

**Rate Limiting**

- Per-channel limits
- Prevent spam flags and provider throttling

**Delivery Webhooks**

- Listen to SendGrid/Twilio events
- Real-time status updates, which is useful for fulfillment systems

**Template Management UI**

- Admin panel for non-technical users
- Live preview with sample data

**Batch Notifications**

- Send to multiple recipients in one call, currently we send to one only
- Optimize provider API usage

**Monitoring Dashboard**

- Grafana dashboards for metrics
- Alerts on Slack

**User Preferences**

- Opt-out of notification types
- Quiet hours (no sends 10pm-8am)
- Preferred channels

**Scheduled Notifications**

- Cron-based delivery
- Future-dated notifications
- Recurring notifications, like daily or weekly

**Multi-Tenancy**

- Isolate data per organization
- Per-tenant branding and providers
- Usage quotas and billing

**Internationalization**

- Multi-language templates
- Timezone-aware delivery
- Auto-detect user language from browser or area code

**Advanced Analytics**

- A/B testing framework
- Conversion tracking
- Funnel analysis (sent → opened → clicked → converted) by including a unique link in the email
  to call our api once it's opened or clicked

---

## Architecture Highlights

- **Event-Driven:** RabbitMQ with channel-specific exchanges
- **Horizontally Scalable:** Stateless services, no need for sticky sessions or such things
- **Fault Tolerant:** Retry logic, DLQ
- **Observable:** Prometheus metrics, structured logging
- **Extensible:** Add new channels easily

---

## Project Structure

```
salaash-assessment-v2/
├── notification-service-api/        # REST API (Port 3000)
│   ├── src/modules/                 # Business logic
│   ├── test/                        # E2E tests
│   └── Dockerfile
├── notification-service-worker/     # Event consumers
│   ├── src/handlers/                # Channel handlers
│   ├── src/services/                # Provider services
│   └── Dockerfile
├── notification-dashboard/          # Notification Dashboard
│   ├── ...                         # Dashboard logic
├── docker-compose.yml               # All services
└── README.md
```

---

## Testing

```bash
cd notification-service-api

# Run E2E tests (requires running services)
npm run test:e2e
```

**Test Results:**

- **Channels E2E**: 2/2 passing
- **Notifications E2E**: 5/5 passing
- **Orders E2E**: 5/5 passing
- **Total**: 12/12 tests passing (100%)

**Note:**

- Unit tests run independently without external dependencies
- E2E tests require the database and other services to be running (`docker-compose up`)
- Tests should be run locally since the Docker container only includes production dependencies

---
