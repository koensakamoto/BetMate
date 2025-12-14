import { Client, StompSubscription, IMessage } from '@stomp/stompjs';
import { z } from 'zod';
import { ENV, debugLog, errorLog } from '../../config/env';
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
  timestamp: z.string(),
  type: z.enum(['TEXT', 'SYSTEM', 'IMAGE']).optional(),
  replyToId: z.number().nullable().optional(),
  isEdited: z.boolean().optional(),
  senderProfilePicture: z.string().nullable().optional(),
});

/**
 * Schema for validating typing indicator messages
 */
const TypingIndicatorSchema = z.object({
  isTyping: z.boolean(),
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

  constructor() {
    debugLog('[WS-INIT] 🚀 Initializing WebSocket service');
    debugLog('[WS-INIT] WebSocket URL:', ENV.WS_BASE_URL);

    this.client = new Client({
      brokerURL: ENV.WS_BASE_URL, // Use pure WebSocket URL

      // CRITICAL for React Native: Provide WebSocket factory with detailed logging
      webSocketFactory: () => {
        debugLog('[WS-FACTORY] 🏭 Creating new WebSocket instance');
        const ws = new WebSocket(ENV.WS_BASE_URL);

        // Log raw WebSocket lifecycle
        ws.onopen = (event) => {
          debugLog('[WS-RAW] ✅ WebSocket opened', event);
        };

        ws.onerror = (event) => {
          errorLog('[WS-RAW] ❌ WebSocket error', event);
        };

        ws.onclose = (event) => {
          debugLog('[WS-RAW] 🔌 WebSocket closed', {
            code: event.code,
            reason: event.reason,
            wasClean: event.wasClean
          });
        };

        ws.onmessage = (event) => {
          debugLog('[WS-RAW] 📨 Raw message received, length:', event.data?.length || 0);
        };

        return ws;
      },

      // React Native compatibility flags
      forceBinaryWSFrames: true, // Force binary frames to avoid NULL byte chopping
      appendMissingNULLonIncoming: true, // Handle missing NULL terminators
      splitLargeFrames: true, // Break large frames into chunks

      reconnectDelay: this.reconnectDelay,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
      maxWebSocketChunkSize: 8 * 1024, // 8KB chunks for mobile

      // Comprehensive STOMP debug logging
      debug: (str) => {
        const timestamp = new Date().toISOString();
        debugLog(`[STOMP-DEBUG ${timestamp}]:`, str);

        // Highlight critical STOMP frames
        if (str.includes('CONNECT')) {
          debugLog('[STOMP-LIFECYCLE] 🔗 SENDING CONNECT FRAME');
        } else if (str.includes('CONNECTED')) {
          debugLog('[STOMP-LIFECYCLE] ✅ RECEIVED CONNECTED FRAME');
        } else if (str.includes('ERROR')) {
          errorLog('[STOMP-LIFECYCLE] ❌ STOMP ERROR FRAME:', str);
        } else if (str.includes('SUBSCRIBE')) {
          debugLog('[STOMP-LIFECYCLE] 📬 SUBSCRIBE FRAME');
        } else if (str.includes('MESSAGE')) {
          debugLog('[STOMP-LIFECYCLE] 📨 MESSAGE FRAME');
        }
      },

      // Log connection attempts
      beforeConnect: () => {
        const timestamp = new Date().toISOString();
        debugLog(`[STOMP-LIFECYCLE ${timestamp}] 🚀 BEFORE CONNECT - Starting connection attempt`);
      },
    });

    this.setupEventHandlers();
    debugLog('[WS-INIT] ✅ WebSocket service initialized');
  }

  // ==========================================
  // CONNECTION MANAGEMENT
  // ==========================================

  /**
   * Connect to the WebSocket server
   */
  async connect(): Promise<void> {
    const startTime = Date.now();
    debugLog('[WS-CONNECT] 🎯 Connect method called');

    // Null guard for client
    if (!this.client) {
      errorLog('[WS-CONNECT] ❌ WebSocket client is not initialized');
      throw new Error('WebSocket client is not initialized');
    }

    if (this.client.connected) {
      debugLog('[WS-CONNECT] ✅ WebSocket already connected');
      return;
    }

    if (this.isConnecting && this.connectionPromise) {
      debugLog('[WS-CONNECT] ⏳ WebSocket connection in progress, waiting...');
      return this.connectionPromise;
    }

    this.isConnecting = true;
    debugLog('[WS-CONNECT] 🚀 Starting new connection attempt');

    this.connectionPromise = new Promise((resolve, reject) => {
      const connectTimeout = setTimeout(() => {
        const elapsed = Date.now() - startTime;
        errorLog(`[WS-CONNECT] ⏰ CONNECTION TIMEOUT after ${elapsed}ms`);
        errorLog('[WS-CONNECT] WebSocket state:', {
          connected: this.client.connected,
          active: this.client.active,
          webSocket: this.client.webSocket ? 'exists' : 'null'
        });
        reject(new Error('WebSocket connection timeout'));
      }, 30000); // 30 second timeout for mobile

      this.client.onConnect = (frame) => {
        clearTimeout(connectTimeout);
        this.isConnecting = false;
        this.reconnectAttempts = 0;
        const elapsed = Date.now() - startTime;
        debugLog(`[WS-CONNECT] ✅ WebSocket CONNECTED successfully in ${elapsed}ms`);
        debugLog('[WS-CONNECT] CONNECTED frame:', frame);
        this.globalEventHandlers.onConnect?.();
        resolve();
      };

      this.client.onDisconnect = (frame) => {
        clearTimeout(connectTimeout);
        this.isConnecting = false;
        const elapsed = Date.now() - startTime;
        debugLog(`[WS-CONNECT] 🔌 WebSocket DISCONNECTED after ${elapsed}ms`);
        debugLog('[WS-CONNECT] DISCONNECT frame:', frame);
        this.globalEventHandlers.onDisconnect?.();
      };

      this.client.onWebSocketError = (error) => {
        clearTimeout(connectTimeout);
        this.isConnecting = false;
        const elapsed = Date.now() - startTime;
        errorLog(`[WS-CONNECT] ❌ WebSocket ERROR after ${elapsed}ms:`, error);
        errorLog('[WS-CONNECT] Error details:', {
          message: error.message,
          type: error.type,
          target: error.target ? 'WebSocket' : 'unknown'
        });
        reject(error);
      };

      // Set authentication headers
      debugLog('[WS-CONNECT] 🔑 Setting authentication headers...');
      this.setAuthHeaders()
        .then(() => {
          debugLog('[WS-CONNECT] 🔑 Auth headers set, activating client...');
          debugLog('[WS-CONNECT] Connect headers:', {
            hasAuth: !!this.client.connectHeaders?.['Authorization'],
            headerCount: Object.keys(this.client.connectHeaders || {}).length
          });
          this.client.activate();
          debugLog('[WS-CONNECT] 📡 Client activation initiated');
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
    debugLog('Disconnecting WebSocket...');

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
    debugLog('WebSocket disconnected');
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
    debugLog(`[WS-HANDLERS] Setting event handlers for group ${groupId} (instance: ${componentInstanceId})`);
    debugLog(`[WS-HANDLERS] Current registered groups: [${Array.from(this.groupEventHandlers.keys()).join(', ')}]`);
    debugLog(`[WS-HANDLERS] Current active group: ${this.activeGroupId}`);
    debugLog(`[WS-HANDLERS] Subscription transition in progress: ${this.subscriptionTransition}`);

    // Generate component instance ID if not provided
    const instanceId = componentInstanceId || `comp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Store component instance for this group
    this.componentInstances.set(groupId, instanceId);

    // Store group-specific handlers
    this.groupEventHandlers.set(groupId, { ...handlers });

    // CRITICAL: Only set as active group if no transition is in progress
    if (!this.subscriptionTransition) {
      this.activeGroupId = groupId;
      debugLog(`[WS-HANDLERS] ✅ Active group set to: ${groupId} (instance: ${instanceId})`);
    } else {
      debugLog(`[WS-HANDLERS] ⏳ Deferring active group change - transition in progress`);
    }

    debugLog(`[WS-HANDLERS] Groups after registration: [${Array.from(this.groupEventHandlers.keys()).join(', ')}]`);

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
      debugLog(`[WS-HANDLERS] ✅ Global handlers updated for active group ${groupId}`);
    } else {
      debugLog(`[WS-HANDLERS] ⏭️  Skipping global handler update - group ${groupId} is not active (active: ${this.activeGroupId}) or transition in progress: ${this.subscriptionTransition}`);
    }
  }

  /**
   * Remove event handlers for a specific group with complete cleanup
   */
  removeGroupEventHandlers(groupId: number): void {
    debugLog(`[WS-HANDLERS] Removing event handlers for group ${groupId}`);
    debugLog(`[WS-HANDLERS] Groups before removal: [${Array.from(this.groupEventHandlers.keys()).join(', ')}]`);

    const wasRemoved = this.groupEventHandlers.delete(groupId);
    const instanceRemoved = this.componentInstances.delete(groupId);
    const lockRemoved = this.subscriptionLock.delete(groupId);

    // If this was the active group, clear active group
    if (this.activeGroupId === groupId) {
      this.activeGroupId = null;
      debugLog(`[WS-HANDLERS] ✅ Cleared active group (was ${groupId})`);

      // Clear global handlers for the removed group
      this.globalEventHandlers = {
        onConnect: undefined,
        onDisconnect: undefined,
        onReconnect: undefined,
        onError: undefined,
        onUserPresence: undefined
      };
      debugLog(`[WS-HANDLERS] ✅ Cleared global handlers for removed active group`);
    }

    debugLog(`[WS-HANDLERS] Cleanup results - Handler removed: ${wasRemoved}, Instance removed: ${instanceRemoved}, Lock removed: ${lockRemoved}`);
    debugLog(`[WS-HANDLERS] Groups after removal: [${Array.from(this.groupEventHandlers.keys()).join(', ')}]`);
  }

  /**
   * Get event handlers for a specific group
   */
  private getGroupEventHandlers(groupId: number): WebSocketEventHandlers | undefined {
    return this.groupEventHandlers.get(groupId);
  }

  private setupEventHandlers(): void {
    debugLog('[WS-SETUP] 🔧 Setting up event handlers');

    this.client.onStompError = (frame) => {
      errorLog('[STOMP-ERROR] ❌ STOMP error frame received:', frame);
      errorLog('[STOMP-ERROR] Error details:', {
        command: frame.command,
        headers: frame.headers,
        body: frame.body,
        message: frame.headers?.['message'],
        receiptId: frame.headers?.['receipt-id']
      });
      this.globalEventHandlers.onError?.({
        error: `STOMP Error: ${frame.headers['message']}`,
        timestamp: Date.now()
      });
    };

    this.client.onWebSocketClose = (event) => {
      debugLog('[WS-CLOSE] 🔌 WebSocket closed event:', {
        code: event.code,
        reason: event.reason,
        wasClean: event.wasClean,
        timestamp: new Date().toISOString()
      });

      // Interpret close codes
      if (event.code === 1000) {
        debugLog('[WS-CLOSE] Normal closure');
      } else if (event.code === 1006) {
        errorLog('[WS-CLOSE] Abnormal closure - connection lost without close frame');
      } else if (event.code >= 3000 && event.code <= 3999) {
        errorLog('[WS-CLOSE] Application-specific close code:', event.code);
      } else {
        errorLog('[WS-CLOSE] Unexpected close code:', event.code);
      }

      this.handleReconnect();
    };

    debugLog('[WS-SETUP] ✅ Event handlers configured');
  }

  private async handleReconnect(): Promise<void> {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      const delay = Math.min(this.reconnectDelay * Math.pow(2, this.reconnectAttempts), 30000);
      
      debugLog(`Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts}) in ${delay}ms`);
      
      setTimeout(async () => {
        try {
          await this.connect();
          this.globalEventHandlers.onReconnect?.();
        } catch (error) {
          errorLog('Reconnection failed:', error);
        }
      }, delay);
    } else {
      errorLog('Max reconnection attempts reached');
    }
  }

  private async setAuthHeaders(): Promise<void> {
    debugLog('[WS-AUTH] 🔑 Retrieving access token...');
    try {
      const token = await tokenStorage.getAccessToken();
      if (token) {
        // Log token info (safely - only length and first/last few chars)
        const tokenPreview = `${token.substring(0, 10)}...${token.substring(token.length - 10)}`;
        debugLog('[WS-AUTH] ✅ Access token retrieved:', {
          length: token.length,
          preview: tokenPreview
        });

        this.client.connectHeaders = {
          'Authorization': `Bearer ${token}`
        };
        debugLog('[WS-AUTH] ✅ WebSocket auth headers set successfully');
        debugLog('[WS-AUTH] Connect headers keys:', Object.keys(this.client.connectHeaders));
      } else {
        // Security: Fail connection if no token available - don't allow unauthenticated connections
        errorLog('[WS-AUTH] ❌ No access token available - authentication required for WebSocket connection');
        throw new Error('Authentication required: No access token available for WebSocket connection');
      }
    } catch (error) {
      // Security: Fail connection on auth errors - don't allow unauthenticated fallback
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

    // Verify connection succeeded
    if (!this.client.connected) {
      throw new Error('Failed to establish WebSocket connection');
    }

    const destination = `/topic/group/${groupId}/messages`;
    const subscriptionKey = `group-${groupId}-messages`;

    // First, unsubscribe from any existing subscription for this group
    const existingSub = this.subscriptions.get(subscriptionKey);
    if (existingSub) {
      debugLog(`Unsubscribing from existing group ${groupId} messages subscription`);
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
        debugLog(`[WS-MESSAGE] Received message via subscription for group ${groupId}: ${messageData.content?.substring(0, 50)}... (messageId: ${messageData.id}, actualGroupId: ${messageData.groupId})`);

        // SAFETY LAYER 1: Check if subscription transition is in progress
        if (this.subscriptionTransition) {
          debugLog(`[WS-MESSAGE] ⏳ SAFETY: Subscription transition in progress - DROPPING MESSAGE for group ${groupId}`);
          return;
        }

        // SAFETY LAYER 2: Check if this group subscription is for the currently active group
        if (this.activeGroupId !== groupId) {
          debugLog(`[WS-MESSAGE] ❌ SAFETY: Subscription for group ${groupId} received message but active group is ${this.activeGroupId} - DROPPING MESSAGE`);
          return;
        }

        // SAFETY LAYER 3: Validate component instance exists for this group
        const componentInstance = this.componentInstances.get(groupId);
        if (!componentInstance) {
          debugLog(`[WS-MESSAGE] ❌ SAFETY: No component instance found for group ${groupId} - DROPPING MESSAGE`);
          return;
        }

        // SAFETY LAYER 4: Only call handler if message groupId matches subscription groupId
        if (messageData.groupId === groupId) {
          const groupHandlers = this.getGroupEventHandlers(groupId);
          if (groupHandlers?.onMessage) {
            debugLog(`[WS-MESSAGE] ✅ Calling onMessage handler for group ${groupId} (instance: ${componentInstance}) with message from group ${messageData.groupId}`);
            groupHandlers.onMessage(messageData);
          } else {
            debugLog(`[WS-MESSAGE] ❌ No message handler found for group ${groupId}`);
          }
        } else {
          debugLog(`[WS-MESSAGE] ❌ Message groupId ${messageData.groupId} doesn't match subscription groupId ${groupId} - DROPPING MESSAGE`);
        }
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
    if (!this.client) {
      throw new Error('WebSocket client is not initialized');
    }

    if (!this.client.connected) {
      await this.connect();
    }

    // Verify connection succeeded
    if (!this.client.connected) {
      throw new Error('Failed to establish WebSocket connection');
    }

    const destination = `/topic/group/${groupId}/typing`;
    const subscriptionKey = `group-${groupId}-typing`;

    // First, unsubscribe from any existing subscription for this group
    const existingSub = this.subscriptions.get(subscriptionKey);
    if (existingSub) {
      debugLog(`Unsubscribing from existing group ${groupId} typing subscription`);
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
        debugLog(`Typing indicator in group ${groupId}:`, typingData);
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
    debugLog(`Subscribed to group ${groupId} typing indicators`);
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

    // Verify connection succeeded
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
        debugLog('User presence update:', presenceData);
        this.globalEventHandlers.onUserPresence?.(presenceData);
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
    if (!this.client) {
      throw new Error('WebSocket client is not initialized');
    }

    if (!this.client.connected) {
      await this.connect();
    }

    // Verify connection succeeded
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
        debugLog('WebSocket error received:', errorData);
        this.globalEventHandlers.onError?.(errorData);
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
    if (!this.client) {
      throw new Error('WebSocket client is not initialized');
    }

    if (!this.client.connected) {
      await this.connect();
    }

    // Verify connection succeeded
    if (!this.client.connected) {
      throw new Error('Failed to establish WebSocket connection');
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
      debugLog('Failed to send typing indicator (non-critical):', error);
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
        status: status as PresenceStatus,
        lastSeen: new Date().toISOString()
      };

      this.client.publish({
        destination: '/app/presence',
        body: JSON.stringify(presence)
      });
      debugLog('Presence updated:', status);
    } catch (error) {
      debugLog('Failed to update presence (non-critical):', error);
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
    debugLog(`[UNSUBSCRIBE] Starting unsubscribe from group ${groupId}`);
    debugLog(`[UNSUBSCRIBE] Current subscriptions: [${Array.from(this.subscriptions.keys()).join(', ')}]`);

    const messagesKey = `group-${groupId}-messages`;
    const typingKey = `group-${groupId}-typing`;

    const messagesSub = this.subscriptions.get(messagesKey);
    if (messagesSub) {
      messagesSub.unsubscribe();
      this.subscriptions.delete(messagesKey);
      debugLog(`[UNSUBSCRIBE] ✅ Unsubscribed from group ${groupId} messages`);
    } else {
      debugLog(`[UNSUBSCRIBE] ❌ No messages subscription found for group ${groupId}`);
    }

    const typingSub = this.subscriptions.get(typingKey);
    if (typingSub) {
      typingSub.unsubscribe();
      this.subscriptions.delete(typingKey);
      debugLog(`[UNSUBSCRIBE] ✅ Unsubscribed from group ${groupId} typing`);
    } else {
      debugLog(`[UNSUBSCRIBE] ❌ No typing subscription found for group ${groupId}`);
    }

    debugLog(`[UNSUBSCRIBE] ✅ Fully unsubscribed from group ${groupId}`);
    debugLog(`[UNSUBSCRIBE] Remaining subscriptions: [${Array.from(this.subscriptions.keys()).join(', ')}]`);
  }

  /**
   * Synchronously unsubscribe from all groups with immediate effect
   */
  private unsubscribeFromAllGroupsSynchronous(): void {
    debugLog('[SYNC-UNSUB] Starting synchronous unsubscription from all groups...');
    debugLog(`[SYNC-UNSUB] Current subscriptions: [${Array.from(this.subscriptions.keys()).join(', ')}]`);

    // Mark transition as in progress
    this.subscriptionTransition = true;

    // Find and unsubscribe from all group-related subscriptions synchronously
    const groupSubscriptions = Array.from(this.subscriptions.keys()).filter(key =>
      key.startsWith('group-')
    );

    debugLog(`[SYNC-UNSUB] Found ${groupSubscriptions.length} group subscriptions to remove: [${groupSubscriptions.join(', ')}]`);

    // Synchronously unsubscribe from all group subscriptions
    groupSubscriptions.forEach(key => {
      const subscription = this.subscriptions.get(key);
      if (subscription) {
        try {
          subscription.unsubscribe();
          this.subscriptions.delete(key);
          debugLog(`[SYNC-UNSUB] ✅ Unsubscribed from ${key}`);
        } catch (error) {
          errorLog(`[SYNC-UNSUB] ❌ Error unsubscribing from ${key}:`, error);
        }
      }
    });

    // Clear all subscription locks
    this.subscriptionLock.clear();
    debugLog('[SYNC-UNSUB] ✅ Cleared all subscription locks');

    // Reset active group during transition
    const previousActiveGroup = this.activeGroupId;
    this.activeGroupId = null;
    debugLog(`[SYNC-UNSUB] ✅ Reset active group (was: ${previousActiveGroup})`);

    debugLog(`[SYNC-UNSUB] ✅ Synchronous unsubscription complete. Remaining subscriptions: [${Array.from(this.subscriptions.keys()).join(', ')}]`);
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
  async subscribeToGroup(groupId: number, componentInstanceId?: string): Promise<void> {
    debugLog(`[SUBSCRIPTION] Starting bulletproof subscription to group ${groupId} (instance: ${componentInstanceId})`);
    debugLog(`[SUBSCRIPTION] Active subscriptions before: ${this.getActiveSubscriptions().join(', ')}`);
    debugLog(`[SUBSCRIPTION] Current active group: ${this.activeGroupId}`);
    debugLog(`[SUBSCRIPTION] Subscription locks: [${Array.from(this.subscriptionLock.entries()).map(([k, v]) => `${k}:${v}`).join(', ')}]`);

    // Check if subscription is already in progress for this group
    if (this.subscriptionLock.get(groupId)) {
      debugLog(`[SUBSCRIPTION] ⏳ Subscription already in progress for group ${groupId} - waiting...`);
      // Wait for existing subscription to complete
      while (this.subscriptionLock.get(groupId)) {
        await new Promise(resolve => setTimeout(resolve, 10));
      }
      debugLog(`[SUBSCRIPTION] ✅ Previous subscription completed for group ${groupId}`);
      return;
    }

    // Lock this group's subscription
    this.subscriptionLock.set(groupId, true);
    debugLog(`[SUBSCRIPTION] 🔒 Locked subscription for group ${groupId}`);

    try {
      // PHASE 1: SYNCHRONOUS CLEANUP - Block until all previous subscriptions are removed
      this.unsubscribeFromAllGroupsSynchronous();
      debugLog(`[SUBSCRIPTION] ✅ Phase 1 complete: Synchronous cleanup done`);

      // PHASE 2: VALIDATE CLEAN STATE
      const remainingGroupSubs = this.getActiveSubscriptions().filter(key => key.startsWith('group-'));
      if (remainingGroupSubs.length > 0) {
        errorLog(`[SUBSCRIPTION] ❌ CRITICAL: Clean state validation failed. Remaining group subscriptions: [${remainingGroupSubs.join(', ')}]`);
        throw new Error('Failed to achieve clean subscription state');
      }
      debugLog(`[SUBSCRIPTION] ✅ Phase 2 complete: Clean state validated`);

      // PHASE 3: SET NEW ACTIVE GROUP
      this.activeGroupId = groupId;
      this.subscriptionTransition = false; // Allow new subscriptions
      debugLog(`[SUBSCRIPTION] ✅ Phase 3 complete: Set active group to ${groupId}`);

      // PHASE 4: CREATE NEW SUBSCRIPTIONS
      await Promise.all([
        this.subscribeToGroupMessages(groupId),
        this.subscribeToGroupTyping(groupId),
        this.subscribeToPresence(),
        this.subscribeToErrors()
      ]);
      debugLog(`[SUBSCRIPTION] ✅ Phase 4 complete: New subscriptions created`);

      debugLog(`[SUBSCRIPTION] ✅ BULLETPROOF SUBSCRIPTION COMPLETE for group ${groupId}`);
      debugLog(`[SUBSCRIPTION] Final active subscriptions: ${this.getActiveSubscriptions().join(', ')}`);
      debugLog(`[SUBSCRIPTION] Final active group: ${this.activeGroupId}`);

    } catch (error) {
      errorLog(`[SUBSCRIPTION] ❌ CRITICAL ERROR during subscription to group ${groupId}:`, error);
      // Reset state on error
      this.subscriptionTransition = false;
      this.activeGroupId = null;
      throw error;
    } finally {
      // Always unlock the subscription
      this.subscriptionLock.delete(groupId);
      debugLog(`[SUBSCRIPTION] 🔓 Unlocked subscription for group ${groupId}`);
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
}

// Create singleton instance
export const webSocketService = new WebSocketMessagingService();