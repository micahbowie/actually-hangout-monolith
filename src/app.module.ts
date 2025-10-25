import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';

// sentry
import { SentryModule } from '@sentry/nestjs/setup';
import { APP_FILTER, APP_INTERCEPTOR } from '@nestjs/core';
import { SentryGlobalFilter } from '@sentry/nestjs/setup';

// cache
import { CacheModule } from '@nestjs/cache-manager';
import KeyvValkey from '@keyv/valkey';
import { Keyv } from 'keyv';
import { CacheableMemory } from 'cacheable';
import { HttpCacheInterceptor } from './cache/http-cache.interceptor';

// app
import { AppController } from './app.controller';
import { AppService } from './app.service';

// health
import { HealthModule } from './health/health.module';

// hello
import { HelloResolver } from './hello/hello.resolver';

// database
import { TypeOrmModule } from '@nestjs/typeorm';
import { getDatabaseConfig } from './db/config';

// graphql
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { join } from 'path';
import { isDev } from './utils';
import { GraphQLLoggerMiddleware } from './graphql/graphql-logger.middleware';

// auth
import { ClerkAuthMiddleware } from './auth/clerk-auth.middleware';

// common
import { RequestIdMiddleware } from './common/request-id.middleware';
import { LoggingInterceptor } from './common/logging.interceptor';

// temporal
import { TemporalModule } from './temporal/temporal.module';

// users
import { UsersModule } from './users/users.module';

// webhooks
import { WebhooksModule } from './webhooks/webhooks.module';

// hangouts
import { HangoutsModule } from './hangouts/hangouts.module';

const ONE_MINUTE_IN_MS = 60000;
const FIVE_THOUSAND = 5000;
const VALKEY_URL = isDev
  ? 'redis://localhost:6379'
  : `rediss://:${process.env.REDIS_PASSWORD}@${process.env.REDIS_HOST}:${process.env.REDIS_PORT}`;

@Module({
  imports: [
    SentryModule.forRoot(),
    TypeOrmModule.forRoot(getDatabaseConfig()),
    TemporalModule,
    UsersModule,
    WebhooksModule,
    HangoutsModule,
    HealthModule,
    CacheModule.registerAsync({
      isGlobal: true,
      useFactory: () => ({
        stores: [
          new Keyv({
            store: new CacheableMemory({
              ttl: ONE_MINUTE_IN_MS,
              lruSize: FIVE_THOUSAND,
            }),
          }),
          new KeyvValkey(VALKEY_URL),
        ],
      }),
    }),
    GraphQLModule.forRoot<ApolloDriverConfig>({
      driver: ApolloDriver,
      sortSchema: true,
      autoSchemaFile: join(process.cwd(), 'src/schema.gql'),
      playground: isDev,
    }),
  ],
  controllers: [AppController],
  providers: [
    AppService,
    HelloResolver,
    {
      provide: APP_FILTER,
      useClass: SentryGlobalFilter,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: LoggingInterceptor,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: HttpCacheInterceptor,
    },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    // Apply RequestIdMiddleware to all routes first
    consumer.apply(RequestIdMiddleware).forRoutes('*');

    // Apply auth and logging middleware to GraphQL routes
    consumer
      .apply(ClerkAuthMiddleware, GraphQLLoggerMiddleware)
      .forRoutes('graphql');
  }
}
