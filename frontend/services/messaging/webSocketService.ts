import { Client, StompSubscription, IMessage } from '@stomp/stompjs';
import { ENV, debugLog, errorLog } from '../../config/env';
import { tokenStorage } from '../api';
import {
  MessageResponse,
  TypingIndicator,
  UserPresence,
  WebSocketError,
  WebSocketMessage,
  WebSocketMessageType,
  SendMessageRequest
} from '../../types/api';

export interface WebSocketEventHandlers {
  onMessage?: (message: MessageResponse) => void;
  onMessageEdit?: (message: MessageResponse) => void;
  onMessageDelete?: (messageId: number) => void;
  onTypingIndicator?: (indicator: TypingIndicator) => void;
  onUserPresence?: (presence: UserPresence) => void;
  onError?: (error: WebSocketError) => void;
  onConnect?: () => void;
  onDisconnect?: () => void;
  onReconnect?: () => void;
}

export class WebSocketMessagingService {
  private client: Client;
  private subscriptions: Map<string, StompSubscription> = new Map();
  private eventHandlers: WebSocketEventHandlers = {};
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000; // Start with 1 second
  private isConnecting = false;
  private connectionPromise: Promise<void> | null = null;

  constructor() {
    this.client = new Client({
      brokerURL: ENV.WS_BASE_URL, // Use pure WebSocket URL
      reconnectDelay: this.reconnectDelay,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
      maxWebSocketChunkSize: 8 * 1024, // 8KB chunks for mobile
      debug: (str) => {
        debugLog('STOMP Debug:', str);
      },
    });

    this.setupEventHandlers();
  }

  // ==========================================
  // CONNECTION MANAGEMENT
  // ==========================================

  /**
   * Connect to the WebSocket server
   */
  async connect(): Promise<void> {
    if (this.client.connected) {
      debugLog('WebSocket already connected');
      return;
    }

    if (this.isConnecting && this.connectionPromise) {
      debugLog('WebSocket connection in progress, waiting...');
      return this.connectionPromise;
    }

    this.isConnecting = true;
    this.connectionPromise = new Promise((resolve, reject) => {
      const connectTimeout = setTimeout(() => {
        reject(new Error('WebSocket connection timeout'));
      }, 30000); // 30 second timeout for mobile

      this.client.onConnect = () => {
        clearTimeout(connectTimeout);
        this.isConnecting = false;
        this.reconnectAttempts = 0;
        debugLog('WebSocket connected successfully');
        this.eventHandlers.onConnect?.();
        resolve();
      };

      this.client.onDisconnect = () => {
        clearTimeout(connectTimeout);
        this.isConnecting = false;
        debugLog('WebSocket disconnected');
        this.eventHandlers.onDisconnect?.();
      };

      this.client.onWebSocketError = (error) => {
        clearTimeout(connectTimeout);
        this.isConnecting = false;
        errorLog('WebSocket connection error:', error);
        reject(error);
      };

      // Set authentication headers
      this.setAuthHeaders()
        .then(() => {
          this.client.activate();
        })
        .catch((error) => {
          clearTimeout(connectTimeout);
          this.isConnecting = false;
          reject(error);
        });
    });

    return this.connectionPromise;
  }

  /**
   * Disconnect from the WebSocket server
   */
  async disconnect(): Promise<void> {
    debugLog('Disconnecting WebSocket...');
    
    // Clear all subscriptions
    this.subscriptions.forEach(sub => sub.unsubscribe());
    this.subscriptions.clear();

    if (this.client.connected) {
      await this.client.deactivate();
    }

    this.connectionPromise = null;
    debugLog('WebSocket disconnected');
  }

  /**
   * Check if WebSocket is connected
   */
  isConnected(): boolean {
    return this.client.connected;
  }

  // ==========================================
  // EVENT HANDLERS SETUP
  // ==========================================

  /**
   * Set event handlers for WebSocket events
   */
  setEventHandlers(handlers: WebSocketEventHandlers): void {
    this.eventHandlers = { ...this.eventHandlers, ...handlers };
  }

