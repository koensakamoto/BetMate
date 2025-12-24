import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from '@tanstack/react-query';
import {
  betService,
  BetResponse,
  BetSummaryResponse,
  CreateBetRequest,
  PlaceBetRequest,
} from '../services/bet/betService';
import { PagedResponse } from '../types/api';

// Query keys for cache management
export const betKeys = {
  all: ['bets'] as const,
  detail: (betId: number) => [...betKeys.all, 'detail', betId] as const,
  myBets: () => [...betKeys.all, 'my'] as const,
  myLosses: () => [...betKeys.all, 'my', 'losses'] as const,
  myWinnings: () => [...betKeys.all, 'my', 'winnings'] as const,
  groupBets: (groupId: number) => [...betKeys.all, 'group', groupId] as const,
  profileBets: (userId: number) => [...betKeys.all, 'profile', userId] as const,
  byStatus: (status: string) => [...betKeys.all, 'status', status] as const,
  participations: (betId: number) => [...betKeys.all, 'participations', betId] as const,
  fulfillment: (betId: number) => [...betKeys.all, 'fulfillment', betId] as const,
};

// Cache configuration
const BET_LIST_STALE_TIME = 5 * 60 * 1000; // 5 minutes

/**
 * Hook to fetch a single bet by ID
 * Uses initialData from list caches for instant loading
 */
export function useBet(betId: number | undefined) {
  const queryClient = useQueryClient();

  return useQuery({
    queryKey: betKeys.detail(betId!),
    queryFn: () => betService.getBetById(betId!),
    enabled: !!betId,
    // Try to get initial data from list caches for instant loading
    initialData: () => {
      if (!betId) return undefined;

      // Check myBets cache (now paginated)
      const myBetsData = queryClient.getQueryData<{ pages: PagedResponse<BetSummaryResponse>[] }>(betKeys.myBets());
      if (myBetsData?.pages) {
        for (const page of myBetsData.pages) {
          const found = page.content.find(b => b.id === betId);
          if (found) return found as unknown as BetResponse;
        }
      }

      // Check myLosses cache
      const lossesData = queryClient.getQueryData<{ pages: PagedResponse<BetSummaryResponse>[] }>(betKeys.myLosses());
      if (lossesData?.pages) {
        for (const page of lossesData.pages) {
          const found = page.content.find(b => b.id === betId);
          if (found) return found as unknown as BetResponse;
        }
      }

      // Check myWinnings cache
      const winningsData = queryClient.getQueryData<{ pages: PagedResponse<BetSummaryResponse>[] }>(betKeys.myWinnings());
      if (winningsData?.pages) {
        for (const page of winningsData.pages) {
          const found = page.content.find(b => b.id === betId);
          if (found) return found as unknown as BetResponse;
        }
      }

      return undefined;
    },
    initialDataUpdatedAt: 0, // Mark as stale for background refresh
  });
}

/**
 * Hook to fetch current user's bets (paginated with infinite scroll)
 */
export function useMyBets() {
  return useInfiniteQuery({
    queryKey: betKeys.myBets(),
    queryFn: ({ pageParam = 0 }) => betService.getMyBets(pageParam, 20),
    initialPageParam: 0,
    getNextPageParam: (lastPage) => {
      if (lastPage.last) return undefined;
      return lastPage.page + 1;
    },
    staleTime: BET_LIST_STALE_TIME,
  });
}

/**
 * Hook to fetch user's lost social bets (for Losses tab, paginated with infinite scroll)
 */
export function useMyLosses() {
  return useInfiniteQuery({
    queryKey: betKeys.myLosses(),
    queryFn: ({ pageParam = 0 }) => betService.getMyLosses(pageParam, 20),
    initialPageParam: 0,
    getNextPageParam: (lastPage) => {
      if (lastPage.last) return undefined;
      return lastPage.page + 1;
    },
    staleTime: BET_LIST_STALE_TIME,
  });
}

