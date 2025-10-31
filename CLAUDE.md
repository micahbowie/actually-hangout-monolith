# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

NestJS-based monolith API with GraphQL, PostgreSQL, Clerk authentication, and Temporal workflow orchestration. Deployed using SST v3 to AWS with dual-service architecture (API + Worker).

## Essential Commands

### Development
```bash
pnpm start:dev              # Start development server with hot reload (kills port 3000)
pnpm start:worker           # Start Temporal worker process
pnpm dev                    # SST dev mode (stage: dev)
pnpm build                  # Production build
pnpm build:prod             # Build with Sentry sourcemaps
pnpm start:prod             # Start production server
```

### Database Migrations
```bash
pnpm migration:generate --name=YourMigrationName  # Generate new migration
pnpm migration:run          # Run pending migrations
pnpm migration:revert       # Revert last migration
pnpm migration:show         # Show migration status
pnpm typeorm                # Direct TypeORM CLI access
```

### Testing
```bash
pnpm test                   # Run all tests
pnpm test:watch             # Watch mode
pnpm test -- path/to/file   # Run single test file
pnpm test:cov               # Test coverage
pnpm test:e2e               # E2E tests
```

### Code Quality
```bash
pnpm lint                   # ESLint with auto-fix
pnpm format                 # Format with Prettier
pnpm clean                  # Run tests, lint, and format concurrently
pnpm check                  # Same as clean
```

### SST Deployment
```bash
pnpm deploy:dev             # Deploy to dev stage
pnpm deploy:staging         # Deploy to staging stage
pnpm deploy:prod            # Deploy to production stage
pnpm destroy:dev            # Remove dev stack
pnpm unlock:dev             # Unlock SST state
```

### Utilities
```bash
pnpm ngrok                  # Expose localhost with ngrok (requires ngrok.yml)
```

## Architecture Overview

### Dual-Service Pattern

The application deploys as two separate services:

1. **ActuallyMonolithWeb** - Main API server
   - GraphQL endpoint at `/graphql`
   - Health checks at `/health/_details` and `/_ping`
   - Handles all client requests
   - Auto-scales based on CPU/memory utilization

2. **ActuallyMonolithWorker** - Temporal worker
   - Processes workflows and activities
   - Runs independently from API
   - Same auto-scaling configuration as API

Both services share:
- Database (PostgreSQL via RDS)
- Cache (Valkey/Redis via ElastiCache)
- VPC and security groups
- Environment variables

### Module Structure

Feature modules follow standard NestJS patterns:
- `*.module.ts` - Module definition and imports
- `*.resolver.ts` - GraphQL resolvers (queries/mutations)
- `*.service.ts` - Business logic
- `*.spec.ts` - Jest unit tests
- `entities/*.entity.ts` - TypeORM entities
- `dto/*.input.ts` - GraphQL input types
- `types/*.ts` - TypeScript interfaces and types

Core modules:
- `users/` - User management
- `hangouts/` - Hangout creation and collaboration
- `webhooks/` - Clerk webhook handling for user sync
- `temporal/` - Workflow orchestration
- `auth/` - Clerk authentication guards and middleware
- `health/` - Health check endpoints
- `common/` - Shared utilities (logging, request context)

### Database

**TypeORM Configuration:**
- Two separate configs: `db/config.ts` (NestJS) and `db/data-source.ts` (CLI)
- Snake_case naming convention via `typeorm-naming-strategies`
- Migrations in `src/db/migrations/`
- Entities auto-discovered with `.entity.ts` suffix
- PostgreSQL with connection pooling

**Migration Workflow:**
1. Create/modify entity classes
2. Generate migration: `pnpm migration:generate --name=DescriptiveName`
3. Review generated SQL in `src/db/migrations/`
4. Run migration: `pnpm migration:run`

### GraphQL

**Schema Generation:**
- Code-first approach using decorators
- Auto-generated schema at `src/schema.gql`
- GraphQL Playground enabled in development only
- All resolvers use `@Resolver()` decorator

