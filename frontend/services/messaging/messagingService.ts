import { BaseApiService } from '../api/baseService';
import { parseBackendDate } from '../../utils/dateUtils';
import {
  MessageResponse,
  MessageThreadResponse,
  SendMessageRequest,
  EditMessageRequest,
  MessageStatsResponse,
  MessageSearchParams,
  PagedResponse
} from '../../types/api';

export class MessagingService extends BaseApiService {
  constructor() {
    super('/messages');
  }

  // ==========================================
  // MESSAGE CRUD OPERATIONS
  // ==========================================

  /**
   * Send a new message to a group
   */
  async sendMessage(request: SendMessageRequest): Promise<MessageResponse> {
    return this.post<MessageResponse, SendMessageRequest>('', request);
  }

  /**
   * Get a specific message by ID
   */
  async getMessage(messageId: number): Promise<MessageResponse> {
    return this.get<MessageResponse>(`/${messageId}`);
  }

  /**
   * Edit an existing message
   */
  async editMessage(messageId: number, request: EditMessageRequest): Promise<MessageResponse> {
    return this.put<MessageResponse, EditMessageRequest>(`/${messageId}`, request);
  }

  /**
   * Delete a message
   */
  async deleteMessage(messageId: number): Promise<void> {
    return this.delete<void>(`/${messageId}`);
  }

  // ==========================================
  // GROUP MESSAGES
  // ==========================================

  /**
   * Get messages from a group with pagination
   */
  async getGroupMessages(
    groupId: number,
    params?: {
      page?: number;
      size?: number;
      sort?: string;
      direction?: 'asc' | 'desc';
    }
  ): Promise<PagedResponse<MessageResponse>> {
    return this.getPaginated<MessageResponse>(`/group/${groupId}`, params);
  }

  /**
   * Get recent messages from a group (simpler than pagination)
   */
  async getRecentGroupMessages(
    groupId: number,
    limit: number = 50
  ): Promise<MessageResponse[]> {
    return this.get<MessageResponse[]>(`/group/${groupId}/recent`, {
      params: { limit }
    });
  }

  /**
   * Get messages before a specific message ID (for pagination)
   * Returns messages in DESC order (newest first)
   */
  async getMessagesBeforeMessage(
    groupId: number,
    beforeMessageId: number,
    limit: number = 50
  ): Promise<MessageResponse[]> {
    return this.get<MessageResponse[]>(`/group/${groupId}/before/${beforeMessageId}`, {
      params: { limit }
    });
  }

  /**
   * Get message statistics for a group
   */
  async getGroupMessageStats(groupId: number): Promise<MessageStatsResponse> {
    return this.get<MessageStatsResponse>(`/group/${groupId}/stats`);
  }

  // ==========================================
  // MESSAGE THREADING
  // ==========================================

  /**
   * Get a message thread (parent message with its replies)
   */
  async getMessageThread(messageId: number): Promise<MessageThreadResponse> {
    return this.get<MessageThreadResponse>(`/${messageId}/thread`);
  }

  /**
   * Reply to a message
   */
  async replyToMessage(
    parentMessageId: number,
    groupId: number,
    content: string
  ): Promise<MessageResponse> {
    const request: SendMessageRequest = {
      groupId,
      content,
      parentMessageId
    };
    return this.sendMessage(request);
  }

  // ==========================================
  // MESSAGE SEARCH
  // ==========================================

  /**
   * Search messages within a group
   */
  async searchMessages(params: MessageSearchParams): Promise<MessageResponse[]> {
    const searchParams = new URLSearchParams();
    searchParams.append('query', params.query);
    
    if (params.messageType) {
      searchParams.append('messageType', params.messageType);
    }
    if (params.senderId) {
      searchParams.append('senderId', params.senderId.toString());
    }
    if (params.fromDate) {
      searchParams.append('fromDate', params.fromDate);
    }
    if (params.toDate) {
      searchParams.append('toDate', params.toDate);
    }

    return this.get<MessageResponse[]>(`/group/${params.groupId}/search`, {
      params: Object.fromEntries(searchParams.entries())
    });
  }

  // ==========================================
  // USER MESSAGES
  // ==========================================

