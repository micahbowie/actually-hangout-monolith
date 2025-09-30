const Sentry = require('@sentry/nestjs');
const { nodeProfilingIntegration } = require('@sentry/profiling-node');

// Ensure to call this before requiring any other modules!
Sentry.init({
  dsn: 'https://130130fd36d7a1b44b82da6f3cc2f213@o4508907018190848.ingest.us.sentry.io/4510110423973888',
  integrations: [
    // Add our Profiling integration
    nodeProfilingIntegration(),
  ],

  // Add Tracing by setting tracesSampleRate
  // We recommend adjusting this value in production
  tracesSampleRate: 1.0,

  // Set sampling rate for profiling
  // This is relative to tracesSampleRate
  profilesSampleRate: 1.0,
});
