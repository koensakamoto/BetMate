import { BaseApiService } from '../api/baseService';
import { API_ENDPOINTS } from '../../config/api';

export interface CreateBetRequest {
  groupId: number;
  title: string;
  description?: string;
  betType: 'MULTIPLE_CHOICE' | 'PREDICTION'; // | 'OVER_UNDER' (COMMENTED OUT - TODO: Implement later)
  resolutionMethod: 'CREATOR_ONLY' | 'ASSIGNED_RESOLVER' | 'CONSENSUS_VOTING';
  bettingDeadline: string; // ISO string
  resolveDate?: string; // ISO string
  minimumBet: number; // DEPRECATED: For backward compatibility with variable-stake bets
  maximumBet?: number; // DEPRECATED: For backward compatibility with variable-stake bets
  fixedStakeAmount?: number; // NEW: Fixed stake amount - everyone must bet exactly this amount (for CREDIT bets)
  stakeType?: 'CREDIT' | 'SOCIAL'; // NEW: Type of stake - CREDIT uses in-game credits, SOCIAL is fun stakes
  socialStakeDescription?: string; // NEW: Description for social bets (e.g., "Loser buys pizza")
  minimumVotesRequired?: number;
  allowCreatorVote?: boolean;
  options?: string[];
}

export interface BetResponse {
  id: number;
  title: string;
  description?: string;
  betType: string;
  status: string;
  outcome?: string;
  resolutionMethod: string;
  creator: {
    id: number;
    username: string;
    email: string;
    firstName: string;
    lastName: string;
    bio?: string;
    displayName: string;
    emailVerified: boolean;
    isActive: boolean;
    createdAt: string;
  };
  groupId: number;
  groupName: string;
  bettingDeadline: string;
  resolveDate?: string;
  resolvedAt?: string;
  minimumBet: number; // DEPRECATED: For backward compatibility with variable-stake bets
  maximumBet?: number; // DEPRECATED: For backward compatibility with variable-stake bets
  fixedStakeAmount?: number; // NEW: Fixed stake amount - everyone must bet exactly this amount (for CREDIT bets)
  stakeType?: 'CREDIT' | 'SOCIAL'; // NEW: Type of stake - CREDIT uses in-game credits, SOCIAL is fun stakes
  socialStakeDescription?: string; // NEW: Description for social bets (e.g., "Loser buys pizza")
  fulfillmentStatus?: 'PENDING' | 'PARTIALLY_FULFILLED' | 'FULFILLED'; // NEW: Fulfillment tracking status
  loserClaimedFulfilledAt?: string; // NEW: When loser claimed they fulfilled
  loserFulfillmentProofUrl?: string; // NEW: Photo proof from loser
  loserFulfillmentProofDescription?: string; // NEW: Text description from loser
  allWinnersConfirmedAt?: string; // NEW: When all winners confirmed
  totalPool: number;
  totalParticipants: number;
  minimumVotesRequired: number;
  allowCreatorVote: boolean;
  createdAt: string;
  updatedAt: string;
  hasUserParticipated: boolean;
  userChoice?: string;
  userAmount?: number;
  canUserResolve: boolean;
}

export interface BetSummaryResponse {
  id: number;
  title: string;
  betType: string;
  status: string;
  outcome?: string;
  creatorUsername: string;
  groupId: number;
  groupName: string;
  bettingDeadline: string;
  resolveDate?: string;
  stakeType?: 'CREDIT' | 'SOCIAL'; // NEW: Type of stake
  fixedStakeAmount?: number; // For CREDIT bets
  socialStakeDescription?: string; // For SOCIAL bets
  totalPool: number;
  totalParticipants: number;
  createdAt: string;
  hasUserParticipated: boolean;
  userAmount?: number;
  participantPreviews?: {
    id: number;
    username: string;
    firstName: string;
    lastName: string;
    profileImageUrl?: string;
  }[];
}

export interface PlaceBetRequest {
  chosenOption?: number; // For BINARY, MULTIPLE_CHOICE bets
  amount: number;
  comment?: string;
  predictedValue?: string; // For PREDICTION bets
}

export interface BetParticipationResponse {
  participationId: number;
  userId: number;
  username: string;
  displayName: string;
  profileImageUrl?: string;
  chosenOption?: number;
  chosenOptionText?: string;
  predictedValue?: string;
  betAmount: number;
  potentialWinnings?: number;
  status: string;
  createdAt: string;
}

export interface ResolveBetRequest {
  outcome?: string;
  winnerUserIds?: number[];
  reasoning?: string;
}

export interface VoteOnResolutionRequest {
  outcome: string;
  reasoning: string;
}

