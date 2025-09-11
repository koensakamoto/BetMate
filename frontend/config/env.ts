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
      // TEMPORARY FIX: Use working IP directly to isolate the issue
      console.log(`[DEVELOPMENT] 🔧 Using hardcoded working IP for debugging`);
      return 'http://192.168.1.231:8080';
      
    case 'staging':
      return 'https://api-staging.groupreels.com';
      
    case 'production':
      return 'https://api.groupreels.com';
      
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
  
  // Debug logging for development
  if (env === 'development') {
    console.log(`[${env.toUpperCase()}] 🔧 API Base URL: ${apiBaseUrl}`);
  }
  
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