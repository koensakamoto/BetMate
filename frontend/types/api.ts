// API Types matching backend DTOs

export interface BetSummaryResponse {
  id: number;
  title: string;
  betType: BetType;
  status: BetStatus;
  outcome?: BetOutcome;
  creatorUsername: string;
  groupId: number;
  groupName: string;
  bettingDeadline: string; // ISO string
  resolveDate?: string; // ISO string
  totalPool: number;
  totalParticipants: number;
  createdAt: string; // ISO string
  hasUserParticipated: boolean;
  userChoice?: BetOutcome;
}

export interface BetResponse extends BetSummaryResponse {
  description?: string;
  resolutionMethod: BetResolutionMethod;
  minimumBet: number;
  maximumBet?: number;
  minimumVotesRequired: number;
  allowCreatorVote: boolean;
  resolvedAt?: string; // ISO string
  updatedAt: string; // ISO string
  canUserResolve: boolean;
  // Options
  option1: string;
  option2: string;
  option3?: string;
  option4?: string;
  // Pool distribution
  participantsForOption1: number;
  participantsForOption2: number;
  poolForOption1: number;
  poolForOption2: number;
}

export interface BetCreationRequest {
  title: string;
  description?: string;
  betType: BetType;
  groupId: number;
  bettingDeadline: string; // ISO string
  resolveDate?: string; // ISO string
  minimumBet: number;
  maximumBet?: number;
  resolutionMethod: BetResolutionMethod;
  minimumVotesRequired?: number;
  allowCreatorVote?: boolean;
  option1: string;
  option2: string;
  option3?: string;
  option4?: string;
}

export interface PlaceBetRequest {
  betId: number;
  choice: BetOutcome;
  amount: number;
}

export interface ResolveBetRequest {
  betId: number;
  outcome: BetOutcome;
  reason?: string;
}

// Enums from backend
export enum BetType {
  BINARY = 'BINARY',
  MULTIPLE_CHOICE = 'MULTIPLE_CHOICE',
  PARLAY = 'PARLAY',
  PREDICTION = 'PREDICTION',
  WEIGHTED = 'WEIGHTED',
  POOLED = 'POOLED'
}

export enum BetStatus {
  OPEN = 'OPEN',
  CLOSED = 'CLOSED',
  RESOLVED = 'RESOLVED',
  CANCELLED = 'CANCELLED'
}

export enum BetOutcome {
  OPTION_1 = 'OPTION_1',
  OPTION_2 = 'OPTION_2',
  OPTION_3 = 'OPTION_3',
  OPTION_4 = 'OPTION_4',
  DRAW = 'DRAW',
  CANCELLED = 'CANCELLED'
}

export enum BetResolutionMethod {
  CREATOR_ONLY = 'CREATOR_ONLY',
  ASSIGNED_RESOLVER = 'ASSIGNED_RESOLVER',
  CONSENSUS_VOTING = 'CONSENSUS_VOTING'
}

// User and Group types
export interface UserProfile {
  id: number;
  username: string;
  email: string;
  firstName?: string;
  lastName?: string;
  profileImageUrl?: string;
  createdAt: string;
}

export interface GroupSummary {
  id: number;
  groupName: string;
  description?: string;
  memberCount: number;
  isPublic: boolean;
  createdAt: string;
}

// API Response wrapper
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

// Pagination
export interface PagedResponse<T> {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  first: boolean;
  last: boolean;
}

// ==========================================
// MESSAGING TYPES
// ==========================================

// Message types matching backend DTOs
export interface MessageResponse {
  id: number;
  groupId: number;
  groupName: string;
  senderId: number | null;
  senderUsername: string;
  senderDisplayName: string;
  content: string;
  messageType: MessageType;
  attachmentUrl?: string;
  attachmentType?: string;
  isEdited: boolean;
  editedAt?: string; // ISO string
  replyCount: number;
  parentMessageId?: number;
  createdAt: string; // ISO string
  updatedAt: string; // ISO string
  canEdit: boolean;
  canDelete: boolean;
  canReply: boolean;
}

export interface MessageThreadResponse {
  parentMessage: MessageResponse;
  replies: MessageResponse[];
}

export interface SendMessageRequest {
  groupId: number;
  content: string;
  messageType?: MessageType;
  parentMessageId?: number;
  attachmentUrl?: string;
  attachmentType?: string;
}

export interface EditMessageRequest {
  content: string;
}

export interface MessageStatsResponse {
  totalMessages: number;
  totalActiveMessages: number;
  totalReplies: number;
  totalSenders: number;
  messagesLast24Hours: number;
  mostActiveUser?: string;
}

// Message search parameters
export interface MessageSearchParams {
  query: string;
  groupId: number;
  messageType?: MessageType;
  senderId?: number;
  fromDate?: string;
  toDate?: string;
}

