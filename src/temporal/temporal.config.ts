import { isDev } from '../utils';

export const getTemporalConnection = () => {
  const address = process.env.TEMPORAL_ADDRESS || 'localhost:7233';

  if (isDev) {
    return {
      address,
      tls: false,
    };
  }

  const apiKey = process.env.TEMPORAL_API_KEY;
  if (!apiKey) {
    throw new Error(
      'TEMPORAL_API_KEY is required for production environment. Set TEMPORAL_API_KEY environment variable.',
    );
  }

  return {
    address,
    tls: true,
    apiKey,
  };
};
