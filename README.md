# Notification Service - Multi-Channel Event-Driven System

A production-grade, scalable notification service built with NestJS, RabbitMQ, and PostgreSQL. Supports multiple notification channels (Email, SMS, Push) with event-driven architecture, retry logic, and comprehensive status tracking.

## ✨ Features

- **Multi-Channel Support**: Email, SMS, and Push notifications
- **Event-Driven Architecture**: Asynchronous processing with RabbitMQ
- **Idempotency**: Prevents duplicate notifications using Redis-backed keys
- **Template Management**: Dynamic notification templates with variable substitution
- **Status Tracking**: Real-time notification status (pending, sent, failed)
- **Retry Logic**: Automatic retry with exponential backoff (1s → 2s → 4s)
- **Channel Configuration**: Per-channel provider settings (SMTP, Twilio, FCM)
- **Docker Support**: Full infrastructure containerization
- **Unit Tests**: Comprehensive test coverage with Jest
- **API Documentation**: Interactive Swagger/OpenAPI docs
- **Health Checks**: System monitoring endpoints

## 🏗️ Architecture

```
┌─────────┐     ┌──────────────┐     ┌──────────┐     ┌────────────┐
│ Client  │────▶│  API Service │────▶│ RabbitMQ │────▶│   Worker   │
│         │     │  (REST API)  │     │  (AMQP)  │     │  Service   │
└─────────┘     └──────┬───────┘     └──────────┘     └──────┬─────┘
                       │                                       │
                       ▼                                       ▼
                ┌─────────────┐                       ┌──────────────┐
                │  PostgreSQL │◀──────────────────────│   Providers  │
                │  (Database) │                       │ Email/SMS/FCM│
                └─────────────┘                       └──────────────┘
                       ▲
                       │
                ┌──────┴──────┐
                │    Redis    │
                │ (Idempotency│
                └─────────────┘
```

## 🚀 Prerequisites

- **Node.js** 18+ 
- **npm** 9+
- **Docker** & **Docker Compose**
- **Git**

## ⚡ Quick Start

### 1. Clone & Navigate

```bash
git clone <repository-url>
cd salaash-assessment-v2
```

### 2. Start Infrastructure

```bash
docker-compose up -d
```

This starts:
- **PostgreSQL** (port 5432)
- **RabbitMQ** (port 5672, management: 15672)
- **Redis** (port 6379)
- **Mailpit** (SMTP: 1025, UI: 8025)

### 3. Setup & Start API Service

```bash
cd notification-service-api
npm install
cp .env.example .env
npm run migration:run
npm run start:dev
```

API will be available at `http://localhost:3000`

### 4. Setup & Start Worker Service

```bash
cd notification-service-worker
npm install
cp .env.example .env
npm run start:dev
```

### 5. Verify Installation

```bash
# Check API health
curl http://localhost:3000/health

# Access Swagger docs
open http://localhost:3000/api

# View RabbitMQ management
open http://localhost:15672  # guest/guest

# Check emails in Mailpit
open http://localhost:8025
```

## 📚 API Documentation

### Base URL
```
http://localhost:3000/api
```

### Key Endpoints

#### Create Notification
```bash
POST /api/notifications
Content-Type: application/json

{
  "recipientId": "user@example.com",
  "channelId": "uuid-of-channel",
  "templateName": "welcome_email",
  "data": {
    "name": "John Doe",
    "verificationLink": "https://app.com/verify"
  },
  "idempotencyKey": "unique-key-123"
}
```

#### Get Notification Status
```bash
GET /api/notifications/{id}
```

#### List Notifications with Filters
```bash
GET /api/notifications?status=sent&recipientId=user@example.com&page=1&limit=20
```

#### Create Channel
```bash
POST /api/channels
Content-Type: application/json

{
  "name": "Gmail SMTP",
  "type": "email",
  "configuration": {
    "host": "smtp.gmail.com",
    "port": 587,
    "secure": true,
    "user": "your-email@gmail.com",
    "pass": "your-app-password"
  },
  "isActive": true
}
```

