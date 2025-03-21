import 'dotenv/config';

export default ({ config }) => {
  // Get the API URL from environment variables
  const apiUrl = process.env.EXPO_PUBLIC_API_URL;
  
  // Define environment-specific configurations
  const envConfig = {
    development: {
      apiUrl: apiUrl || 'http://localhost:3000',
    },
    staging: {
      apiUrl: apiUrl || 'https://staging-api.heavenlyhub.app',
    },
    production: {
      apiUrl: apiUrl || 'https://api.heavenlyhub.app',
    },
  };

  // Determine the current environment
  const env = process.env.APP_ENV || 'development';

  return {
    ...config,
    name: config.name,
    slug: config.slug,
    version: config.version,
    extra: {
      ...config.extra,
      apiUrl: envConfig[env].apiUrl,
      environment: env,
      eas: {
        projectId: process.env.EAS_PROJECT_ID || config.extra?.eas?.projectId,
      },
    },
    updates: {
      ...config.updates,
      url: process.env.EXPO_UPDATES_URL || config.updates?.url,
    },
    // Add any additional configuration overrides
  };
}; 