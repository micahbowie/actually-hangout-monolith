import { vpc } from "./vpc";
import { getEnvironment } from "./utils";

// https://docs.aws.amazon.com/AmazonElastiCache/latest/dg/CacheNodes.SupportedTypes.html
const cache = new sst.aws.Redis("ActuallyMonolithCache", {
  vpc,
  engine: "valkey",
  cluster: false,
  instance: getEnvironment() === "production" ? "m6g.large" : "t4g.micro",
  dev: {
    host: "localhost",
    port: 6379,
  },
});

export { cache };
