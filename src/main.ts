import '../instrument';
import 'dotenv/config';

import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { CustomLogger } from './common/custom-logger.service';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: new CustomLogger({
      json: true,
    }),
    bufferLogs: true,
    cors: true,
  });
  await app.listen(process.env.PORT ?? 3000);
}

void bootstrap();
