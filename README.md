# Actually Hangout - Monolith API

NestJS-based monolith API with GraphQL, PostgreSQL, and Clerk authentication.

## Prerequisites

- Node.js 18+
- PostgreSQL 14+
- pnpm (recommended) or npm
- Redis/Valkey (for caching)

## Getting Started

### 1. Install Dependencies

```bash
pnpm install
```

### 2. Environment Setup

Copy the example environment file and configure your variables:

```bash
cp .env.example .env
```

Update the following required variables in `.env`:

- `DATABASE_*` - PostgreSQL connection details
- `CLERK_*` - Clerk authentication keys from [Clerk Dashboard](https://dashboard.clerk.com)
- `VALKEY_URL` - Redis/Valkey connection string

### 3. Database Setup

Create your PostgreSQL database:

```bash
createdb actually_monolith
```

Run migrations:

```bash
pnpm migration:run
```

### 4. Start Development Server

```bash
pnpm start:dev
```

The server will start at `http://localhost:3000`

- GraphQL Playground: `http://localhost:3000/graphql` (dev only)
- Health Check: `http://localhost:3000/health/_details`
- Ping: `http://localhost:3000/health/ping`

## Database Migrations

### Create a new migration

```bash
pnpm migration:generate --name=YourMigrationName
```

### Run migrations

```bash
pnpm migration:run
```

### Revert last migration

```bash
pnpm migration:revert
```

### Show migrations

```bash
pnpm migration:show
```

## Project Structure

```
src/
├── main.ts                 # Application entry point
├── app.module.ts           # Root module
├── common/                 # Shared utilities
│   ├── custom-logger.service.ts
│   ├── logging.interceptor.ts
│   ├── request-context.service.ts
│   └── request-id.middleware.ts
├── db/                     # Database configuration
│   ├── config.ts           # TypeORM config for NestJS
│   ├── data-source.ts      # TypeORM DataSource for migrations
│   └── migrations/         # Database migrations
├── auth/                   # Clerk authentication
│   ├── clerk-auth.guard.ts
│   ├── clerk-auth.middleware.ts
│   └── decorators/
├── graphql/                # GraphQL middleware
│   └── graphql-logger.middleware.ts
├── health/                 # Health check endpoints
│   ├── health.controller.ts
│   └── health.module.ts
└── [feature-modules]/      # Feature-specific modules
    ├── *.module.ts
    ├── *.resolver.ts       # GraphQL resolvers
    ├── *.service.ts
    ├── entities/
    │   └── *.entity.ts     # TypeORM entities
    └── dto/
        └── *.input.ts      # GraphQL input types
```

## Features

### Authentication

Protected routes use Clerk authentication. Add the `@UseGuards(ClerkAuthGuard)` decorator to your resolvers:

```typescript
@Query(() => User)
@UseGuards(ClerkAuthGuard)
async me(@CurrentUser() auth: AuthObject) {
  return this.usersService.findOne(auth.userId);
}
```

### Logging

All logs include:
- `requestId` - Unique UUID for request tracing
- `timestamp` - ISO 8601 timestamp
- `responseTime` - Request latency in milliseconds
- Structured JSON format in production

### Database

TypeORM with PostgreSQL using snake_case naming convention. Entities use the `.entity.ts` suffix and are auto-discovered.

## Testing

```bash
# Unit tests
pnpm test

# E2E tests
pnpm test:e2e

# Test coverage
pnpm test:cov
```

## Building for Production

```bash
pnpm build
```

## Docker

Build and run with Docker:

```bash
docker build -t actually-monolith .
docker run -p 3000:3000 --env-file .env actually-monolith
```

## Linting & Formatting

```bash
# Lint
pnpm lint

# Format
pnpm format

# Run all checks
pnpm clean
```

## Scripts

- `pnpm start:dev` - Start development server with hot reload
- `pnpm start:prod` - Start production server
- `pnpm build` - Build for production
- `pnpm migration:generate` - Generate new migration
- `pnpm migration:run` - Run pending migrations
- `pnpm migration:revert` - Revert last migration
- `pnpm migration:show` - Show migration status

## Environment Variables

See `.env.example` for all available configuration options.

## License

UNLICENSED - Private/Proprietary
