import { getEnvironment } from "./utils";
import { vpc } from "./vpc";

// https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/Concepts.DBInstanceClass.Types.html
const database = new sst.aws.Postgres("ActuallyMonolithDatabase", {
  vpc,
  proxy: true,
  version: "17.6",
  multiAz: false,
  instance: getEnvironment() === "production" ? "r7g.large" : "t4g.micro",
  storage: getEnvironment() === "production" ? "1 TB" : "20 GB",
  dev: {
    host: "localhost",
    port: 5432,
    username: "postgres",
    password: "postgres",
  },
});

export { database };