/**
 * Hook to fetch user's won social bets (for Winnings tab, paginated with infinite scroll)
 */
export function useMyWinnings() {
  return useInfiniteQuery({
    queryKey: betKeys.myWinnings(),
    queryFn: ({ pageParam = 0 }) => betService.getMyWinnings(pageParam, 20),
    initialPageParam: 0,
    getNextPageParam: (lastPage) => {
      if (lastPage.last) return undefined;
      return lastPage.page + 1;
    },
    staleTime: BET_LIST_STALE_TIME,
  });
}

/**
 * Hook to fetch bets for a group
 */
export function useGroupBets(groupId: number | undefined) {
  return useQuery({
    queryKey: betKeys.groupBets(groupId!),
    queryFn: () => betService.getGroupBets(groupId!),
    enabled: !!groupId,
  });
}

/**
 * Hook to fetch bets for a user's profile
 */
export function useProfileBets(userId: number | undefined, page: number = 0, size: number = 10) {
  return useQuery({
    queryKey: [...betKeys.profileBets(userId!), page, size],
    queryFn: () => betService.getProfileBets(userId!, page, size),
    enabled: !!userId,
  });
}

/**
 * Hook to fetch bets by status
 */
export function useBetsByStatus(status: string) {
  return useQuery({
    queryKey: betKeys.byStatus(status),
    queryFn: () => betService.getBetsByStatus(status),
    enabled: !!status,
  });
}

/**
 * Hook to fetch bet participations
 */
export function useBetParticipations(betId: number | undefined) {
  return useQuery({
    queryKey: betKeys.participations(betId!),
    queryFn: () => betService.getBetParticipations(betId!),
    enabled: !!betId,
  });
}

/**
 * Hook to fetch fulfillment details
 */
export function useFulfillmentDetails(betId: number | undefined) {
  return useQuery({
    queryKey: betKeys.fulfillment(betId!),
    queryFn: () => betService.getFulfillmentDetails(betId!),
    enabled: !!betId,
  });
}

/**
 * Hook to invalidate bet caches
 */
export function useInvalidateBets() {
  const queryClient = useQueryClient();

  return {
    invalidateAll: () => queryClient.invalidateQueries({ queryKey: betKeys.all }),
    invalidateBet: (betId: number) => queryClient.invalidateQueries({ queryKey: betKeys.detail(betId) }),
    invalidateMyBets: () => {
      queryClient.invalidateQueries({ queryKey: betKeys.myBets() });
      queryClient.invalidateQueries({ queryKey: betKeys.myLosses() });
      queryClient.invalidateQueries({ queryKey: betKeys.myWinnings() });
    },
    invalidateGroupBets: (groupId: number) => queryClient.invalidateQueries({ queryKey: betKeys.groupBets(groupId) }),
    invalidateAfterBetAction: (betId: number, groupId?: number) => {
      queryClient.invalidateQueries({ queryKey: betKeys.detail(betId) });
      queryClient.invalidateQueries({ queryKey: betKeys.myBets() });
      queryClient.invalidateQueries({ queryKey: betKeys.myLosses() });
      queryClient.invalidateQueries({ queryKey: betKeys.myWinnings() });
      queryClient.invalidateQueries({ queryKey: betKeys.participations(betId) });
      if (groupId) {
        queryClient.invalidateQueries({ queryKey: betKeys.groupBets(groupId) });
      }
    },
  };
}

/**
 * Hook for creating a bet
 */
export function useCreateBet() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateBetRequest) => betService.createBet(data),
    onSuccess: (newBet) => {
      queryClient.invalidateQueries({ queryKey: betKeys.myBets() });
      queryClient.invalidateQueries({ queryKey: betKeys.myLosses() });
      queryClient.invalidateQueries({ queryKey: betKeys.myWinnings() });
      queryClient.invalidateQueries({ queryKey: betKeys.groupBets(newBet.groupId) });
    },
  });
}