**Adding New Queries/Mutations:**
1. Create input DTO with `@InputType()` and `@Field()` decorators
2. Add resolver method with `@Query()` or `@Mutation()` decorator
3. Implement business logic in service
4. Schema auto-updates on server restart

### Authentication

**Clerk Integration:**
- `ClerkAuthGuard` - Applied via `@UseGuards(ClerkAuthGuard)` to protect resolvers
- `ClerkAuthMiddleware` - Applied globally to `/graphql` route
- `@CurrentUser()` decorator - Injects `AuthObject` with `userId` into resolver

**Usage Pattern:**
```typescript
@Mutation(() => Boolean)
@UseGuards(ClerkAuthGuard)
async protectedMutation(
  @CurrentUser() auth: AuthObject,
  @Args('input') input: SomeInput,
): Promise<boolean> {
  // auth.userId is guaranteed to exist
}
```

**Webhook Validation:**
- Clerk webhooks in `webhooks/` module
- Svix signature verification via `ClerkWebhookGuard`
- User sync handled by Temporal workflows

### Temporal Workflows

**Architecture:**
- **Workflows** (`temporal/workflows/`) - Durable orchestration logic
- **Activities** (`temporal/activities/`) - Individual tasks with retry logic
- **Worker** (`temporal/worker/`) - Separate process that executes workflows
- **Task Queue:** `actually-core-logic` - Must match between client and worker

**Starting a Workflow:**
```typescript
import { TemporalService } from '../temporal/temporal.service';
import { yourWorkflow } from '../temporal/workflows';
import { v4 as uuidv4 } from 'uuid';

constructor(private readonly temporalService: TemporalService) {}

async executeWorkflow() {
  const client = await this.temporalService.getClient();
  const workflowId = `workflow-${uuidv4()}`;

  // Fire-and-forget
  await client.workflow.start(yourWorkflow, {
    args: [{ /* workflow args */ }],
    workflowId,
    taskQueue: 'actually-core-logic',
    workflowExecutionTimeout: '1m',
  });

  // Or wait for result
  const handle = await client.workflow.start(/* same args */);
  const result = await handle.result();
  return result;
}
```

**Local Development:**
- Start Temporal server: `temporal server start-dev`
- Start worker: `pnpm start:worker`
- Temporal UI: `http://localhost:8233`

**Cloud Deployment:**
- Uses Temporal Cloud in staging/production
- Configured via `TEMPORAL_ADDRESS`, `TEMPORAL_NAMESPACE`, `TEMPORAL_API_KEY`
- Worker runs as separate ECS service

### Logging and Observability

**Structured Logging:**
- `CustomLogger` with JSON output in production
- All logs include `requestId`, `timestamp`, `responseTime`
- Use `Logger` from `@nestjs/common` in services/resolvers

**Sentry Integration:**
- Error tracking via `@sentry/nestjs`
- Source maps uploaded via `pnpm build:prod`
- Capture errors with `Sentry.captureException(error, { extra: { ... } })`

**Health Checks:**
- `/_ping` - Simple 200 response for load balancer
- `/health/_details` - Terminus health checks with DB/cache status

### Caching

**Multi-tier Cache:**
- L1: In-memory (`CacheableMemory`) - 60s TTL, 5000 items LRU
- L2: Valkey/Redis - Distributed cache
- Applied via `HttpCacheInterceptor` (HTTP) or manual `@Inject(CACHE_MANAGER)`

### SST Infrastructure

**Infrastructure as Code:**
- `infra/` directory contains SST v3 definitions
- `infra/vpc.ts` - VPC and networking
- `infra/database.ts` - RDS PostgreSQL
- `infra/elasticache.ts` - Valkey/Redis cluster
- `infra/services.ts` - ECS services with auto-scaling
- `infra/secrets.ts` - Secret references (Clerk, Temporal, Sentry)

**Environment-Specific Config:**
- Development: 1 task, 2GB RAM, 1 vCPU
- Staging: 1-2 tasks, 2GB RAM, 1 vCPU
- Production: 4-16 tasks, 8GB RAM, 4 vCPU

**SST Dev Mode:**
- Run `pnpm dev` to start SST dev with local development
- Services run locally, infrastructure in AWS
- Hot reload enabled for all code changes