#### Create Order (Triggers Multi-Channel Notifications)
```bash
POST /api/orders
Content-Type: application/json

{
  "userId": "customer@example.com",
  "total": 99.99,
  "metadata": {
    "items": ["Product A", "Product B"],
    "shippingAddress": "123 Main St"
  },
  "channelIds": ["email-channel-id", "sms-channel-id"]
}
```

### Interactive Documentation

Full API documentation with request/response examples:
```bash
open http://localhost:3000/api
```

## 🧪 Testing

### Run All Tests

```bash
# API Service
cd notification-service-api
npm test

# Worker Service
cd notification-service-worker
npm test
```

### Test Coverage

```bash
npm test -- --coverage
```

### Test Full Flow

```bash
# 1. Create a channel
curl -X POST http://localhost:3000/api/channels \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Email Channel",
    "type": "email",
    "isActive": true
  }'

# 2. Create a notification
curl -X POST http://localhost:3000/api/notifications \
  -H "Content-Type: application/json" \
  -d '{
    "recipientId": "test@example.com",
    "channelId": "<channel-id-from-step-1>",
    "templateName": "welcome_email",
    "data": {"name": "Test User"},
    "idempotencyKey": "test-key-'$(date +%s)'"
  }'

# 3. Check notification status
curl http://localhost:3000/api/notifications/<notification-id>

# 4. View email in Mailpit
open http://localhost:8025
```

## 🎯 Design Decisions

### Why Event-Driven Architecture?

**Benefits:**
- **Non-blocking API**: Instant response to clients
- **Scalability**: Independent scaling of API and Workers
- **Fault Tolerance**: Messages persist in queue if workers are down
- **Retry Logic**: Built-in message redelivery on failure

**Trade-offs:**
- Added complexity vs monolithic approach
- Eventual consistency vs immediate consistency
- Requires message broker infrastructure

### Why Separate API and Worker Services?

**Reasons:**
- **Separation of Concerns**: API handles requests, workers process jobs
- **Independent Scaling**: Scale workers based on queue depth
- **Fault Isolation**: Worker crashes don't affect API availability
- **Resource Optimization**: CPU-intensive work offloaded from API

### Why PostgreSQL?

**Advantages:**
- ACID compliance for reliable data
- JSONB support for flexible configuration storage
- Mature, battle-tested in production
- Excellent TypeORM integration

### Why RabbitMQ?

**Features Used:**
- **Reliable Delivery**: Messages persisted to disk
- **Routing Flexibility**: Exchange/routing key patterns
- **DLQ Support**: Dead letter queues for failed messages
- **Acknowledgments**: Manual ACK for retry control

### Retry Logic Implementation

**Strategy**: Exponential backoff with 3 attempts
- **Attempt 1**: 1 second delay
- **Attempt 2**: 2 seconds delay
- **Attempt 3**: 4 seconds delay
- **After 3 failures**: Message acknowledged, moved to DLQ (in production)

**Implementation**:
- Retry count stored in message headers (`x-retry-count`)
- Worker republishes message with incremented counter
- Original message acknowledged after republish
- Prevents infinite loops while allowing transient error recovery

### Idempotency Mechanism

**Problem**: Prevent duplicate notifications from retry/network issues

**Solution**:
- Client provides unique `idempotencyKey` per notification
- Key stored in database with unique constraint
- Duplicate requests return 409 Conflict
- TTL: Keys stored indefinitely (can add cleanup job)

**Alternative Considered**: Redis with 24h TTL
- Pros: Automatic expiration, faster lookups
- Cons: Lost on Redis restart (currently using DB for persistence)

### Status Tracking Flow

```
1. Client creates notification → status: 'pending'
2. Worker receives message → processes
3a. Success → status: 'sent', sentAt: <timestamp>
3b. Failure → status: 'failed', failedAt: <timestamp>, errorMessage: <error>
```

## 🔮 Future Improvements

