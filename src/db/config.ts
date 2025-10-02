import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { DataSourceOptions } from 'typeorm';
import { SnakeNamingStrategy } from 'typeorm-naming-strategies';

// Validate database credentials for production
const username = process.env.DATABASE_USERNAME || 'postgres';
const password = process.env.DATABASE_PASSWORD || 'postgres';

if (process.env.NODE_ENV === 'production') {
  if (username === 'postgres' || password === 'postgres') {
    throw new Error(
      'Production environment cannot use default database credentials. Set DATABASE_USERNAME and DATABASE_PASSWORD environment variables.',
    );
  }
}

// Warn when using default credentials in non-production
if (
  process.env.NODE_ENV !== 'production' &&
  (username === 'postgres' || password === 'postgres')
) {
  console.warn(
    '[Database Config] Using default credentials for development. Not suitable for production.',
  );
}

// Shared database configuration
export const databaseConfig: DataSourceOptions = {
  type: 'postgres',
  host: process.env.DATABASE_HOST || 'localhost',
  port: parseInt(process.env.DATABASE_PORT || '5432', 10),
  username,
  password,
  database: process.env.DATABASE_NAME || 'actually_monolith',
  synchronize: false,
  migrationsRun: false,
  logging: process.env.NODE_ENV !== 'production',
  entities: [__dirname + '/../**/*.entity{.ts,.js}'],
  migrations: [__dirname + '/migrations/**/*{.ts,.js}'],
  migrationsTableName: 'schema_migrations',
  namingStrategy: new SnakeNamingStrategy(),
};

// NestJS-specific configuration
export const getDatabaseConfig = (): TypeOrmModuleOptions => databaseConfig;
