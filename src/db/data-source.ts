import 'dotenv/config';
import { DataSource } from 'typeorm';
import { databaseConfig } from './config';

// DataSource for TypeORM CLI migrations
// Uses shared config from config.ts
export const AppDataSource = new DataSource(databaseConfig);
