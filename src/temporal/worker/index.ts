import 'reflect-metadata';
import '../../../instrument';
import 'dotenv/config';
import { Worker, NativeConnection } from '@temporalio/worker';
import { DataSource } from 'typeorm';
import { Logger } from '@nestjs/common';
import { join } from 'path';
import * as activities from '../activities';
import { getTemporalConnection } from '../temporal.config';
import { databaseConfig } from '../../db/config';
import { User } from '../../users/entities/user.entity';
import { UsersService } from '../../users/users.service';
import { setUsersService } from '../activities/user-sync.activity';
import { setUsersServiceForPushToken } from '../activities/push-token.activity';

const logger = new Logger('TemporalWorker');

async function runWorker() {
  let connection: NativeConnection | undefined;
  let dataSource: DataSource | undefined;

  try {
    // Initialize database connection
    logger.log('Initializing database connection...');
    dataSource = new DataSource({
      ...databaseConfig,
      entities: [User],
    });
    await dataSource.initialize();
    logger.log('Database connected');

    // Create UsersService instance
    const userRepository = dataSource.getRepository(User);
    const usersService = new UsersService(userRepository);

    // Inject UsersService into activities
    setUsersService(usersService);
    setUsersServiceForPushToken(usersService);
    logger.log('UsersService initialized for activities');

    // Connect to Temporal
    connection = await NativeConnection.connect({
      ...getTemporalConnection(),
    });

    const worker = await Worker.create({
      namespace: process.env.TEMPORAL_NAMESPACE || 'default',
      connection,
      workflowsPath: join(__dirname, '../workflows'),
      activities,
      taskQueue: 'actually-core-logic',
    });

    logger.log('Temporal worker started successfully');
    await worker.run();
  } finally {
    if (connection) {
      await connection.close();
      logger.log('Temporal connection closed');
    }
    if (dataSource && dataSource.isInitialized) {
      await dataSource.destroy();
      logger.log('Database connection closed');
    }
  }
}

runWorker().catch((err) => {
  logger.error('Failed to start Temporal worker:', err);
  process.exit(1);
});
