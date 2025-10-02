import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { Client, Connection } from '@temporalio/client';
import { getTemporalConnection } from './temporal.config';

@Injectable()
export class TemporalService implements OnModuleInit, OnModuleDestroy {
  private client: Client | null = null;
  private connection: Connection | null = null;
  private initPromise: Promise<void> | null = null;

  async onModuleInit() {
    await this.initialize();
  }

  async onModuleDestroy() {
    if (this.connection) {
      await this.connection.close();
    }
  }

  private async initialize(): Promise<void> {
    // Guard against concurrent initialization
    if (this.initPromise) {
      return this.initPromise;
    }

    if (this.client) {
      return;
    }

    this.initPromise = (async () => {
      try {
        this.connection = await Connection.connect({
          ...getTemporalConnection(),
        });

        this.client = new Client({
          connection: this.connection,
          namespace: process.env.TEMPORAL_NAMESPACE || 'default',
        });
      } catch (error) {
        // Reset promise on failure to allow retry
        this.initPromise = null;
        throw error;
      }
    })();

    await this.initPromise;
  }

  async getClient(): Promise<Client> {
    await this.initialize();

    if (!this.client) {
      throw new Error('Temporal client is not initialized');
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
