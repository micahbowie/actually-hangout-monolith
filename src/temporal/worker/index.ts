import '../../../instrument';
import 'dotenv/config';
import { Worker, NativeConnection } from '@temporalio/worker';
import { join } from 'path';
import * as activities from '../activities';
import { getTemporalConnection } from '../temporal.config';

async function runWorker() {
  let connection: NativeConnection | undefined;
  try {
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

    console.log('Temporal worker started successfully');
    await worker.run();
  } finally {
    if (connection) {
      await connection.close();
      console.log('Temporal connection closed');
    }
  }
}

runWorker().catch((err) => {
  console.error('Failed to start Temporal worker:', err);
  process.exit(1);
});
