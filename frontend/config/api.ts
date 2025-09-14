import { ENV, ENVIRONMENT } from './env';

export interface ApiConfig {
  baseURL: string;
  timeout: number;
  retryAttempts: number;
  retryDelay: number;
  wsURL: string;
}

// Get API configuration based on environment
const getApiConfig = (): ApiConfig => {
  return {
    baseURL: `${ENV.API_BASE_URL}/api`,
    wsURL: ENV.WS_BASE_URL,
    timeout: ENV.API_TIMEOUT,
    retryAttempts: ENVIRONMENT === 'production' ? 2 : 3,
    retryDelay: 1000, // 1 second
  };
};

export const apiConfig = getApiConfig();

// API endpoints
export const API_ENDPOINTS = {
  // Auth
  LOGIN: '/auth/login',
  REGISTER: '/users/register',
  REFRESH: '/auth/refresh',
  LOGOUT: '/auth/logout',
  ME: '/auth/me',
  CHANGE_PASSWORD: '/auth/change-password',
  
  // Groups
  GROUPS: '/groups',
  GROUP_CREATE: '/groups',
  GROUP_BY_ID: (id: number) => `/groups/${id}`,
  GROUP_UPDATE: (id: number) => `/groups/${id}`,
  GROUP_MEMBERS: (id: number) => `/groups/${id}/members`,
  GROUP_PUBLIC: '/groups/public',
  GROUP_MY_GROUPS: '/groups/my-groups',
  GROUP_SEARCH: '/groups/search',
  GROUP_CHECK_NAME: '/groups/check-name',
  
  // Bets
  BETS: '/bets',
  BET_BY_ID: (id: number) => `/bets/${id}`,
  GROUP_BETS: (groupId: number) => `/bets/group/${groupId}`,
  MY_BETS: '/bets/my',
  BETS_BY_STATUS: (status: string) => `/bets/status/${status}`,
  
  // Users
  USERS: '/users',
  USER_BY_ID: (id: number) => `/users/${id}`,
  USER_PROFILE: '/users/profile',
  USER_SEARCH: '/users/search',
  USER_STATS: (id: number) => `/users/${id}/stats`,
  
  // Store
  STORE: '/store',
  
  // Messages
  MESSAGES: '/messages',
} as const;