### Short-Term

- **Additional Channels**: WhatsApp, Slack, Discord, Telegram
- **Monitoring**: Prometheus metrics + Grafana dashboards
- **Rate Limiting**: Per-channel rate limits (e.g., 100 emails/minute)
- **Delivery Webhooks**: Callback URLs for status updates
- **Batch Processing**: Send to multiple recipients in one call
- **Template Editor**: Web UI for managing templates

### Long-Term

- **User Preferences**: Opt-out, quiet hours, preferred channels
- **A/B Testing**: Template variants with analytics
- **Analytics Dashboard**: Delivery rates, open rates, click tracking
- **Scheduled Notifications**: Cron-based or specific timestamp delivery
- **Multi-Tenancy**: Isolated data per organization
- **Internationalization**: Multi-language template support
- **Real-time WebSockets**: Live notification status updates
- **AI-Powered**: Smart send time optimization, content suggestions

## 📁 Project Structure

```
salaash-assessment-v2/
├── notification-service-api/        # REST API Service
│   ├── src/
│   │   ├── modules/
│   │   │   ├── notifications/       # Notification CRUD
│   │   │   ├── channels/            # Channel management
│   │   │   ├── orders/              # Order processing
│   │   │   └── templates/           # Template management
│   │   ├── rmq/                     # RabbitMQ adapter
│   │   ├── common/                  # Shared utilities
│   │   └── main.ts
│   └── test/                        # Integration tests
│
├── notification-service-worker/     # Event Consumer Service
│   ├── src/
│   │   ├── handlers/
│   │   │   ├── email/               # Email handlers
│   │   │   ├── sms/                 # SMS handlers
│   │   │   └── push/                # Push handlers
│   │   ├── services/                # Provider services
│   │   ├── rmq/                     # RabbitMQ config
│   │   └── entities/                # TypeORM entities
│   └── templates/                   # Handlebars templates
│
├── docker-compose.yml               # Infrastructure
└── README.md                        # This file
```

## 🛠️ Configuration

### Environment Variables

**API Service** (`.env`):
```bash
# Server
PORT=3000
NODE_ENV=development

# Database
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=postgres
DB_DATABASE=notification_service

# RabbitMQ
RABBITMQ_URL=amqp://guest:guest@localhost:5672

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379
```

**Worker Service** (`.env`):
```bash
# Database
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=postgres
DB_DATABASE=notification_service

# RabbitMQ
RABBITMQ_URL=amqp://guest:guest@localhost:5672

# Email (Mailpit for dev)
MAIL_HOST=localhost
MAIL_PORT=1025
MAIL_NO_AUTH=true
MAIL_FROM=noreply@example.com

# SMS (Twilio)
TWILIO_ACCOUNT_SID=your-account-sid
TWILIO_AUTH_TOKEN=your-auth-token
TWILIO_PHONE_NUMBER=+1234567890

# Push (Firebase)
FCM_SERVER_KEY=your-fcm-server-key
```

## 🐛 Troubleshooting

### Issue: Tests Failing

```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
npm test
```

### Issue: Cannot Connect to Database

```bash
# Check Docker containers
docker-compose ps

# Restart PostgreSQL
docker-compose restart postgres

# Check logs
docker-compose logs postgres
```

### Issue: RabbitMQ Connection Error

```bash
# Check RabbitMQ status
docker-compose logs rabbitmq

# Access management UI
open http://localhost:15672

# Restart RabbitMQ
docker-compose restart rabbitmq
```

### Issue: Emails Not Sending

```bash
# Check Mailpit logs
docker-compose logs mailpit

# Verify worker is running
cd notification-service-worker
npm run start:dev

# Check worker logs for errors
```

## 📄 License

This project is part of a technical assessment.

## 👤 Author

Bassam - Salaash Technical Assessment

## 🙏 Acknowledgments

- NestJS for the excellent framework
- RabbitMQ for reliable messaging
- Docker for simplified infrastructure
- Mailpit for email testing
