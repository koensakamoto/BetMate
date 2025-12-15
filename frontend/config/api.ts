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
    retryAttempts: 1, // 1 retry = 2 total requests max
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
  GROUP_PICTURE: (id: number) => `/groups/${id}/picture`,
  GROUP_MEMBERS: (id: number) => `/groups/${id}/members`,
  GROUP_PUBLIC: '/groups/public',
  GROUP_MY_GROUPS: '/groups/my-groups',
  GROUP_SEARCH: '/groups/search',
  GROUP_CHECK_NAME: '/groups/check-name',
  GROUP_JOIN: (groupId: number) => `/groups/${groupId}/join`,
  GROUP_LEAVE: (groupId: number) => `/groups/${groupId}/leave`,
  GROUP_INVITE: (groupId: number) => `/groups/${groupId}/invite`,
  GROUP_PENDING_REQUESTS: (groupId: number) => `/groups/${groupId}/pending-requests`,
  GROUP_PENDING_REQUESTS_COUNT: (groupId: number) => `/groups/${groupId}/pending-requests/count`,
  GROUP_APPROVE_REQUEST: (groupId: number, requestId: number) => `/groups/${groupId}/pending-requests/${requestId}/approve`,
  GROUP_DENY_REQUEST: (groupId: number, requestId: number) => `/groups/${groupId}/pending-requests/${requestId}/deny`,
  GROUP_ACCEPT_INVITATION: (membershipId: number) => `/groups/invitations/${membershipId}/accept`,
  GROUP_REJECT_INVITATION: (membershipId: number) => `/groups/invitations/${membershipId}/reject`,
  
  // Bets
  BETS: '/bets',
  BET_BY_ID: (id: number) => `/bets/${id}`,
  GROUP_BETS: (groupId: number) => `/bets/group/${groupId}`,
  MY_BETS: '/bets/my',
  BETS_BY_STATUS: (status: string) => `/bets/status/${status}`,
  PROFILE_BETS: (userId: number) => `/bets/profile/${userId}`,
  
  // Users
  USERS: '/users',
  USER_BY_ID: (id: number) => `/users/${id}`,
  USER_PROFILE: '/users/profile',
  USER_PROFILE_PICTURE: '/users/profile/picture',
  USER_PROFILE_VISIBILITY: '/users/profile/visibility',
  USER_PROFILE_USERNAME: '/users/profile/username',
  USER_PROFILE_EMAIL_REQUEST: '/users/profile/email/request',
  USER_PROFILE_EMAIL_CONFIRM: '/users/profile/email/confirm',
  USER_PROFILE_EMAIL_VALIDATE: '/users/profile/email/validate',
  USER_USERNAME_AVAILABILITY: (username: string) => `/users/availability/username/${username}`,
  USER_SEARCH: '/users/search',
  USER_STATS: (id: number) => `/users/${id}/stats`,
  USER_DATA_EXPORT: '/users/me/export',
  
  // Store
  STORE: '/store',
  
  // Messages
  MESSAGES: '/messages',

  // Contact/Support
  CONTACT_SUBMIT: '/contact/submit',

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