// Message enums
export enum MessageType {
  TEXT = 'TEXT',
  IMAGE = 'IMAGE',
  FILE = 'FILE',
  SYSTEM = 'SYSTEM',
  BET_REFERENCE = 'BET_REFERENCE',
  ANNOUNCEMENT = 'ANNOUNCEMENT'
}

// ==========================================
// WEBSOCKET TYPES
// ==========================================

// WebSocket message types
export interface TypingIndicator {
  username: string;
  isTyping: boolean;
  groupId: number;
}

export interface UserPresence {
  username: string;
  status: PresenceStatus;
  lastSeen?: string;
}

export interface WebSocketError {
  error: string;
  timestamp: number;
}

export enum PresenceStatus {
  ONLINE = 'ONLINE',
  AWAY = 'AWAY',
  OFFLINE = 'OFFLINE'
}

// WebSocket event types
export interface WebSocketMessage<T = any> {
  type: WebSocketMessageType;
  payload: T;
  timestamp: number;
}

export enum WebSocketMessageType {
  MESSAGE = 'MESSAGE',
  MESSAGE_EDIT = 'MESSAGE_EDIT',
  MESSAGE_DELETE = 'MESSAGE_DELETE',
  TYPING_INDICATOR = 'TYPING_INDICATOR',
  USER_PRESENCE = 'USER_PRESENCE',
  NOTIFICATION = 'NOTIFICATION',
  ERROR = 'ERROR'
}

// ==========================================
// NOTIFICATION TYPES
// ==========================================

export interface NotificationResponse {
  id: number;
  userId: number;
  type?: NotificationType; // Frontend field
  notificationType?: string; // Backend field - actual data comes here
  title: string;
  content?: string; // Frontend field for compatibility
  message?: string; // Backend field - actual data comes here
  actionUrl?: string;
  priority: NotificationPriority;
  isRead: boolean;
  isDelivered?: boolean;
  relatedEntityId?: number;
  relatedEntityType?: string;
  createdAt: string; // ISO string
  readAt?: string; // ISO string
  deliveredAt?: string; // ISO string
}

export interface NotificationStats {
  totalNotifications: number;
  unreadNotifications: number;
  todayNotifications: number;
}

export interface NotificationCountResponse {
  unreadCount: number;
}

// Notification enums matching backend
export enum NotificationType {
  // Betting notifications
  BET_RESULT = 'BET_RESULT',
  BET_CREATED = 'BET_CREATED',
  BET_DEADLINE = 'BET_DEADLINE',
  BET_RESOLUTION_REMINDER = 'BET_RESOLUTION_REMINDER',
  BET_CANCELLED = 'BET_CANCELLED',

  // Financial notifications
  CREDITS_RECEIVED = 'CREDITS_RECEIVED',
  CREDITS_SPENT = 'CREDITS_SPENT',
  DAILY_BONUS = 'DAILY_BONUS',

  // Group notifications
  GROUP_INVITE = 'GROUP_INVITE',
  GROUP_JOIN_REQUEST = 'GROUP_JOIN_REQUEST',
  GROUP_MEMBER_JOINED = 'GROUP_MEMBER_JOINED',
  GROUP_MEMBER_LEFT = 'GROUP_MEMBER_LEFT',
  GROUP_ROLE_CHANGED = 'GROUP_ROLE_CHANGED',

  // Social notifications
  FRIEND_REQUEST = 'FRIEND_REQUEST',
  FRIEND_REQUEST_ACCEPTED = 'FRIEND_REQUEST_ACCEPTED',
  FRIEND_ACTIVITY = 'FRIEND_ACTIVITY',

  // Message notifications
  NEW_MESSAGE = 'NEW_MESSAGE',
  MESSAGE_MENTION = 'MESSAGE_MENTION',
  MESSAGE_REPLY = 'MESSAGE_REPLY',

  // Achievement notifications
  ACHIEVEMENT_UNLOCKED = 'ACHIEVEMENT_UNLOCKED',
  STREAK_MILESTONE = 'STREAK_MILESTONE',
  LEVEL_UP = 'LEVEL_UP',

  // System notifications
  SYSTEM_ANNOUNCEMENT = 'SYSTEM_ANNOUNCEMENT',
  MAINTENANCE = 'MAINTENANCE',
  ACCOUNT_WARNING = 'ACCOUNT_WARNING',
  WELCOME = 'WELCOME'
}

export enum NotificationPriority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  URGENT = 'URGENT'
}

// WebSocket notification payload
export interface NotificationWebSocketPayload {
  id: number;
  type: string;
  title: string;
  content: string;
  actionUrl?: string;
  priority: string;
  createdAt: string;
}