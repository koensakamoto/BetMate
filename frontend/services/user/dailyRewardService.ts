import { apiClient } from '../api/baseClient';

export interface DailyRewardStatus {
  canClaim: boolean;
  lastClaimedAt: string | null;
  nextAvailableAt: string | null;
  rewardAmount: number;
}

class DailyRewardService {
  /**
   * Get current user's daily reward status
   */
  async getDailyRewardStatus(): Promise<DailyRewardStatus> {
    const response = await apiClient.get<DailyRewardStatus>('/users/daily-reward-status');
    return response.data;
  }
}

export const dailyRewardService = new DailyRewardService();
