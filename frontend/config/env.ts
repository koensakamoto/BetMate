import Constants from 'expo-constants';

export type Environment = 'development' | 'staging' | 'production';

interface EnvConfig {
  API_BASE_URL: string;
  WS_BASE_URL: string;
  API_TIMEOUT: number;
  LOG_LEVEL: 'debug' | 'info' | 'warn' | 'error';
  ENABLE_API_LOGGING: boolean;
  ENABLE_CRASH_REPORTING: boolean;
}

const getEnvironment = (): Environment => {
  // Check if running in Expo development mode
  if (__DEV__) {
    return 'development';
  }
  
  // Check for staging build
  const releaseChannel = Constants.manifest?.releaseChannel;
  if (releaseChannel === 'staging') {
    return 'staging';
  }
  
  return 'production';
};

const getApiBaseUrl = (): string => {
  const env = getEnvironment();

  switch (env) {
    case 'development':
      // Use environment variable for dev API URL, fallback to localhost
      // Set EXPO_PUBLIC_DEV_API_URL in .env.local for local network testing
      const devUrl = process.env.EXPO_PUBLIC_DEV_API_URL || 'http://localhost:8080';
      console.log('[ENV] EXPO_PUBLIC_DEV_API_URL:', process.env.EXPO_PUBLIC_DEV_API_URL);
      console.log('[ENV] Using API URL:', devUrl);
      return devUrl;

    case 'staging':
      return 'https://api-staging.betmate.com';

    case 'production':
      return 'https://api.betmate.com';

    default:
      return 'http://localhost:8080';
  }
};

const getWebSocketUrl = (apiUrl: string): string => {
  return apiUrl.replace('http', 'ws') + '/ws';
};

const createEnvConfig = (): EnvConfig => {
  const env = getEnvironment();
  const apiBaseUrl = getApiBaseUrl();

  return {
    API_BASE_URL: apiBaseUrl,
    WS_BASE_URL: getWebSocketUrl(apiBaseUrl),
    API_TIMEOUT: env === 'development' ? 30000 : 15000, // Longer timeout in dev
    LOG_LEVEL: env === 'production' ? 'error' : 'debug',
    ENABLE_API_LOGGING: env !== 'production',
    ENABLE_CRASH_REPORTING: env === 'production',
  };
};

export const ENV = createEnvConfig();
export const ENVIRONMENT = getEnvironment();

// Debug helper - only logs in development
export const debugLog = (message: string, ...args: any[]) => {
  if (ENV.ENABLE_API_LOGGING) {
    console.log(`[${ENVIRONMENT.toUpperCase()}] ${message}`, ...args);
  }
};

// Error logging helper
export const errorLog = (message: string, error?: any) => {
  if (ENV.LOG_LEVEL === 'debug' || ENV.LOG_LEVEL === 'error') {
    console.error(`[${ENVIRONMENT.toUpperCase()}] ${message}`, error);
  }

  // In production, you might want to send to crash reporting service
  if (ENV.ENABLE_CRASH_REPORTING && error) {
    // TODO: Integrate with crash reporting service (e.g., Sentry, Bugsnag)
    // crashReporting.recordError(error, { message });
  }
};

// OAuth configuration validation
// Call this at app startup to warn about missing OAuth configuration
export const validateOAuthConfig = (): boolean => {
  const webClientId = Constants.expoConfig?.extra?.googleWebClientId;
  const iosClientId = Constants.expoConfig?.extra?.googleIosClientId;

  if (!webClientId || !iosClientId) {
    errorLog(
      'Missing OAuth configuration. Google Sign-In will not work. ' +
      'Set GOOGLE_WEB_CLIENT_ID and GOOGLE_IOS_CLIENT_ID via EAS Secrets or .env.local'
    );
    return false;
  }

  debugLog('OAuth configuration validated successfully');
  return true;
};