  private setupEventHandlers(): void {
    this.client.onStompError = (frame) => {
      errorLog('STOMP error:', frame);
      this.eventHandlers.onError?.({
        error: `STOMP Error: ${frame.headers['message']}`,
        timestamp: Date.now()
      });
    };

    this.client.onWebSocketClose = (event) => {
      debugLog('WebSocket closed:', event);
      this.handleReconnect();
    };
  }

  private async handleReconnect(): Promise<void> {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      const delay = Math.min(this.reconnectDelay * Math.pow(2, this.reconnectAttempts), 30000);
      
      debugLog(`Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts}) in ${delay}ms`);
      
      setTimeout(async () => {
        try {
          await this.connect();
          this.eventHandlers.onReconnect?.();
        } catch (error) {
          errorLog('Reconnection failed:', error);
        }
      }, delay);
    } else {
      errorLog('Max reconnection attempts reached');
    }
  }

  private async setAuthHeaders(): Promise<void> {
    try {
      const token = await tokenStorage.getAccessToken();
      if (token) {
        this.client.connectHeaders = {
          'Authorization': `Bearer ${token}`
        };
        debugLog('WebSocket auth headers set successfully');
      } else {
        debugLog('No access token available for WebSocket connection');
      }
    } catch (error) {
      errorLog('Failed to set auth headers:', error);
      // Don't throw error - WebSocket should work without auth for testing
      this.client.connectHeaders = {};
    }
  }

  // ==========================================
  // GROUP MESSAGING SUBSCRIPTIONS
  // ==========================================

  /**
   * Subscribe to messages for a specific group
   */
  async subscribeToGroupMessages(groupId: number): Promise<void> {
    if (!this.client.connected) {
      await this.connect();
    }

    const destination = `/topic/group/${groupId}/messages`;
    const subscriptionKey = `group-${groupId}-messages`;

    if (this.subscriptions.has(subscriptionKey)) {
      debugLog(`Already subscribed to group ${groupId} messages`);
      return;
    }

    const subscription = this.client.subscribe(destination, (message: IMessage) => {
      try {
        const messageData: MessageResponse = JSON.parse(message.body);
        debugLog(`Received message in group ${groupId}:`, messageData);
        this.eventHandlers.onMessage?.(messageData);
      } catch (error) {
        errorLog('Error parsing group message:', error);
      }
    });

    this.subscriptions.set(subscriptionKey, subscription);
    debugLog(`Subscribed to group ${groupId} messages`);
  }

  /**
   * Subscribe to typing indicators for a specific group
   */
  async subscribeToGroupTyping(groupId: number): Promise<void> {
    if (!this.client.connected) {
      await this.connect();
    }

    const destination = `/topic/group/${groupId}/typing`;
    const subscriptionKey = `group-${groupId}-typing`;

    if (this.subscriptions.has(subscriptionKey)) {
      return;
    }

    const subscription = this.client.subscribe(destination, (message: IMessage) => {
      try {
        const typingData: TypingIndicator = JSON.parse(message.body);
        debugLog(`Typing indicator in group ${groupId}:`, typingData);
        this.eventHandlers.onTypingIndicator?.(typingData);
      } catch (error) {
        errorLog('Error parsing typing indicator:', error);
      }
    });

    this.subscriptions.set(subscriptionKey, subscription);
    debugLog(`Subscribed to group ${groupId} typing indicators`);
  }

  /**
   * Subscribe to user presence updates
   */
  async subscribeToPresence(): Promise<void> {
    if (!this.client.connected) {
      await this.connect();
    }

    const destination = '/topic/presence';
    const subscriptionKey = 'presence';

    if (this.subscriptions.has(subscriptionKey)) {
      return;
    }

    const subscription = this.client.subscribe(destination, (message: IMessage) => {
      try {
        const presenceData: UserPresence = JSON.parse(message.body);
        debugLog('User presence update:', presenceData);
        this.eventHandlers.onUserPresence?.(presenceData);
      } catch (error) {
        errorLog('Error parsing presence update:', error);
      }
    });

    this.subscriptions.set(subscriptionKey, subscription);
    debugLog('Subscribed to user presence updates');
  }

  /**
   * Subscribe to personal error messages
   */
  async subscribeToErrors(): Promise<void> {
    if (!this.client.connected) {
      await this.connect();
    }

    const destination = '/user/queue/errors';
    const subscriptionKey = 'errors';

    if (this.subscriptions.has(subscriptionKey)) {
      return;
    }

    const subscription = this.client.subscribe(destination, (message: IMessage) => {
      try {
        const errorData: WebSocketError = JSON.parse(message.body);
        debugLog('WebSocket error received:', errorData);
        this.eventHandlers.onError?.(errorData);
      } catch (error) {
        errorLog('Error parsing WebSocket error:', error);
      }
    });

    this.subscriptions.set(subscriptionKey, subscription);
    debugLog('Subscribed to error messages');
  }

  // ==========================================
  // MESSAGE SENDING
  // ==========================================

  /**
   * Send a message to a group via WebSocket
   */
  async sendMessage(groupId: number, request: SendMessageRequest): Promise<void> {
    if (!this.client.connected) {
      await this.connect();
    }

    try {
      this.client.publish({
        destination: `/app/group/${groupId}/send`,
        body: JSON.stringify(request)
      });
      debugLog(`Message sent to group ${groupId}:`, request);
    } catch (error) {
      errorLog('Failed to send message via WebSocket:', error);
      throw error;
    }
  }

  /**
   * Send typing indicator
   */
  async sendTypingIndicator(groupId: number, isTyping: boolean): Promise<void> {
    if (!this.client || !this.client.connected) {
      debugLog('Skipping typing indicator - WebSocket not connected');
      return; // Fail silently for typing indicators
    }

    try {
      const indicator: Omit<TypingIndicator, 'username'> = {
        isTyping,
        groupId
      };

      this.client.publish({
        destination: `/app/group/${groupId}/typing`,
        body: JSON.stringify(indicator)
      });
      debugLog(`Typing indicator sent to group ${groupId}:`, isTyping);
    } catch (error) {
      debugLog('Failed to send typing indicator (non-critical):', error.message);
      // Don't throw - typing indicators are non-critical
    }
  }

  /**
   * Update user presence status
   */
  async updatePresence(status: 'ONLINE' | 'AWAY' | 'OFFLINE'): Promise<void> {
    // Skip presence updates if client is not properly connected
    if (!this.client || !this.client.connected) {
      debugLog('Skipping presence update - WebSocket not connected');
      return;
    }

    try {
      const presence: Omit<UserPresence, 'username'> = {
        status,
        lastSeen: new Date().toISOString()
      };

      this.client.publish({
        destination: '/app/presence',
        body: JSON.stringify(presence)
      });
      debugLog('Presence updated:', status);
    } catch (error) {
      debugLog('Failed to update presence (non-critical):', error.message);
      // Don't throw error for presence updates as they're non-critical
    }
  }

  // ==========================================
  // SUBSCRIPTION MANAGEMENT
  // ==========================================

  /**
   * Unsubscribe from a specific group's messages
   */
  unsubscribeFromGroup(groupId: number): void {
    const messagesKey = `group-${groupId}-messages`;
    const typingKey = `group-${groupId}-typing`;

    const messagesSub = this.subscriptions.get(messagesKey);
    if (messagesSub) {
      messagesSub.unsubscribe();
      this.subscriptions.delete(messagesKey);
    }

    const typingSub = this.subscriptions.get(typingKey);
    if (typingSub) {
      typingSub.unsubscribe();
      this.subscriptions.delete(typingKey);
    }

    debugLog(`Unsubscribed from group ${groupId}`);
  }

  /**
   * Get all active subscriptions
   */
  getActiveSubscriptions(): string[] {
    return Array.from(this.subscriptions.keys());
  }

  // ==========================================
  // UTILITY METHODS
  // ==========================================

  /**
   * Subscribe to all necessary channels for a group
   */
  async subscribeToGroup(groupId: number): Promise<void> {
    await Promise.all([
      this.subscribeToGroupMessages(groupId),
      this.subscribeToGroupTyping(groupId),
      this.subscribeToPresence(),
      this.subscribeToErrors()
    ]);
  }

  /**
   * Get connection status
   */
  getConnectionStatus(): 'connected' | 'connecting' | 'disconnected' {
    if (this.client.connected) return 'connected';
    if (this.isConnecting) return 'connecting';
    return 'disconnected';
  }
}

// Create singleton instance
export const webSocketService = new WebSocketMessagingService();