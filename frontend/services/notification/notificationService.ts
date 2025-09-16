import { BaseApiService } from '../api/baseService';
import {
  NotificationResponse,
  NotificationStats,
  NotificationCountResponse,
  PagedResponse
} from '../../types/api';

export class NotificationService extends BaseApiService {
  constructor() {
    super('/notifications');
  }

  /**
   * Gets paginated notifications for the current user
   */
  async getNotifications(params?: {
    page?: number;
    size?: number;
    unreadOnly?: boolean;
  }): Promise<PagedResponse<NotificationResponse>> {
    const queryParams = new URLSearchParams();

    if (params?.page !== undefined) queryParams.append('page', params.page.toString());
    if (params?.size !== undefined) queryParams.append('size', params.size.toString());
    if (params?.unreadOnly) queryParams.append('unreadOnly', 'true');

    return this.get<PagedResponse<NotificationResponse>>(
      queryParams.toString() ? `?${queryParams.toString()}` : ''
    );
  }

  /**
   * Gets the count of unread notifications
   */
  async getUnreadCount(): Promise<number> {
    const response = await this.get<NotificationCountResponse>('/unread-count');
    return response.unreadCount;
  }

  /**
   * Marks a specific notification as read
   */
  async markAsRead(notificationId: number): Promise<void> {
    await this.put(`/${notificationId}/read`);
  }

  /**
   * Marks all notifications as read for the current user
   */
  async markAllAsRead(): Promise<void> {
    await this.put('/mark-all-read');
  }

  /**
   * Gets notification statistics for the current user
   */
  async getStats(): Promise<NotificationStats> {
    return this.get<NotificationStats>('/stats');
  }

  /**
   * Creates a test notification (development only)
   */
  async createTestNotification(message?: string): Promise<{ message: string }> {
    const params = new URLSearchParams();
    if (message) params.append('message', message);

    return this.post<{ message: string }>(
      `/test${params.toString() ? `?${params.toString()}` : ''}`
    );
  }

  /**
   * Tests all notification types (development only)
   */
  async testAllNotifications(): Promise<{ message: string }> {
    return this.post<{ message: string }>('/test-all');
  }

  /**
   * Tests bet notifications (development only)
   */
  async testBetNotifications(): Promise<{ message: string }> {
    return this.post<{ message: string }>('/test-bet');
  }

  /**
   * Tests social notifications (development only)
   */
  async testSocialNotifications(): Promise<{ message: string }> {
    return this.post<{ message: string }>('/test-social');
  }

  /**
   * Tests message notifications (development only)
   */
  async testMessageNotifications(): Promise<{ message: string }> {
    return this.post<{ message: string }>('/test-message');
  }

  /**
   * Sends a custom test notification (development only)
   */
  async sendTestNotification(notification: {
    type: string;
    title: string;
    content: string;
    actionUrl?: string;
    priority: string;
  }): Promise<{ message: string }> {
    return this.post<{ message: string }>('/test', {
      type: notification.type,
      title: notification.title,
      content: notification.content,
      actionUrl: notification.actionUrl,
      priority: notification.priority
    });
  }
}

// Export singleton instance
export const notificationService = new NotificationService();

// Export convenience function
export const sendTestNotification = (notification: {
  type: string;
  title: string;
  content: string;
  actionUrl?: string;
  priority: string;
}) => notificationService.sendTestNotification(notification);