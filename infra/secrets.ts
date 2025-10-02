const temporalApiKey = new sst.Secret("TemporalApiKey");
const ClerkPublishableKey = new sst.Secret("ClerkPublishableKey");
const ClerkSecretKey = new sst.Secret("ClerkSecretKey");
const ClerkWebhookSecret = new sst.Secret("ClerkWebhookSecret");

export {
  temporalApiKey,
  ClerkPublishableKey,
  ClerkSecretKey,
  ClerkWebhookSecret,
};
