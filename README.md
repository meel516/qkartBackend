# Microservice Backend with Express.js

A comprehensive full-stack backend built with Express.js microservices architecture, featuring TypeScript, Docker containerization, and modern development practices.

## 🏗️ Architecture

This project implements a microservices architecture with the following services:

- **Auth Service** (`port 3001`) - User authentication and authorization
- **Products Service** (`port 3002`) - Product catalog management
- **Cart Service** (`port 3003`) - Shopping cart functionality  
- **Notifications Service** (`port 3004`) - Event-driven notifications

## 🛠️ Tech Stack

- **Backend**: Node.js + Express.js + TypeScript
- **Database**: SQLite with Prisma ORM
- **Caching**: Redis
- **Message Queue**: RabbitMQ
- **Logging**: Winston
- **Validation**: Zod
- **Containerization**: Docker + Docker Compose

## 📁 Project Structure

```
├── shared/                 # Shared utilities and types
│   ├── src/
│   │   ├── types/         # TypeScript interfaces
│   │   ├── utils/         # Logger, error handling, validation
│   │   ├── services/      # Redis and RabbitMQ services
│   │   └── middlewares/   # Authentication and validation
├── services/
│   ├── auth/              # Authentication service
│   ├── products/          # Products service
│   ├── cart/              # Cart service
│   └── notifications/     # Notifications service
├── docker-compose.yml     # Container orchestration
└── package.json          # Root package configuration
```

Each service includes:
- `routes/` - API route definitions
- `controllers/` - Request/response handlers
- `services/` - Business logic
- `validators/` - Zod validation schemas
- `middlewares/` - Service-specific middleware
- `config/` - Configuration files
- `types/` - TypeScript type definitions
- `Dockerfile` - Container configuration
- `prisma/` - Database schema (where applicable)

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- Docker and Docker Compose
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd microservice-backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start with Docker (Recommended)**
   ```bash
   npm run docker:up
   ```

   This will start all services along with Redis and RabbitMQ.

4. **Or run services individually for development**
   ```bash
   # Terminal 1 - Start infrastructure
   docker-compose up redis rabbitmq

   # Terminal 2 - Start all services
   npm run dev
   ```

### Environment Configuration

Each service has its own `.env` file with default configurations. Key variables:

**Auth Service (.env)**
```
PORT=3001
DATABASE_URL="file:./auth.db"
JWT_SECRET=your-super-secret-jwt-key
REDIS_URL=redis://localhost:6379
RABBITMQ_URL=amqp://localhost:5672
```

**Products Service (.env)**
```
PORT=3002
DATABASE_URL="file:./products.db"
REDIS_URL=redis://localhost:6379
RABBITMQ_URL=amqp://localhost:5672
```

**Cart Service (.env)**
```
PORT=3003
DATABASE_URL="file:./cart.db"
REDIS_URL=redis://localhost:6379
RABBITMQ_URL=amqp://localhost:5672
PRODUCTS_SERVICE_URL=http://localhost:3002
```

**Notifications Service (.env)**
```
PORT=3004
REDIS_URL=redis://localhost:6379
RABBITMQ_URL=amqp://localhost:5672
EMAIL_SERVICE=gmail
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
```

## 📡 API Endpoints

### Auth Service (http://localhost:3001)

```
POST /api/auth/register  # User registration
POST /api/auth/login     # User login
POST /api/auth/refresh   # Refresh token
POST /api/auth/logout    # User logout
GET  /api/auth/profile   # Get user profile
```

### Products Service (http://localhost:3002)

```
GET    /api/products              # Get products (paginated)
POST   /api/products              # Create product (auth required)
GET    /api/products/:id          # Get product by ID
PUT    /api/products/:id          # Update product (auth required)
DELETE /api/products/:id          # Delete product (auth required)
GET    /api/products/category/:category  # Get products by category
```

### Cart Service (http://localhost:3003)

```
GET    /api/cart              # Get user cart
POST   /api/cart/items        # Add item to cart
PUT    /api/cart/items/:productId  # Update cart item
DELETE /api/cart/items/:productId  # Remove item from cart
DELETE /api/cart              # Clear cart
```

*All cart endpoints require authentication*

### Health Checks

Each service provides a health check endpoint:
- `GET /health` - Returns service status

## 🔧 Development

### Database Management

Each service with a database has Prisma configured:

```bash
# Generate Prisma client
npm run prisma:generate

# Run migrations
npm run prisma:migrate

# Open Prisma Studio
npm run prisma:studio
```

### Building Services

```bash
# Build all services
npm run build

# Build specific service
npm run build --workspace=services/auth
```

### Testing

```bash
# Run tests for all services
npm test

# Run tests for specific service
npm run test --workspace=services/auth
```

## 🐳 Docker

The project includes comprehensive Docker configuration:

```bash
# Build all images
npm run docker:build

# Start all services
npm run docker:up

# Stop all services
npm run docker:down

# View logs
docker-compose logs -f [service-name]
```

## 🔄 Event-Driven Architecture

Services communicate through RabbitMQ events:

- **User Registration** → Welcome email notification
- **Cart Updates** → Cart notification events
- **Product Changes** → Product update notifications

## 📊 Monitoring & Logging

- **Structured Logging**: Winston with JSON format
- **Service Health Checks**: `/health` endpoints
- **Request Logging**: Comprehensive request/response logging
- **Error Tracking**: Centralized error handling

## 🔒 Security Features

- **JWT Authentication**: Secure token-based auth
- **Rate Limiting**: Request throttling per IP
- **HELMET**: Security headers
- **CORS**: Cross-origin request handling
- **Input Validation**: Zod schema validation
- **Password Hashing**: bcrypt with salt rounds

## 🚦 Production Considerations

1. **Environment Variables**: Update all default secrets
2. **Database**: Consider PostgreSQL for production
3. **Redis Clustering**: For high availability
4. **Load Balancing**: Nginx or similar
5. **Monitoring**: Add Prometheus/Grafana
6. **CI/CD**: GitHub Actions or similar
7. **SSL/TLS**: HTTPS configuration

## 📝 Contributing

1. Fork the repository
2. Create a feature branch
3. Follow TypeScript and ESLint standards
4. Add tests for new features
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.