/// <reference path="./.sst/platform/config.d.ts" />

export const getNodeEnv = (stage: string) => {
  if (stage === 'production') {
    return 'production';
  } else if (stage === 'staging') {
    return 'staging';
  } else {
    return 'development';
  }
};

export const higherEnv = (stage: string) => {
  return ['production', 'staging'].includes(stage);
};

export default $config({
  app(input) {
    return {
      name: 'actually-monolith',
      removal: 'remove',
      protect: false,
      // removal: higherEnv(input?.stage) ? "retain" : "remove",
      // protect: higherEnv(input?.stage),
      home: 'aws',
      providers: {
        aws: {
          profile: 'GOOD_FOR_NOTHING_DEV',
          region: 'us-east-2',
        },
      },
      env: {
        NODE_ENV: getNodeEnv(input?.stage),
      },
      stage: input?.stage,
      region: 'us-east-2',
    };
  },
  async run() {
    await import('./infra/database.js');
    await import('./infra/elasticache.js');
    await import('./infra/vpc.js');
    const service = await import('./infra/services.js');
    await import('./infra/dev.js');

    return {
      actuallyMonolith: 'actually-monolith',
      actuallyMonolithWeb: service.actuallyMonolith.url,
      environment: getNodeEnv($app.stage),
    };
  },
});