  /**
   * Get messages sent by the current user
   */
  async getMyMessages(): Promise<MessageResponse[]> {
    return this.get<MessageResponse[]>('/my-messages');
  }

  // ==========================================
  // UTILITY METHODS
  // ==========================================

  /**
   * Check if a message can be edited (client-side validation)
   */
  canEditMessage(message: MessageResponse, currentUsername: string): boolean {
    return message.canEdit && message.senderUsername === currentUsername;
  }

  /**
   * Check if a message can be deleted (client-side validation)
   */
  canDeleteMessage(message: MessageResponse, currentUsername: string): boolean {
    return message.canDelete && message.senderUsername === currentUsername;
  }

  /**
   * Get preview text for a message (truncated if too long)
   */
  getMessagePreview(message: MessageResponse, maxLength: number = 100): string {
    if (!message.content) return '';
    if (message.content.length <= maxLength) return message.content;
    return message.content.substring(0, maxLength - 3) + '...';
  }

  /**
   * Format message timestamp for display
   */
  formatMessageTime(timestamp: string): string {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;
    return date.toLocaleDateString();
  }

  /**
   * Format message timestamp as actual time (e.g., "2:34 PM")
   */
  formatMessageTimeActual(timestamp: string): string {
    try {
      const date = parseBackendDate(timestamp);
      return date.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      });
    } catch (error) {
      console.error('Error formatting time:', error);
      return '';
    }
  }

  /**
   * Format date for separator display (e.g., "Today", "Yesterday", or "Nov 25")
   */
  formatDateSeparator(timestamp: string): string {
    try {
      const date = parseBackendDate(timestamp);
      const now = new Date();
      const yesterday = new Date(now);
      yesterday.setDate(yesterday.getDate() - 1);

      if (date.toDateString() === now.toDateString()) {
        return 'Today';
      } else if (date.toDateString() === yesterday.toDateString()) {
        return 'Yesterday';
      } else {
        return date.toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
        });
      }
    } catch (error) {
      console.error('Error formatting date separator:', error);
      return '';
    }
  }

  /**
   * Check if date separator should be shown between messages
   * Returns true if date changed or time gap exceeds threshold
   */
  shouldShowDateSeparator(
    currentTimestamp: string,
    previousTimestamp: string | null,
    gapMinutes: number = 30
  ): boolean {
    if (!previousTimestamp) return true; // First message always gets separator

    try {
      const current = parseBackendDate(currentTimestamp);
      const previous = parseBackendDate(previousTimestamp);

      // Different day
      if (current.toDateString() !== previous.toDateString()) {
        return true;
      }

      // Same day but large time gap
      const diffMinutes = Math.abs(current.getTime() - previous.getTime()) / (1000 * 60);
      return diffMinutes >= gapMinutes;
    } catch (error) {
      return false;
    }
  }

  /**
   * Check if message sequence should break (different time gap threshold)
   */
  shouldBreakMessageSequence(
    currentTimestamp: string,
    previousTimestamp: string,
    gapMinutes: number = 5
  ): boolean {
    try {
      const current = parseBackendDate(currentTimestamp);
      const previous = parseBackendDate(previousTimestamp);
      const diffMinutes = Math.abs(current.getTime() - previous.getTime()) / (1000 * 60);
      return diffMinutes >= gapMinutes;
    } catch (error) {
      return false;
    }
  }

  /**
   * Check if a message is a system message
   */
  isSystemMessage(message: MessageResponse): boolean {
    return message.senderId === null || message.messageType === 'SYSTEM';
  }

  /**
   * Check if a message has attachments
   */
  hasAttachment(message: MessageResponse): boolean {
    return !!(message.attachmentUrl && message.attachmentUrl.trim());
  }

  /**
   * Get attachment type icon/display name
   */
  getAttachmentDisplayType(message: MessageResponse): string | null {
    if (!message.attachmentType) return null;
    
    const type = message.attachmentType.toLowerCase();
    if (type.includes('image')) return 'Image';
    if (type.includes('video')) return 'Video';
    if (type.includes('audio')) return 'Audio';
    if (type.includes('pdf')) return 'PDF';
    if (type.includes('doc')) return 'Document';
    
    return 'File';
  }
}

// Create singleton instance
export const messagingService = new MessagingService();