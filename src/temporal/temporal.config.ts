import { isDev } from '../utils';

export const getTemporalConnection = () => {
  // Always default to localhost:7233 if no address is provided
  const address =
    process.env.TEMPORAL_ADDRESS ||
    (isDev ? 'localhost:7233' : 'localhost:7233');

  if (isDev) {
    return {
      address,
      tls: false,
    };
  }

  return {
    address,
    tls: true,
    apiKey: process.env.TEMPORAL_API_KEY || '',
  };
};
