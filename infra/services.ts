import { domainName, getEnvironment, isDev, isProd } from "./utils";
import { vpc } from "./vpc";
import { cache } from "./elasticache";
import { database } from "./database";
import {
  ClerkPublishableKey,
  ClerkSecretKey,
  temporalApiKey,
  ClerkWebhookSecret,
  SentryAuthToken,
} from "./secrets";

const scalingConfig = () => {
  const nodeEnv = getEnvironment();
  switch (nodeEnv) {
    case "production":
      return {
        min: 4,
        max: 16,
        cpuUtilization: 60,
        memoryUtilization: 60,
      };
    case "staging":
      return {
        min: 1,
        max: 2,
        cpuUtilization: 60,
        memoryUtilization: 60,
      };
    case "development":
      return {
        min: 1,
        max: 1,
        cpuUtilization: 60,
        memoryUtilization: 60,
      };
    default: {
      return {
        min: 1,
        max: 1,
        cpuUtilization: 60,
        memoryUtilization: 60,
      };
    }
  }
};

const memoryConfig = () => {
  const nodeEnv = getEnvironment();
  switch (nodeEnv) {
    case "production":
      return "8 GB";
    case "staging":
      return "2 GB";
    case "development":
      return "2 GB";
    default:
      return "2 GB";
  }
};

const cpuConfig = () => {
  const nodeEnv = getEnvironment();
  switch (nodeEnv) {
    case "production":
      return "4 vCPU";
    case "staging":
      return "1 vCPU";
    case "development":
      return "1 vCPU";
    default:
      return "1 vCPU";
  }
};

const cluster = new sst.aws.Cluster("ActuallyMonolith", { vpc });

const actuallyMonolith = new sst.aws.Service("ActuallyMonolithWeb", {
  cluster,
  loadBalancer: {
    domain: domainName("api"),
    rules: [
      { listen: "80/http", redirect: "443/https" },
      { listen: "443/https", forward: "3000/http" },
    ],
    health: {
      "3000/http": {
        path: "/_ping",
        healthyThreshold: 5,
        successCodes: "200",
        timeout: "5 seconds",
        unhealthyThreshold: 2,
        interval: "60 seconds",
      },
    },
  },
  wait: isProd(),
  image: {
    context: ".",
    dockerfile: "Dockerfile",
    args:{
      SENTRY_ORG: "good-for-nothing-tech",
      SENTRY_PROJECT: "actually-monolith2",
      SENTRY_AUTH_TOKEN: SentryAuthToken.value,
    }
  },
  logging: {
    retention: "forever",
  },
  scaling: {
    ...scalingConfig(),
  },
  memory: memoryConfig(),
  cpu: cpuConfig(),
  link: [cache, database],
  dev: {
    command: "npm run start:dev",
    url: "http://localhost:3000",
  },
  environment: {
    NODE_ENV: getEnvironment(),
    REDIS_HOST: cache.host,
    REDIS_PORT: "6379",
    REDIS_USERNAME: cache.username,
    REDIS_PASSWORD: cache.password || "",
    DATABASE_HOST: database.host,
    DATABASE_PORT: "5432",
    DATABASE_USERNAME: database.username,
    DATABASE_PASSWORD: database.password || "",
    DATABASE_NAME: database.database,
    PROCESS_TYPE: "api",
    TEMPORAL_ADDRESS: isDev()
      ? "localhost:7233"
      : "us-east-2.aws.api.temporal.io:7233",
    TEMPORAL_NAMESPACE: isDev() ? "default" : "actuallyhangout-dev.yueyc",
    TEMPORAL_API_KEY: temporalApiKey.value,
    CLERK_PUBLISHABLE_KEY: ClerkPublishableKey.value,
    CLERK_SECRET_KEY: ClerkSecretKey.value,
    CLERK_WEBHOOK_SIGNING_SECRET: ClerkWebhookSecret.value,
  },
});

const actuallyMonolithWorker = new sst.aws.Service("ActuallyMonolithWorker", {
  cluster,
  image: {
    context: ".",
    dockerfile: "Dockerfile",
  },
  logging: {
    retention: "forever",
  },
  scaling: {
    ...scalingConfig(),
  },
  memory: memoryConfig(),
  cpu: cpuConfig(),
  link: [cache, database],
  dev: {
    command: "npm run start:worker",
  },
  environment: {
    NODE_ENV: getEnvironment(),
    REDIS_HOST: cache.host,
    REDIS_PORT: "6379",
    REDIS_USERNAME: cache.username,
    REDIS_PASSWORD: cache.password || "",
    DATABASE_HOST: database.host,
    DATABASE_PORT: "5432",
    DATABASE_USERNAME: database.username,
    DATABASE_PASSWORD: database.password || "",
    DATABASE_NAME: database.database,
    PROCESS_TYPE: "worker",
    TEMPORAL_ADDRESS: isDev()
      ? "localhost:7233"
      : "us-east-2.aws.api.temporal.io:7233",
    TEMPORAL_NAMESPACE: isDev() ? "default" : "actuallyhangout-dev.yueyc",
    TEMPORAL_API_KEY: temporalApiKey.value,
  },
});

export { actuallyMonolith, actuallyMonolithWorker };
