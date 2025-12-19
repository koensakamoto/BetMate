import { BaseApiService } from '../api/baseService';
import { API_ENDPOINTS } from '../../config/api';

// React Native FormData file type
interface FormDataFile {
  uri: string;
  type: string;
  name: string;
}

export interface CreateBetRequest {
  groupId: number;
  title: string;
  description?: string;
  betType: 'MULTIPLE_CHOICE' | 'PREDICTION'; // | 'OVER_UNDER' (COMMENTED OUT - TODO: Implement later)
  resolutionMethod: 'SELF' | 'ASSIGNED_RESOLVERS' | 'PARTICIPANT_VOTE';
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
  resolverUserIds?: number[]; // For ASSIGNED_RESOLVERS: List of user IDs who can resolve the bet
}

export interface ResolverInfo {
  id: number;
  username: string;
  displayName: string;
  profileImageUrl?: string;
  hasVoted?: boolean;
  votedOutcome?: string;        // For MCQ bets: the option text they voted for
  votedWinnerUserIds?: number[]; // For prediction bets: user IDs of winners they selected
  reasoning?: string;           // Optional reasoning/comment for their vote
}

export interface VotingProgress {
  totalResolvers: number;
  votesSubmitted: number;
  voteDistribution?: Record<string, number>;
}

export interface BetResponse {
  id: number;
  title: string;
  description?: string;
  betType: string;
  status: string;
  cancellationReason?: string;
  outcome?: string;
  resolutionMethod: string;
  resolutionComment?: string; // Notes from resolver about the resolution
  options?: string[]; // Bet options for MULTIPLE_CHOICE bets
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
  hasUserVoted?: boolean;  // Whether user has already voted on resolution (for PARTICIPANT_VOTE)
  // Insurance information (for user's participation)
  hasInsurance?: boolean;
  insuranceRefundPercentage?: number;
  insuranceTier?: string;
  insuranceRefundAmount?: number;
  // Resolver information
  resolutionMethodDisplay?: string;
  resolvers?: ResolverInfo[];
  votingProgress?: VotingProgress;
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
  fulfillmentStatus?: 'PENDING' | 'PARTIALLY_FULFILLED' | 'FULFILLED'; // Fulfillment tracking status
  hasCurrentUserClaimedFulfillment?: boolean; // Whether current user (if loser) has submitted fulfillment claim
  totalPool: number;
  totalParticipants: number;
  createdAt: string;
  hasUserParticipated: boolean;
  userChoice?: string; // User's chosen option (e.g., OPTION_1, OPTION_2)
  userAmount?: number;
  userParticipationStatus?: 'ACTIVE' | 'WON' | 'LOST' | 'DRAW' | 'REFUNDED' | 'CANCELLED'; // User's participation result
  participantPreviews?: {
    id: number;
    username: string;
    firstName: string;
    lastName: string;
    profileImageUrl?: string;
  }[];
  // Insurance information (for user's participation)
  hasInsurance?: boolean;
  insuranceRefundPercentage?: number;
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
  // Vote counts for resolved PREDICTION bets
  votesReceived?: number;
  totalVoters?: number;
}

export interface ResolveBetRequest {
  outcome?: string;
  winnerUserIds?: number[];
  reasoning?: string;
}

export interface VoteOnResolutionRequest {
  outcome?: string;           // For BINARY/MULTIPLE_CHOICE bets
  winnerUserIds?: number[];   // For PREDICTION bets
  reasoning?: string;
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
  hasClaimed: boolean;
  claimedAt?: string;
  proofUrl?: string;
  proofDescription?: string;
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

  // Get visible bets for a user's profile (respects privacy)
  async getProfileBets(userId: number, page: number = 0, size: number = 10): Promise<BetSummaryResponse[]> {
    return this.get<BetSummaryResponse[]>(`/profile/${userId}`, {
      params: { page, size }
    });
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
  // Supports two modes:
  // 1. Outcome-based: pass outcome for BINARY/MULTIPLE_CHOICE bets
  // 2. Winner-based: pass winnerUserIds for PREDICTION bets
  async voteOnResolution(
    betId: number,
    outcome?: string,
    winnerUserIds?: number[],
    reasoning?: string
  ): Promise<BetResponse> {
    // Only include fields that have values to avoid validation issues
    const request: VoteOnResolutionRequest = {};
    if (outcome !== undefined && outcome !== null) request.outcome = outcome;
    if (winnerUserIds !== undefined && winnerUserIds !== null && winnerUserIds.length > 0) {
      request.winnerUserIds = winnerUserIds;
    }
    if (reasoning !== undefined && reasoning !== null) request.reasoning = reasoning;
    return this.post<BetResponse, VoteOnResolutionRequest>(`/${betId}/vote`, request);
  }

  // Cancel a bet (creator only)
  async cancelBet(betId: number, reason?: string): Promise<BetResponse> {
    const request = reason ? { reason } : undefined;
    return this.post<BetResponse, { reason?: string } | undefined>(`/${betId}/cancel`, request);
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
    const request: LoserClaimRequest = {};
    if (proofUrl !== undefined) request.proofUrl = proofUrl;
    if (proofDescription !== undefined) request.proofDescription = proofDescription;
    return this.post<string, LoserClaimRequest>(`/${betId}/fulfillment/loser-claim`, request);
  }

  // Winner confirms they received the stake
  async winnerConfirmFulfilled(betId: number, notes?: string): Promise<string> {
    const request: WinnerConfirmRequest = {};
    if (notes !== undefined) request.notes = notes;
    return this.post<string, WinnerConfirmRequest>(`/${betId}/fulfillment/winner-confirm`, request);
  }

  // Upload fulfillment proof photo
  // Returns the storedValue (for saving to DB) - the backend will resolve it to a display URL when needed
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
    const file: FormDataFile = {
      uri: imageUri,
      type: getContentType(fileName),
      name: fileName,
    };
    formData.append('file', file as unknown as Blob);

    const response = await this.post<{ storedValue: string; displayUrl: string }, FormData>(
      `/${betId}/fulfillment/upload-proof`,
      formData,
      { headers: { 'Content-Type': 'multipart/form-data' } }
    );

    // Return the storedValue which is what should be saved to the database
    return response.storedValue;
  }
}

export const betService = new BetService();