// Fulfillment tracking interfaces
export interface FulfillmentDetails {
  betId: number;
  betTitle: string;
  socialStakeDescription: string;
  status: 'PENDING' | 'PARTIALLY_FULFILLED' | 'FULFILLED';
  totalWinners: number;
  totalLosers: number;
  confirmationCount: number;
  loserClaimedAt?: string;
  loserProofUrl?: string;
  loserProofDescription?: string;
  allWinnersConfirmedAt?: string;
  winners: WinnerInfo[];
  losers: LoserInfo[];
  confirmations: WinnerConfirmation[];
}

export interface WinnerInfo {
  userId: number;
  displayName: string;
  profilePhotoUrl?: string;
  hasConfirmed: boolean;
}

export interface LoserInfo {
  userId: number;
  displayName: string;
  profilePhotoUrl?: string;
}

export interface WinnerConfirmation {
  winnerId: number;
  confirmedAt: string;
  notes?: string;
}

export interface LoserClaimRequest {
  proofUrl?: string;
  proofDescription?: string;
}

export interface WinnerConfirmRequest {
  notes?: string;
}

class BetService extends BaseApiService {
  constructor() {
    super(API_ENDPOINTS.BETS);
  }

  // Create a new bet
  async createBet(request: CreateBetRequest): Promise<BetResponse> {
    return this.post<BetResponse, CreateBetRequest>('', request);
  }

  // Get bet by ID
  async getBetById(betId: number): Promise<BetResponse> {
    return this.get<BetResponse>(`/${betId}`);
  }

  // Get bets for a specific group
  async getGroupBets(groupId: number): Promise<BetSummaryResponse[]> {
    return this.get<BetSummaryResponse[]>(`/group/${groupId}`);
  }

  // Get current user's bets
  async getMyBets(): Promise<BetSummaryResponse[]> {
    return this.get<BetSummaryResponse[]>('/my');
  }

  // Get bets by status
  async getBetsByStatus(status: string): Promise<BetSummaryResponse[]> {
    return this.get<BetSummaryResponse[]>(`/status/${status}`);
  }

  // Place a bet on an existing bet
  async placeBet(betId: number, request: PlaceBetRequest): Promise<BetResponse> {
    return this.post<BetResponse, PlaceBetRequest>(`/${betId}/participate`, request);
  }

  // Get all participations for a bet (for resolvers to see who participated)
  async getBetParticipations(betId: number): Promise<BetParticipationResponse[]> {
    return this.get<BetParticipationResponse[]>(`/${betId}/participations`);
  }

  // Resolve a bet (for creators or assigned resolvers)
  // Supports two modes:
  // 1. Option-based: pass outcome for BINARY/MULTIPLE_CHOICE
  // 2. Winner-based: pass winnerUserIds for PREDICTION
  async resolveBet(betId: number, outcome?: string, winnerUserIds?: number[], reasoning?: string): Promise<BetResponse> {
    const request: ResolveBetRequest = { outcome, winnerUserIds, reasoning };
    return this.post<BetResponse, ResolveBetRequest>(`/${betId}/resolve`, request);
  }

  // Vote on bet resolution (for consensus voting)
  async voteOnResolution(betId: number, outcome: string, reasoning: string): Promise<BetResponse> {
    const request: VoteOnResolutionRequest = { outcome, reasoning };
    return this.post<BetResponse, VoteOnResolutionRequest>(`/${betId}/vote`, request);
  }

  // ==========================================
  // FULFILLMENT TRACKING METHODS
  // ==========================================

  // Get fulfillment details for a social bet
  async getFulfillmentDetails(betId: number): Promise<FulfillmentDetails> {
    return this.get<FulfillmentDetails>(`/${betId}/fulfillment`);
  }

  // Loser claims they have fulfilled the stake (optional)
  async loserClaimFulfilled(betId: number, proofUrl?: string, proofDescription?: string): Promise<string> {
    const request: LoserClaimRequest = { proofUrl, proofDescription };
    return this.post<string, LoserClaimRequest>(`/${betId}/fulfillment/loser-claim`, request);
  }

  // Winner confirms they received the stake
  async winnerConfirmFulfilled(betId: number, notes?: string): Promise<string> {
    const request: WinnerConfirmRequest = { notes };
    return this.post<string, WinnerConfirmRequest>(`/${betId}/fulfillment/winner-confirm`, request);
  }

  // Upload fulfillment proof photo
  async uploadFulfillmentProof(betId: number, imageUri: string, fileName: string): Promise<string> {
    const getContentType = (filename: string): string => {
      const ext = filename.split('.').pop()?.toLowerCase();
      const typeMap: Record<string, string> = {
        'jpg': 'image/jpeg',
        'jpeg': 'image/jpeg',
        'png': 'image/png',
        'gif': 'image/gif',
        'webp': 'image/webp',
      };
      return typeMap[ext || ''] || 'image/jpeg';
    };

    const formData = new FormData();
    const file: any = {
      uri: imageUri,
      type: getContentType(fileName),
      name: fileName,
    };
    formData.append('file', file);

    return this.post<string, FormData>(`/${betId}/fulfillment/upload-proof`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  }
}

export const betService = new BetService();