import { Module } from '@nestjs/common';

// sentry
import { SentryModule } from '@sentry/nestjs/setup';
import { APP_FILTER } from '@nestjs/core';
import { SentryGlobalFilter } from '@sentry/nestjs/setup';

// app
import { AppController } from './app.controller';
import { AppService } from './app.service';

// health
import { HealthModule } from './health/health.module';

// hello
import { HelloResolver } from './hello/hello.resolver';

// graphql
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { join } from 'path';

const isProduction = process.env.NODE_ENV === 'production';

@Module({
  imports: [
    SentryModule.forRoot(),
    HealthModule,
    GraphQLModule.forRoot<ApolloDriverConfig>({
      driver: ApolloDriver,
      sortSchema: true,
      autoSchemaFile: join(process.cwd(), 'src/schema.gql'),
      playground: !isProduction,
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
  ],
})
export class AppModule {}
