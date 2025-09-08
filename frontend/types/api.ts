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