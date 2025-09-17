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

  // Friendships
  FRIENDSHIPS: '/friendships',
  FRIENDS_LIST: '/friendships/friends',
  FRIENDS_COUNT: '/friendships/friends/count',
  FRIEND_REQUEST: (accepterId: number) => `/friendships/request/${accepterId}`,
  ACCEPT_FRIEND_REQUEST: (friendshipId: number) => `/friendships/${friendshipId}/accept`,
  REJECT_FRIEND_REQUEST: (friendshipId: number) => `/friendships/${friendshipId}/reject`,
  REMOVE_FRIEND: (friendId: number) => `/friendships/remove/${friendId}`,
  FRIENDSHIP_STATUS: (userId: number) => `/friendships/status/${userId}`,
  PENDING_REQUESTS_SENT: '/friendships/requests/sent',
  PENDING_REQUESTS_RECEIVED: '/friendships/requests/received',
  PENDING_REQUESTS_COUNT: '/friendships/requests/received/count',
  MUTUAL_FRIENDS: (userId: number) => `/friendships/mutual/${userId}`,
  MUTUAL_FRIENDS_COUNT: (userId: number) => `/friendships/mutual/${userId}/count`,
} as const;