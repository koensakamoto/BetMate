import { BaseApiService } from '../api/baseService';
import { API_ENDPOINTS } from '../../config/api';

// Request DTOs
export interface PurchaseItemRequest {
  storeItemId: number;
  pricePaid: number;
}

// Response DTOs
export interface StoreItemResponse {
  id: number;
  itemType: string;
  name: string;
  shortDescription?: string;
  description: string;
  category: string;
  iconUrl?: string;
  previewData?: string;
  price: number;
  rarity: string;
  rarityColor?: string;
  isActive: boolean;
  isFeatured: boolean;
  isLimitedTime: boolean;
  availableUntil?: string;
  createdAt: string;
  userOwns?: boolean;
  userCanAfford?: boolean;
}

export interface InventoryItemResponse {
  id: number;
  itemName: string;
  itemType: string;
  rarity: string;
  iconUrl?: string;
  shortDescription?: string;
  description: string;
  purchasePrice: number;
  purchasedAt: string;
  isEquipped: boolean;
  equippedAt?: string;
  usageCount: number;
  lastUsedAt?: string;
  isActive: boolean;
  activatedAt?: string;
  usesRemaining?: number;
  expiresAt?: string;
}

export class StoreService extends BaseApiService {
  constructor() {
    super(''); // Store endpoints use the root API path
  }

  /**
   * Get all available store items
   */
  async getStoreItems(): Promise<StoreItemResponse[]> {
    return this.get<StoreItemResponse[]>(`${API_ENDPOINTS.STORE}/items`);
  }

  /**
   * Get featured store items
   */
  async getFeaturedItems(): Promise<StoreItemResponse[]> {
    return this.get<StoreItemResponse[]>(`${API_ENDPOINTS.STORE}/items/featured`);
  }

  /**
   * Get store items by category
   */
  async getItemsByCategory(category: string): Promise<StoreItemResponse[]> {
    return this.get<StoreItemResponse[]>(`${API_ENDPOINTS.STORE}/items/category/${category}`);
  }

  /**
   * Purchase a store item
   */
  async purchaseItem(storeItemId: number, pricePaid: number): Promise<InventoryItemResponse> {
    const request: PurchaseItemRequest = {
      storeItemId,
      pricePaid
    };

    return this.post<InventoryItemResponse>(`${API_ENDPOINTS.STORE}/purchase`, request);
  }

  /**
   * Get user's inventory
   */
  async getUserInventory(): Promise<InventoryItemResponse[]> {
    return this.get<InventoryItemResponse[]>(`${API_ENDPOINTS.STORE}/inventory`);
  }

  /**
   * Equip an item from inventory
   */
  async equipItem(inventoryId: number): Promise<void> {
    return this.post<void>(`${API_ENDPOINTS.STORE}/inventory/equip`, { inventoryId });
  }

  /**
   * Unequip an item from inventory
   */
  async unequipItem(inventoryId: number): Promise<void> {
    return this.post<void>(`${API_ENDPOINTS.STORE}/inventory/remove`, { inventoryId });
  }

  /**
   * Get active daily bonus doubler from user's inventory
   */
  async getActiveDoublerStatus(): Promise<InventoryItemResponse | null> {
    const inventory = await this.getUserInventory();
    const activeDoubler = inventory.find(item =>
      item.itemType === 'DAILY_BOOSTER' &&
      item.isActive &&
      item.usesRemaining !== undefined &&
      item.usesRemaining > 0
    );
    return activeDoubler || null;
  }
}

export const storeService = new StoreService();
