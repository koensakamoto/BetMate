import { BaseApiService } from '../api/baseService';
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
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 1) {
      const minutes = Math.floor(diffInHours * 60);
      return minutes < 1 ? 'Just now' : `${minutes}m ago`;
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)}h ago`;
    } else {
      return date.toLocaleDateString();
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