/**
 * Hook for placing a bet
 */
export function usePlaceBet() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ betId, data }: { betId: number; data: PlaceBetRequest }) =>
      betService.placeBet(betId, data),
    onSuccess: (updatedBet) => {
      queryClient.setQueryData(betKeys.detail(updatedBet.id), updatedBet);
      queryClient.invalidateQueries({ queryKey: betKeys.myBets() });
      queryClient.invalidateQueries({ queryKey: betKeys.myLosses() });
      queryClient.invalidateQueries({ queryKey: betKeys.myWinnings() });
      queryClient.invalidateQueries({ queryKey: betKeys.groupBets(updatedBet.groupId) });
      queryClient.invalidateQueries({ queryKey: betKeys.participations(updatedBet.id) });
    },
  });
}

/**
 * Hook for resolving a bet
 */
export function useResolveBet() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      betId,
      outcome,
      winnerUserIds,
      reasoning,
    }: {
      betId: number;
      outcome?: string;
      winnerUserIds?: number[];
      reasoning?: string;
    }) => betService.resolveBet(betId, outcome, winnerUserIds, reasoning),
    onSuccess: (updatedBet) => {
      queryClient.setQueryData(betKeys.detail(updatedBet.id), updatedBet);
      queryClient.invalidateQueries({ queryKey: betKeys.myBets() });
      queryClient.invalidateQueries({ queryKey: betKeys.myLosses() });
      queryClient.invalidateQueries({ queryKey: betKeys.myWinnings() });
      queryClient.invalidateQueries({ queryKey: betKeys.groupBets(updatedBet.groupId) });
    },
  });
}

/**
 * Hook for voting on resolution
 */
export function useVoteOnResolution() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      betId,
      outcome,
      winnerUserIds,
      reasoning,
    }: {
      betId: number;
      outcome?: string;
      winnerUserIds?: number[];
      reasoning?: string;
    }) => betService.voteOnResolution(betId, outcome, winnerUserIds, reasoning),
    onSuccess: (updatedBet) => {
      queryClient.setQueryData(betKeys.detail(updatedBet.id), updatedBet);
    },
  });
}

/**
 * Hook for cancelling a bet
 */
export function useCancelBet() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ betId, reason }: { betId: number; reason?: string }) =>
      betService.cancelBet(betId, reason),
    onSuccess: (updatedBet) => {
      queryClient.setQueryData(betKeys.detail(updatedBet.id), updatedBet);
      queryClient.invalidateQueries({ queryKey: betKeys.myBets() });
      queryClient.invalidateQueries({ queryKey: betKeys.myLosses() });
      queryClient.invalidateQueries({ queryKey: betKeys.myWinnings() });
      queryClient.invalidateQueries({ queryKey: betKeys.groupBets(updatedBet.groupId) });
    },
  });
}

/**
 * Hook for loser claiming fulfillment
 */
export function useLoserClaimFulfilled() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      betId,
      proofUrl,
      proofDescription,
    }: {
      betId: number;
      proofUrl?: string;
      proofDescription?: string;
    }) => betService.loserClaimFulfilled(betId, proofUrl, proofDescription),
    onSuccess: (_, { betId }) => {
      queryClient.invalidateQueries({ queryKey: betKeys.detail(betId) });
      queryClient.invalidateQueries({ queryKey: betKeys.fulfillment(betId) });
    },
  });
}

/**
 * Hook for winner confirming fulfillment
 */
export function useWinnerConfirmFulfilled() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ betId, notes }: { betId: number; notes?: string }) =>
      betService.winnerConfirmFulfilled(betId, notes),
    onSuccess: (_, { betId }) => {
      queryClient.invalidateQueries({ queryKey: betKeys.detail(betId) });
      queryClient.invalidateQueries({ queryKey: betKeys.fulfillment(betId) });
    },
  });
}
