import { BaseApiService } from '../api/baseService';
import { API_ENDPOINTS } from '../../config/api';

// Transaction interface (matches frontend TransactionHistoryModal)
export interface Transaction {
  id: string;
  type: 'CREDIT' | 'DEBIT' | 'TRANSFER_IN' | 'TRANSFER_OUT';
  amount: number;
  reason: string;
  timestamp: string;
  balanceBefore: number;
  balanceAfter: number;
  correlationId?: string;
}

// Paginated response from backend
export interface TransactionPageResponse {
  content: Transaction[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
  first: boolean;
  last: boolean;
}

export class TransactionService extends BaseApiService {
  constructor() {
    super(''); // User endpoints use the root API path
  }

  /**
   * Get paginated transaction history for the current user.
   * @param page Page number (0-indexed)
   * @param size Page size
   * @returns Paginated transaction history
   */
  async getTransactions(page: number = 0, size: number = 20): Promise<TransactionPageResponse> {
    try {
      const response = await this.get<TransactionPageResponse>(
        `${API_ENDPOINTS.USERS}/transactions?page=${page}&size=${size}`
      );

      // The response is already unwrapped by handleApiResponse
      return response;
    } catch (error) {
      console.error('Error fetching transactions:', error);
      throw error;
    }
  }

  /**
   * Get all transactions for the current user (unpaginated).
   * Useful for displaying complete transaction history.
   * @returns All user transactions
   */
  async getAllTransactions(): Promise<Transaction[]> {
    try {
      // Fetch first page to get total elements
      const firstPage = await this.getTransactions(0, 100);

      // If everything fits in one page, return it
      if (firstPage.last) {
        return firstPage.content;
      }

      // Otherwise, fetch all pages
      const allTransactions: Transaction[] = [...firstPage.content];
      const totalPages = firstPage.totalPages;

      // Fetch remaining pages in parallel
      const pagePromises = [];
      for (let page = 1; page < totalPages; page++) {
        pagePromises.push(this.getTransactions(page, 100));
      }

      const remainingPages = await Promise.all(pagePromises);
      remainingPages.forEach(page => {
        allTransactions.push(...page.content);
      });

      return allTransactions;
    } catch (error) {
      console.error('Error fetching all transactions:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const transactionService = new TransactionService();
