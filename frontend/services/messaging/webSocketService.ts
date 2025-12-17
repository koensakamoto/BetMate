import { Client, StompSubscription, IMessage } from '@stomp/stompjs';
import { z } from 'zod';
import { ENV, errorLog } from '../../config/env';
import { tokenStorage } from '../api';
import {
  MessageResponse,
  TypingIndicator,
  UserPresence,
  PresenceStatus,
  WebSocketError,
  WebSocketMessage,
  WebSocketMessageType,
  SendMessageRequest
} from '../../types/api';

// ==========================================
// SECURITY: Zod Schemas for Message Validation
// ==========================================

/**
 * Schema for validating incoming message responses from WebSocket
 * Prevents malformed messages from causing crashes or unexpected behavior
 */
const MessageResponseSchema = z.object({
  id: z.number(),
  content: z.string(),
  senderId: z.number(),
  senderUsername: z.string(),
  groupId: z.number(),
  createdAt: z.string(),  // Backend uses createdAt, not timestamp
  messageType: z.enum(['TEXT', 'SYSTEM', 'IMAGE']).optional(),
  isEdited: z.boolean().nullable().optional(),
  parentMessageId: z.number().nullable().optional(),
  senderDisplayName: z.string().nullable().optional(),
  groupName: z.string().nullable().optional(),
  attachmentUrl: z.string().nullable().optional(),
  attachmentType: z.string().nullable().optional(),
  editedAt: z.string().nullable().optional(),
  replyCount: z.number().nullable().optional(),
  updatedAt: z.string().nullable().optional(),
  canEdit: z.boolean().nullable().optional(),
  canDelete: z.boolean().nullable().optional(),
  canReply: z.boolean().nullable().optional(),
});

/**
 * Schema for validating typing indicator messages
 */
const TypingIndicatorSchema = z.object({
  typing: z.boolean(),  // Java serializes `isTyping` as `typing`
  groupId: z.number(),
  username: z.string().optional(),
});

/**
 * Schema for validating user presence updates
 */
const UserPresenceSchema = z.object({
  status: z.enum(['ONLINE', 'AWAY', 'OFFLINE']),
  lastSeen: z.string(),
  username: z.string().optional(),
});

/**
 * Schema for validating WebSocket error messages
 */
