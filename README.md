# DevOps API Pipeline

Production-ready REST API with JWT authentication, task management, and user management. Built with Express, Prisma, and PostgreSQL.

## Tech Stack

- **Runtime:** Node.js 20+
- **Framework:** Express 4
- **Database:** PostgreSQL 16 (via Prisma ORM)
- **Auth:** JWT (access + refresh tokens)
- **Validation:** Zod
- **Logging:** Winston
- **Docs:** Swagger UI (OpenAPI 3.0)
- **Containerization:** Docker, Docker Compose

## Prerequisites

- [Node.js](https://nodejs.org/) >= 20
- [npm](https://www.npmjs.com/) >= 10
- [PostgreSQL](https://www.postgresql.org/) 16+ (for local development)
- [Docker](https://www.docker.com/) & [Docker Compose](https://docs.docker.com/compose/) (for containerized setup)

## Quick Start (Local)

### 1. Install dependencies

```bash
npm install
```

### 2. Set up environment variables

```bash
cp .env.example .env
```

Edit `.env` and set your values. At minimum, configure `DATABASE_URL` to point to your PostgreSQL instance:

```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/devops_api
JWT_SECRET=your-super-secret-jwt-key-at-least-32-chars-long
JWT_REFRESH_SECRET=your-super-secret-refresh-key-at-least-32-chars
```

### 3. Set up the database

```bash
# Generate Prisma client
npm run db:generate

# Push schema to database (for development)
npm run db:push

# Seed the database with sample data
npm run db:seed
```

### 4. Start the server

```bash
# Development (with auto-reload)
npm run dev

# Production
npm start
```

The server starts on `http://localhost:3000`.

### 5. Verify it's running

```bash
curl http://localhost:3000/health
```

## Quick Start (Docker)

### 1. Configure environment

```bash
cp .env.docker .env
```

Edit `.env` and **change the JWT secrets** for any non-local use:

```env
JWT_SECRET=your-super-secret-jwt-key-at-least-32-chars-long
JWT_REFRESH_SECRET=your-super-secret-refresh-key-at-least-32-chars
```

### 2. Start all services

```bash
docker compose up -d
```

This starts three containers:

- `devops-api-db` - PostgreSQL 16
- `devops-api` - The API server
- `devops-api-migrate` - Runs database migrations (exits after completion)

### 3. Seed the database

```bash
docker compose exec api npx prisma db seed
```

### 4. Verify it's running

```bash
curl http://localhost:3000/health
```

### Docker Commands

```bash
# View logs
docker compose logs -f

# Stop all services
docker compose down

# Stop and remove volumes (deletes database data)
docker compose down -v

# Rebuild after code changes
docker compose up -d --build

# Run Prisma commands inside the container
docker compose exec api npx prisma studio
docker compose exec api npx prisma migrate dev --name my_migration
```

### Building the Docker image standalone

```bash
# Build the production image
docker build --target production -t devops-api .

# Run it (requires a separate PostgreSQL instance)
docker run -p 3000:3000 \
  -e DATABASE_URL="postgresql://user:pass@host:5432/db" \
  -e JWT_SECRET="your-secret-at-least-32-chars" \
  -e JWT_REFRESH_SECRET="your-refresh-secret-at-least-32" \
  devops-api
```

## API Endpoints

| Method | Endpoint                     | Auth  | Description                       |
| ------ | ---------------------------- | ----- | --------------------------------- |
| GET    | `/`                          | No    | API status                        |
| GET    | `/health`                    | No    | Health check (includes DB status) |
| POST   | `/api/v1/auth/register`      | No    | Register a new user               |
| POST   | `/api/v1/auth/login`         | No    | Login and get tokens              |
| POST   | `/api/v1/auth/refresh-token` | No    | Refresh access token              |
| GET    | `/api/v1/auth/me`            | Yes   | Get current user profile          |
| GET    | `/api/v1/users`              | Yes   | List users (paginated)            |
| GET    | `/api/v1/users/:id`          | Yes   | Get user by ID                    |
| PATCH  | `/api/v1/users/:id`          | Admin | Update user                       |
| DELETE | `/api/v1/users/:id`          | Admin | Delete user                       |
| GET    | `/api/v1/tasks`              | Yes   | List tasks (paginated)            |
| GET    | `/api/v1/tasks/:id`          | Yes   | Get task by ID                    |
| POST   | `/api/v1/tasks`              | Yes   | Create a new task                 |
| PATCH  | `/api/v1/tasks/:id`          | Yes   | Update task                       |
| DELETE | `/api/v1/tasks/:id`          | Yes   | Delete task                       |

Full interactive API documentation is available at `http://localhost:3000/api-docs` when the server is running.

## Seed Credentials

After running `npm run db:seed` (or the Docker seed command), you can log in with:

| Email             | Password  | Role  |
| ----------------- | --------- | ----- |
| admin@example.com | Admin123! | ADMIN |
| user@example.com  | User123!  | USER  |

## Environment Variables

| Variable                 | Required | Default       | Description                            |
| ------------------------ | -------- | ------------- | -------------------------------------- |
| `NODE_ENV`               | No       | `development` | `development`, `production`, or `test` |
| `PORT`                   | No       | `3000`        | Server port                            |
| `DATABASE_URL`           | Yes      | —             | PostgreSQL connection string           |
| `JWT_SECRET`             | Yes      | —             | JWT signing secret (min 32 chars)      |
| `JWT_EXPIRES_IN`         | No       | `24h`         | Access token expiration                |
| `JWT_REFRESH_SECRET`     | Yes      | —             | Refresh token secret (min 32 chars)    |
| `JWT_REFRESH_EXPIRES_IN` | No       | `7d`          | Refresh token expiration               |
| `CORS_ORIGIN`            | No       | `*`           | Allowed CORS origins                   |
| `RATE_LIMIT_WINDOW_MS`   | No       | `900000`      | Rate limit window (ms)                 |
| `RATE_LIMIT_MAX`         | No       | `100`         | Max requests per window                |
| `LOG_LEVEL`              | No       | `info`        | `error`, `warn`, `info`, or `debug`    |

## Project Structure

```
├── src/
│   ├── server.js              # Entry point, graceful shutdown
│   ├── app.js                 # Express app setup, middleware
│   ├── config/
│   │   ├── database.js        # Prisma client setup
│   │   ├── environment.js     # Env var validation (Zod)
│   │   └── swagger.js         # OpenAPI spec
│   ├── controllers/           # Request handlers
│   ├── middleware/             # Auth, validation, error handling
│   ├── routes/                # Route definitions
│   ├── services/              # Business logic
│   └── utils/                 # Logger, errors, JWT helpers
├── prisma/
│   ├── schema.prisma          # Database schema
│   └── seed.js                # Database seeder
├── public/                    # Dashboard frontend (static)
├── tests/                     # Integration tests
├── k8s/                       # Kubernetes manifests
├── Dockerfile                 # Multi-stage production build
├── docker-compose.yml         # Local dev stack
└── .github/workflows/ci.yml   # CI/CD pipeline
```

## Testing

```bash
# Run all tests (requires a test database)
npm test

# Run tests in watch mode
npm run test:watch
```

The test database is configured in `.env.test`. Create it before running tests:

```bash
createdb devops_api_test
```

## Linting & Formatting

```bash
# Check for lint errors
npm run lint

# Auto-fix lint errors
npm run lint:fix

# Format code with Prettier
npm run format
```

## NPM Scripts

| Command               | Description                      |
| --------------------- | -------------------------------- |
| `npm run dev`         | Start with nodemon (auto-reload) |
| `npm start`           | Start production server          |
| `npm test`            | Run tests with coverage          |
| `npm run lint`        | ESLint check                     |
| `npm run lint:fix`    | ESLint auto-fix                  |
| `npm run format`      | Prettier format                  |
| `npm run db:generate` | Generate Prisma client           |
| `npm run db:push`     | Push schema to database          |
| `npm run db:migrate`  | Create named migration           |
| `npm run db:seed`     | Seed database                    |
| `npm run db:studio`   | Open Prisma Studio               |

## Kubernetes (Minikube)

```bash
# 1. Start Minikube
minikube start

# 2. Point Docker to Minikube
eval $(minikube docker-env)

# 3. Build image
docker build -t devops-api:latest .

# 4. Apply manifests
kubectl apply -f k8s/configmap.yml
kubectl apply -f k8s/postgres.yml
kubectl apply -f k8s/api-deployment.yml
kubectl apply -f k8s/api-service.yml

# 5. Wait for pods
kubectl get pods -w

# 6. Access the API
minikube service api-service --url
```

## CI/CD

GitHub Actions runs on every push:

1. **Lint** — ESLint + Prettier check
2. **Test** — Jest with PostgreSQL service
3. **Build** — Docker image build
4. **Push** — Push to Docker Hub (main branch only)

Required GitHub Secrets for Docker Hub push:

- `DOCKER_USERNAME`
- `DOCKER_PASSWORD`

## License

MIT
