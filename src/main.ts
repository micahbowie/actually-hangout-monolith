import '../instrument';

import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConsoleLogger } from '@nestjs/common';
import { GraphQLLogger } from './logger/graphql-logger.service';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: new ConsoleLogger({
      json: true,
    }),
    bufferLogs: true,
  });
  app.useLogger(app.get(GraphQLLogger));
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
