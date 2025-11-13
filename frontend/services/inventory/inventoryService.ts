import { apiClient } from '../api/baseClient';

export interface EligibleBet {
  betId: number;
  participationId: number;
  title: string;
  groupName: string;
  betAmount: number;
  chosenOption: number | null;
  chosenOptionText: string | null;
  predictedValue: string | null;
  potentialWinnings: number;
  deadline: string;
  betStatus: 'OPEN' | 'CLOSED' | 'RESOLVED' | 'CANCELLED';
  canApply: boolean;
  reason: string | null;
}

export interface EligibleBetsResponse {
  inventoryId: number;
  storeItemId: number;
  itemName: string;
  itemType: string;
  description: string;
  usesRemaining: number;
  isActive: boolean;
  eligibleBets: EligibleBet[];
}

class InventoryService {
  /**
   * Get all bets eligible for applying an inventory item
   * @param inventoryItemId The inventory item ID
   * @returns List of eligible bets with item details
   */
  async getEligibleBets(inventoryItemId: number): Promise<EligibleBetsResponse> {
    const response = await apiClient.get<EligibleBetsResponse>(
      `/inventory/${inventoryItemId}/eligible-bets`
    );
    return response.data;
  }
}

export const inventoryService = new InventoryService();
export default inventoryService;
