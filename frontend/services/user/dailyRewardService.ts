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
    try {
      const response = await apiClient.get<DailyRewardStatus>('/users/daily-reward-status');
      return response.data;
    } catch (error) {
      console.error('Error fetching daily reward status:', error);
      throw error;
    }
  }
}

export const dailyRewardService = new DailyRewardService();
