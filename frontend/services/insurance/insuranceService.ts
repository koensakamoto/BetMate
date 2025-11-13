import { apiClient } from '../api/baseClient';

export interface ApplyInsuranceRequest {
  insuranceItemId: number;
}

export interface InsuranceStatusResponse {
  participationId: number;
  hasInsurance: boolean;
  insuranceItemId: number | null;
  insuranceItemName: string | null;
  refundPercentage: number | null;
  refundAmount: number | null;
  insuranceApplied: boolean;
}

class InsuranceService {
  /**
   * Apply insurance to a bet
   * @param betId The bet ID to apply insurance to
   * @param insuranceItemId The inventory item ID of the insurance
   */
  async applyInsuranceToBet(betId: number, insuranceItemId: number): Promise<InsuranceStatusResponse> {
    const request: ApplyInsuranceRequest = { insuranceItemId };
    const response = await apiClient.post<InsuranceStatusResponse>(
      `/bets/${betId}/insurance`,
      request
    );
    return response.data;
  }

  /**
   * Get insurance status for a bet
   * @param betId The bet ID
   */
  async getInsuranceStatus(betId: number): Promise<InsuranceStatusResponse> {
    const response = await apiClient.get<InsuranceStatusResponse>(
      `/bets/${betId}/insurance/status`
    );
    return response.data;
  }
}

export const insuranceService = new InsuranceService();
export default insuranceService;