const WebSocketErrorSchema = z.object({
  error: z.string(),
  timestamp: z.number(),
});

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
  private groupEventHandlers: Map<number, WebSocketEventHandlers> = new Map(); // Group-specific handlers
  private globalEventHandlers: WebSocketEventHandlers = {}; // For presence, errors, etc.
  private activeGroupId: number | null = null; // Track currently active group
  private subscriptionLock: Map<number, boolean> = new Map(); // Prevent concurrent subscriptions
  private componentInstances: Map<number, string> = new Map(); // Track component instances
  private subscriptionTransition: boolean = false; // Track if subscription change is in progress
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000; // Start with 1 second
  private isConnecting = false;
  private connectionPromise: Promise<void> | null = null;
  // Store notification handler to survive React effect re-renders
  private notificationHandler: ((payload: unknown) => void) | null = null;
  // Callback to re-establish notification subscription after reconnect
  private notificationReconnectCallback: (() => void) | null = null;
  // Store connected username from STOMP frame (connectedHeaders is unreliable)
  private connectedUsername: string | null = null;

  constructor() {
    this.client = new Client({
      brokerURL: ENV.WS_BASE_URL,

      // CRITICAL for React Native: Provide WebSocket factory
      webSocketFactory: () => {
        const ws = new WebSocket(ENV.WS_BASE_URL);

        ws.onerror = (event) => {
          errorLog('[WS-RAW] ❌ WebSocket error', event);
        };

        return ws;
      },

      // React Native compatibility flags
      forceBinaryWSFrames: true,
      appendMissingNULLonIncoming: true,
      splitLargeFrames: true,

      reconnectDelay: this.reconnectDelay,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
      maxWebSocketChunkSize: 8 * 1024,

      // Only log STOMP errors
      debug: (str) => {
        if (str.includes('ERROR')) {
          errorLog('[STOMP] ❌ STOMP ERROR:', str);
        }
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
    if (!this.client) {
      errorLog('[WS-CONNECT] ❌ WebSocket client is not initialized');
      throw new Error('WebSocket client is not initialized');
    }

    if (this.client.connected) {
      return;
    }

    if (this.isConnecting && this.connectionPromise) {
      return this.connectionPromise;
    }

    this.isConnecting = true;

    this.connectionPromise = new Promise((resolve, reject) => {
      const connectTimeout = setTimeout(() => {
        errorLog('[WS-CONNECT] ⏰ CONNECTION TIMEOUT');
        reject(new Error('WebSocket connection timeout'));
      }, 30000);

      this.client.onConnect = (frame) => {
        clearTimeout(connectTimeout);
        this.isConnecting = false;
        this.reconnectAttempts = 0;
        // Store the username from the CONNECTED frame headers
        this.connectedUsername = frame?.headers?.['user-name'] || null;
        this.globalEventHandlers.onConnect?.();
        resolve();
      };

      this.client.onDisconnect = () => {
        clearTimeout(connectTimeout);
        this.isConnecting = false;
        this.connectedUsername = null; // Clear username on disconnect
        this.globalEventHandlers.onDisconnect?.();
      };

      this.client.onWebSocketError = (error) => {
        clearTimeout(connectTimeout);
        this.isConnecting = false;
        errorLog('[WS-CONNECT] ❌ WebSocket ERROR:', error);
        reject(error);
      };

      this.setAuthHeaders()
        .then(() => {
          this.client.activate();
        })
        .catch((error) => {
          clearTimeout(connectTimeout);
          this.isConnecting = false;
          errorLog('[WS-CONNECT] ❌ Failed to set auth headers:', error);
          reject(error);
        });
    });

    return this.connectionPromise;
  }

  /**
   * Disconnect from the WebSocket server
   */
  async disconnect(): Promise<void> {
    // Clear all subscriptions
    this.subscriptions.forEach(sub => {
      try {
        sub.unsubscribe();
      } catch {
        // Ignore unsubscribe errors during disconnect
      }
    });
    this.subscriptions.clear();

    if (this.client?.connected) {
      try {
        await this.client.deactivate();
      } catch (error) {
        errorLog('Error deactivating WebSocket client:', error);
      }
    }

    this.connectionPromise = null;
  }

  /**
   * Check if WebSocket is connected
   */
  isConnected(): boolean {
    return this.client?.connected ?? false;
  }

  // ==========================================
  // EVENT HANDLERS SETUP
  // ==========================================

  /**
   * Set event handlers for a specific group with component instance tracking
   */
  setGroupEventHandlers(groupId: number, handlers: WebSocketEventHandlers, componentInstanceId?: string): void {
    // Generate component instance ID if not provided
    const instanceId = componentInstanceId || `comp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Store component instance for this group
    this.componentInstances.set(groupId, instanceId);

    // Store group-specific handlers
    this.groupEventHandlers.set(groupId, { ...handlers });

    // CRITICAL: Only set as active group if no transition is in progress
    if (!this.subscriptionTransition) {
      this.activeGroupId = groupId;
    }

    // Only update global handlers if this is the currently active group and no transition is in progress
    if (this.activeGroupId === groupId && !this.subscriptionTransition) {
      this.globalEventHandlers = {
        ...this.globalEventHandlers,
        onConnect: handlers.onConnect,
        onDisconnect: handlers.onDisconnect,
        onReconnect: handlers.onReconnect,
        onError: handlers.onError,
        onUserPresence: handlers.onUserPresence
      };
    }
  }

  /**
   * Remove event handlers for a specific group with complete cleanup
   */
  removeGroupEventHandlers(groupId: number): void {
    this.groupEventHandlers.delete(groupId);
    this.componentInstances.delete(groupId);
    this.subscriptionLock.delete(groupId);

    // If this was the active group, clear active group
    if (this.activeGroupId === groupId) {
      this.activeGroupId = null;

      // Clear global handlers for the removed group
      this.globalEventHandlers = {
        onConnect: undefined,
        onDisconnect: undefined,
        onReconnect: undefined,
        onError: undefined,
        onUserPresence: undefined
      };
    }
  }

  /**
   * Get event handlers for a specific group
   */
  private getGroupEventHandlers(groupId: number): WebSocketEventHandlers | undefined {
    return this.groupEventHandlers.get(groupId);
  }

  private setupEventHandlers(): void {
    this.client.onStompError = (frame) => {
      errorLog('[STOMP-ERROR] ❌ STOMP error frame received:', frame);
      this.globalEventHandlers.onError?.({
        error: `STOMP Error: ${frame.headers['message']}`,
        timestamp: Date.now()
      });
    };

    this.client.onWebSocketClose = (event) => {
      if (event.code !== 1000) {
        errorLog('[WS-CLOSE] Abnormal closure, code:', event.code);
        // Clear all subscriptions - they're now invalid after abnormal WebSocket close
        this.subscriptions.clear();
      }
      this.handleReconnect();
    };
  }

  private async handleReconnect(): Promise<void> {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      const delay = Math.min(this.reconnectDelay * Math.pow(2, this.reconnectAttempts), 30000);

      setTimeout(async () => {
        try {
          await this.connect();
          this.globalEventHandlers.onReconnect?.();
          // Re-establish notification subscription after reconnect
          if (this.notificationReconnectCallback) {
            this.notificationReconnectCallback();
          }
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
      } else {
        errorLog('[WS-AUTH] ❌ No access token available');
        throw new Error('Authentication required: No access token available for WebSocket connection');
      }
    } catch (error) {
      errorLog('[WS-AUTH] ❌ Failed to set auth headers:', error);
      throw error instanceof Error ? error : new Error('Failed to authenticate WebSocket connection');
    }
  }

  // ==========================================
  // GROUP MESSAGING SUBSCRIPTIONS
  // ==========================================

  /**
   * Subscribe to messages for a specific group
   */
  async subscribeToGroupMessages(groupId: number): Promise<void> {
    if (!this.client) {
      throw new Error('WebSocket client is not initialized');
    }

    if (!this.client.connected) {
      await this.connect();
    }

    if (!this.client.connected) {
      throw new Error('Failed to establish WebSocket connection');
    }

    const destination = `/topic/group/${groupId}/messages`;
    const subscriptionKey = `group-${groupId}-messages`;

    // First, unsubscribe from any existing subscription for this group
    const existingSub = this.subscriptions.get(subscriptionKey);
    if (existingSub) {
      existingSub.unsubscribe();
      this.subscriptions.delete(subscriptionKey);
    }

    const subscription = this.client.subscribe(destination, (message: IMessage) => {
      try {
        // SECURITY: Validate message schema before processing
        const rawData = JSON.parse(message.body);
        const parseResult = MessageResponseSchema.safeParse(rawData);

        if (!parseResult.success) {
          errorLog('[WS-MESSAGE] ❌ SECURITY: Invalid message schema - rejecting message:', parseResult.error.issues);
          return;
        }

        const messageData = parseResult.data as unknown as MessageResponse;

        // SAFETY LAYER 1: Check if subscription transition is in progress
        if (this.subscriptionTransition) {
          return;
        }

        // SAFETY LAYER 2: Check if this group subscription is for the currently active group
        if (this.activeGroupId !== groupId) {
          return;
        }

        // SAFETY LAYER 3: Validate component instance exists for this group
        const componentInstance = this.componentInstances.get(groupId);
        if (!componentInstance) {
          return;
        }

        // SAFETY LAYER 4: Only call handler if message groupId matches subscription groupId
        if (messageData.groupId === groupId) {
          const groupHandlers = this.getGroupEventHandlers(groupId);
          groupHandlers?.onMessage?.(messageData);
        }
      } catch (error) {
        errorLog('Error parsing group message:', error);
      }
    });

    this.subscriptions.set(subscriptionKey, subscription);
  }

  /**
   * Subscribe to typing indicators for a specific group
   */
  async subscribeToGroupTyping(groupId: number): Promise<void> {
    if (!this.client) {
      throw new Error('WebSocket client is not initialized');
    }

    if (!this.client.connected) {
      await this.connect();
    }

    if (!this.client.connected) {
      throw new Error('Failed to establish WebSocket connection');
    }

    const destination = `/topic/group/${groupId}/typing`;
    const subscriptionKey = `group-${groupId}-typing`;

    // First, unsubscribe from any existing subscription for this group
    const existingSub = this.subscriptions.get(subscriptionKey);
    if (existingSub) {
      existingSub.unsubscribe();
      this.subscriptions.delete(subscriptionKey);
    }

    const subscription = this.client.subscribe(destination, (message: IMessage) => {
      try {
        // SECURITY: Validate typing indicator schema before processing
        const rawData = JSON.parse(message.body);
        const parseResult = TypingIndicatorSchema.safeParse(rawData);

        if (!parseResult.success) {
          errorLog('[WS-TYPING] ❌ SECURITY: Invalid typing indicator schema - rejecting:', parseResult.error.issues);
          return;
        }

        const typingData = parseResult.data as TypingIndicator;
        // Only call handler if it's for the current group
        if (typingData.groupId === groupId) {
          const groupHandlers = this.getGroupEventHandlers(groupId);
          groupHandlers?.onTypingIndicator?.(typingData);
        }
      } catch (error) {
        errorLog('Error parsing typing indicator:', error);
      }
    });

    this.subscriptions.set(subscriptionKey, subscription);
  }

  /**
   * Subscribe to user presence updates
   */
  async subscribeToPresence(): Promise<void> {
    if (!this.client) {
      throw new Error('WebSocket client is not initialized');
    }

    if (!this.client.connected) {
      await this.connect();
    }

    if (!this.client.connected) {
      throw new Error('Failed to establish WebSocket connection');
    }

    const destination = '/topic/presence';
    const subscriptionKey = 'presence';

    if (this.subscriptions.has(subscriptionKey)) {
      return;
    }

    const subscription = this.client.subscribe(destination, (message: IMessage) => {
      try {
        // SECURITY: Validate presence schema before processing
        const rawData = JSON.parse(message.body);
        const parseResult = UserPresenceSchema.safeParse(rawData);

        if (!parseResult.success) {
          errorLog('[WS-PRESENCE] ❌ SECURITY: Invalid presence schema - rejecting:', parseResult.error.issues);
          return;
        }

        const presenceData = parseResult.data as UserPresence;
        this.globalEventHandlers.onUserPresence?.(presenceData);
      } catch (error) {
        errorLog('Error parsing presence update:', error);
      }
    });

    this.subscriptions.set(subscriptionKey, subscription);
  }

  /**
   * Subscribe to user notifications queue
   * This receives real-time notifications when the user is online
   *
   * IMPORTANT: This method stores the handler and reuses existing subscription
   * to survive React effect re-renders without losing messages
   */
  async subscribeToNotifications(
    onNotification: (payload: unknown) => void
  ): Promise<() => void> {
    if (!this.client) {
      throw new Error('WebSocket client is not initialized');
    }

    // Always update the stored handler (so React effect updates work)
    this.notificationHandler = onNotification;

    // If subscription already exists and connected, reuse it (handler is updated above)
    const existingSub = this.subscriptions.get('user-notifications');
    if (existingSub && this.client.connected) {
      return () => {
        // Don't actually unsubscribe - keep subscription alive across re-renders
      };
    }

    if (!this.client.connected) {
      await this.connect();
    }

    if (!this.client.connected) {
      throw new Error('Failed to establish WebSocket connection');
    }

    const destination = '/user/queue/notifications';
    const subscriptionKey = 'user-notifications';

    // Use arrow function that calls stored handler (survives React re-renders)
    const subscription = this.client.subscribe(destination, (message: IMessage) => {
      try {
        const payload = JSON.parse(message.body);
        // DEBUG: Log the raw notification payload to diagnose content issues
        console.log('[WS-NOTIFICATIONS] Raw payload received:', JSON.stringify(payload, null, 2));
        console.log('[WS-NOTIFICATIONS] Content field:', payload.content);
        console.log('[WS-NOTIFICATIONS] Message field:', payload.message);
        // Call the STORED handler (not the closure-captured one)
        if (this.notificationHandler) {
          this.notificationHandler(payload);
        } else {
          errorLog('[WS-NOTIFICATIONS] No handler registered for notification!');
        }
      } catch (error) {
        errorLog('[WS-NOTIFICATIONS] Error parsing notification:', error);
      }
    });

    this.subscriptions.set(subscriptionKey, subscription);

    // Return cleanup function that doesn't actually unsubscribe
    // (keeps subscription alive across React effect re-renders)
    return () => {
      // Don't actually unsubscribe - keep subscription alive
    };
  }

  /**
   * Set callback to re-establish notification subscription after reconnect
   * This is needed because notification subscriptions become invalid on WebSocket close
   */
  setNotificationReconnectCallback(callback: (() => void) | null): void {
    this.notificationReconnectCallback = callback;
  }

  /**
   * Subscribe to personal error messages
   */
  async subscribeToErrors(): Promise<void> {
    if (!this.client) {
      throw new Error('WebSocket client is not initialized');
    }

    if (!this.client.connected) {
      await this.connect();
    }

    if (!this.client.connected) {
      throw new Error('Failed to establish WebSocket connection');
    }

    const destination = '/user/queue/errors';
    const subscriptionKey = 'errors';

    if (this.subscriptions.has(subscriptionKey)) {
      return;
    }

    const subscription = this.client.subscribe(destination, (message: IMessage) => {
      try {
        // SECURITY: Validate error schema before processing
        const rawData = JSON.parse(message.body);
        const parseResult = WebSocketErrorSchema.safeParse(rawData);

        if (!parseResult.success) {
          errorLog('[WS-ERROR] ❌ SECURITY: Invalid error schema - rejecting:', parseResult.error.issues);
          return;
        }

        const errorData = parseResult.data as WebSocketError;
        this.globalEventHandlers.onError?.(errorData);
      } catch (error) {
        errorLog('Error parsing WebSocket error:', error);
      }
    });

    this.subscriptions.set(subscriptionKey, subscription);
  }

  // ==========================================
  // MESSAGE SENDING
  // ==========================================

  /**
   * Send a message to a group via WebSocket
   */
  async sendMessage(groupId: number, request: SendMessageRequest): Promise<void> {
    if (!this.client) {
      throw new Error('WebSocket client is not initialized');
    }

    if (!this.client.connected) {
      await this.connect();
    }

    if (!this.client.connected) {
      throw new Error('Failed to establish WebSocket connection');
    }

    try {
      this.client.publish({
        destination: `/app/group/${groupId}/send`,
        body: JSON.stringify(request)
      });
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
    } catch {
      // Don't throw - typing indicators are non-critical
    }
  }

  /**
   * Update user presence status
   */
  async updatePresence(status: 'ONLINE' | 'AWAY' | 'OFFLINE'): Promise<void> {
    // Skip presence updates if client is not properly connected
    if (!this.client || !this.client.connected) {
      return;
    }

    try {
      const presence: Omit<UserPresence, 'username'> = {
        status: status as PresenceStatus,
        lastSeen: new Date().toISOString()
      };

      this.client.publish({
        destination: '/app/presence',
        body: JSON.stringify(presence)
      });
    } catch {
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
  }

  /**
   * Synchronously unsubscribe from all groups with immediate effect
   */
  private unsubscribeFromAllGroupsSynchronous(): void {
    // Mark transition as in progress
    this.subscriptionTransition = true;

    // Find and unsubscribe from all group-related subscriptions synchronously
    const groupSubscriptions = Array.from(this.subscriptions.keys()).filter(key =>
      key.startsWith('group-')
    );

    // Synchronously unsubscribe from all group subscriptions
    groupSubscriptions.forEach(key => {
      const subscription = this.subscriptions.get(key);
      if (subscription) {
        try {
          subscription.unsubscribe();
          this.subscriptions.delete(key);
        } catch (error) {
          errorLog(`[SYNC-UNSUB] ❌ Error unsubscribing from ${key}:`, error);
        }
      }
    });

    // Clear all subscription locks
    this.subscriptionLock.clear();

    // Reset active group during transition
    this.activeGroupId = null;
  }

  /**
   * Async wrapper for backward compatibility
   */
  unsubscribeFromAllGroups(): void {
    this.unsubscribeFromAllGroupsSynchronous();
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
   * Subscribe to all necessary channels for a group with bulletproof isolation
   */
  async subscribeToGroup(groupId: number, _componentInstanceId?: string): Promise<void> {
    // Check if subscription is already in progress for this group
    if (this.subscriptionLock.get(groupId)) {
      // Wait for existing subscription to complete
      while (this.subscriptionLock.get(groupId)) {
        await new Promise(resolve => setTimeout(resolve, 10));
      }
      return;
    }

    // Lock this group's subscription
    this.subscriptionLock.set(groupId, true);

    try {
      // PHASE 1: SYNCHRONOUS CLEANUP - Block until all previous subscriptions are removed
      this.unsubscribeFromAllGroupsSynchronous();

      // PHASE 2: VALIDATE CLEAN STATE
      const remainingGroupSubs = this.getActiveSubscriptions().filter(key => key.startsWith('group-'));
      if (remainingGroupSubs.length > 0) {
        errorLog(`[SUBSCRIPTION] ❌ CRITICAL: Clean state validation failed. Remaining: [${remainingGroupSubs.join(', ')}]`);
        throw new Error('Failed to achieve clean subscription state');
      }

      // PHASE 3: SET NEW ACTIVE GROUP
      this.activeGroupId = groupId;
      this.subscriptionTransition = false; // Allow new subscriptions

      // PHASE 4: CREATE NEW SUBSCRIPTIONS
      await Promise.all([
        this.subscribeToGroupMessages(groupId),
        this.subscribeToGroupTyping(groupId),
        this.subscribeToPresence(),
        this.subscribeToErrors()
      ]);

    } catch (error) {
      errorLog(`[SUBSCRIPTION] ❌ CRITICAL ERROR during subscription to group ${groupId}:`, error);
      // Reset state on error
      this.subscriptionTransition = false;
      this.activeGroupId = null;
      throw error;
    } finally {
      // Always unlock the subscription
      this.subscriptionLock.delete(groupId);
    }
  }

  /**
   * Get connection status
   */
  getConnectionStatus(): 'connected' | 'connecting' | 'disconnected' {
    if (this.client.connected) return 'connected';
    if (this.isConnecting) return 'connecting';
    return 'disconnected';
  }

  /**
   * Get the connected username from STOMP headers
   */
  getConnectedUsername(): string | null {
    // Use our stored username (connectedHeaders is unreliable in some STOMP client versions)
    return this.connectedUsername || this.client?.connectedHeaders?.['user-name'] || null;
  }
}

// Create singleton instance
export const webSocketService = new WebSocketMessagingService();