## Testing Conventions

**Test Structure:**
- Test descriptions do NOT start with "should"
- Use present tense: "returns user" not "should return user"
- Mock external dependencies (TypeORM repositories, Temporal client)
- Use `jest.mock()` for modules like `uuid`

**Example:**
```typescript
describe('HangoutsService', () => {
  let service: HangoutsService;

  describe('createHangout', () => {
    it('creates hangout with organizer', async () => {
      // test implementation
    });
  });
});
```

## Development Workflow

### Adding a GraphQL Feature

1. Create input DTO in `dto/*.input.ts`
2. Add entity if needed in `entities/*.entity.ts`
3. Implement service method in `*.service.ts`
4. Add resolver method in `*.resolver.ts` with auth guard
5. Write unit tests in `*.spec.ts`
6. Run tests and lint: `pnpm clean`

### Database Schema Changes

1. Modify entity classes
2. Generate migration: `pnpm migration:generate --name=DescriptiveName`
3. Review generated SQL carefully
4. Test locally: `pnpm migration:run`
5. Deploy will auto-run migrations in staging/production

### Deploying Changes

1. Commit changes with descriptive message
2. Push to main branch
3. Deploy: `pnpm deploy:staging` or `pnpm deploy:prod`
4. Monitor logs and Sentry for errors
5. Check Temporal workflows if applicable

## Environment Variables

See `.env.example` for all available configuration. Key variables:

**Application:**
- `NODE_ENV` - Set by SST based on stage
- `PORT` - Default 3000
- `PROCESS_TYPE` - Either "api" or "worker"

**Database:**
- `DATABASE_HOST`, `DATABASE_PORT`, `DATABASE_USERNAME`, `DATABASE_PASSWORD`, `DATABASE_NAME`

**Authentication:**
- `CLERK_PUBLISHABLE_KEY` - From Clerk dashboard
- `CLERK_SECRET_KEY` - From Clerk dashboard
- `CLERK_WEBHOOK_SIGNING_SECRET` - For webhook validation

**Cache:**
- `REDIS_HOST`, `REDIS_PORT`, `REDIS_PASSWORD` - Valkey/Redis connection
- `VALKEY_URL` - Full connection string (alternative)

**Temporal:**
- `TEMPORAL_ADDRESS` - localhost:7233 in dev, Temporal Cloud in staging/prod
- `TEMPORAL_NAMESPACE` - "default" in dev, specific namespace in staging/prod
- `TEMPORAL_API_KEY` - Required for Temporal Cloud

**Observability:**
- Sentry credentials configured via SST secrets and build args

## Common Patterns

### Error Handling
- Use NestJS exceptions: `throw new UnauthorizedException('message')`
- Log errors with structured data before throwing
- Capture critical errors in Sentry with context

### Request Context
- `RequestIdMiddleware` adds unique `requestId` to all requests
- Access via `RequestContextService.getRequestId()`
- Automatically included in all logs

### Transaction Management
- Use TypeORM transaction manager for multi-step operations
- Pass manager to service methods when needed
- Rollback handled automatically on errors

## Known Issues and Gotchas

- `start:dev` kills port 3000 automatically - expected behavior
- GraphQL Playground only available in development
- Temporal worker must be running separately from API
- ESLint ignores `infra/`, `sst.config.ts`, and `sst-env.d.ts`
- TypeScript strict mode disabled for some rules (see `eslint.config.mjs`)
- Sentry requires `SENTRY_AUTH_TOKEN` as build arg for source maps

## Important
- Run pnpm clean after your changes are complete
- Use the code review subagent to review the changes once done
- Ensure all proper types are used
- Add unit tests for the changes
- Ensure no unit tests have the word "should". Unit test descriptions need to read like they start with "it" for exmaple: "returns the user object" . in the example the test has an implicit it at the start
- Breakdown temporal into idempotent activities
- Make sure there is json logging throughout the changes
- when paginating with graphql use the graphql connection pattern
- Update the /docs directory with relevant sequence diagrams and relational data model representations using mermaid
