export const domainName = (subdomain: string) => {
  return $app.stage === "production"
    ? `${subdomain}.actuallyhangout.com`
    : `${$app.stage}-${subdomain}.actuallyhangout.com`;
};

export const getNodeEnv = (stage: string = $app.stage) => {
  if (stage === "production") {
    return "production";
  } else if (stage === "staging") {
    return "staging";
  } else {
    return "development";
  }
};
export const getEnvironment = () => {
  return getNodeEnv($app.stage);
};

export const isDev = () => {
  return getNodeEnv() === "development";
};

export const getRegion = () => {
  return "us-east-2";
};

export const basicTags = {
  company: "actually-hangout",
  app: "actually-hangout",
  creator: "sst",
  stage: $app.stage,
  env: getEnvironment(),
};

export const isProd = () => {
  return getNodeEnv() === "production";
};
