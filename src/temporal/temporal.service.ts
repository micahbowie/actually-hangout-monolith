import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { Client, Connection } from '@temporalio/client';
import { getTemporalConnection } from './temporal.config';

@Injectable()
export class TemporalService implements OnModuleInit, OnModuleDestroy {
  private client: Client | null = null;
  private connection: Connection | null = null;

  async onModuleInit() {
    await this.getClient();
  }

  async onModuleDestroy() {
    if (this.connection) {
      await this.connection.close();
    }
  }

  async getClient(): Promise<Client> {
    if (!this.client) {
      this.connection = await Connection.connect({
        ...getTemporalConnection(),
      });

      this.client = new Client({
        connection: this.connection,
        namespace: process.env.TEMPORAL_NAMESPACE || 'default',
      });
    }

    return this.client;
  }

  async isHealthy(): Promise<boolean> {
    try {
      const client = await this.getClient();
      // Simple health check - try to get client info
      await client.connection.workflowService.getSystemInfo({});
      return true;
    } catch {
      return false;
    }
  }
}
