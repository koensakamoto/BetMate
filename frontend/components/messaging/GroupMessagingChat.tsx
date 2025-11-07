import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  FlatList,
  Alert,
  RefreshControl,
  KeyboardAvoidingView,
  Platform,
  Text,
  Keyboard
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { 
  MessageResponse, 
  SendMessageRequest, 
  TypingIndicator as TypingIndicatorType,
  UserPresence,
  WebSocketError
} from '../../types/api';
import { messagingService, webSocketService } from '../../services';
import { useAuth } from '../../contexts/AuthContext';
import MessageBubble from './MessageBubble';
import MessageInput from './MessageInput';
import TypingIndicator from './TypingIndicator';

interface GroupMessagingChatProps {
  groupId: number;
  groupName?: string;
}

const GroupMessagingChat: React.FC<GroupMessagingChatProps> = ({
  groupId,
  groupName
}) => {
  const insets = useSafeAreaInsets();
  const flatListRef = useRef<FlatList>(null);
  const { user, isLoading: authLoading } = useAuth();
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);

  // Generate unique component instance ID for isolation
  const componentInstanceId = useRef(`comp_${groupId}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`).current;
  
  // State
  const [messages, setMessages] = useState<MessageResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const [replyToMessage, setReplyToMessage] = useState<MessageResponse | null>(null);
  const [editingMessage, setEditingMessage] = useState<MessageResponse | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'connecting' | 'disconnected'>('disconnected');

  // Initialize when user becomes available or group changes
  useEffect(() => {
    // Track the previous group ID for cleanup
    let currentGroupId = groupId;
    let isComponentMounted = true;

    // DEFENSIVE CLEANUP: Immediately clear all state when groupId changes
    setMessages([]);
    setTypingUsers([]);
    setReplyToMessage(null);
    setEditingMessage(null);
    setConnectionStatus('disconnected');

    console.log(`[GroupChat ${groupId}] 🔄 Component effect triggered - clearing state and initializing for group ${groupId} (instance: ${componentInstanceId})`);

    // Force a brief delay to ensure state clearing completes before WebSocket setup
    const initTimeout = setTimeout(() => {
      if (isComponentMounted && user && !authLoading) {
        console.log(`[GroupChat ${groupId}] ✅ Initializing chat for group ${groupId}`);
        initializeChat();
      }
    }, 50); // Small delay to ensure state is cleared

    return () => {
      isComponentMounted = false;
      clearTimeout(initTimeout);
      console.log(`[GroupChat ${currentGroupId}] 🧹 Cleaning up group ${currentGroupId}`);
      cleanup(currentGroupId);
    };
  }, [groupId, user, authLoading]);

  // Keyboard handling - Professional smooth transitions
  useEffect(() => {
    const keyboardWillShowListener = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      (e) => {
        setIsKeyboardVisible(true);
        // Smooth scroll to bottom when keyboard appears
        setTimeout(() => {
          scrollToBottom();
        }, 100);
      }
    );

    const keyboardWillHideListener = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      (e) => {
        setIsKeyboardVisible(false);
      }
    );

    return () => {
      keyboardWillShowListener?.remove();
      keyboardWillHideListener?.remove();
    };
  }, []);

  const initializeChat = async () => {
    try {
      // Check if user is available from context
      if (!user) {
        console.log('User not available, skipping chat initialization');
        return;
      }

      console.log('Initializing chat for user:', user.username);

      // Load initial messages
      await loadMessages();

      // Setup WebSocket connection
      await setupWebSocket();
      
    } catch (error) {
      console.error('Failed to initialize chat:', error);
      Alert.alert('Error', 'Failed to load chat. Please try again.');
    }
  };

  const cleanup = async (cleanupGroupId: number) => {
    try {
      console.log(`[GroupChat ${cleanupGroupId}] 🧹 Starting cleanup for group ${cleanupGroupId}...`);

      // CLEANUP PHASE 1: WebSocket cleanup (most important for preventing cross-group bleeding)
      // Remove group-specific event handlers FIRST to prevent any new messages
      webSocketService.removeGroupEventHandlers(cleanupGroupId);
      console.log(`[GroupChat ${cleanupGroupId}] ✅ Event handlers removed`);

      // Unsubscribe from the specific group
      webSocketService.unsubscribeFromGroup(cleanupGroupId);
      console.log(`[GroupChat ${cleanupGroupId}] ✅ WebSocket subscriptions cleaned`);

      // CLEANUP PHASE 2: Clear UI state (non-critical)
      setTypingUsers([]);
      setReplyToMessage(null);
      setEditingMessage(null);
      setConnectionStatus('disconnected');
      console.log(`[GroupChat ${cleanupGroupId}] ✅ UI state cleared`);

      // NOTE: We don't clear messages here because they are loaded via HTTP API
      // and should persist until the new group loads its messages

      // CLEANUP PHASE 3: Update presence to offline (non-critical)
      webSocketService.updatePresence('OFFLINE'); // Don't await this

      console.log(`[GroupChat ${cleanupGroupId}] 🎯 Cleanup completed for group ${cleanupGroupId}`);
    } catch (error) {
      console.warn(`[GroupChat ${cleanupGroupId}] ⚠️ Error during cleanup (non-critical):`, error);
    }
  };

  // ==========================================
  // MESSAGE LOADING
  // ==========================================

  const loadMessages = async (refresh = false) => {
    if (refresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    try {
      const groupMessages = await messagingService.getRecentGroupMessages(groupId, 50);
      setMessages(groupMessages.reverse()); // Reverse to show newest at bottom
      
      // Scroll to bottom after loading
      setTimeout(() => {
        scrollToBottom();
      }, 100);
      
    } catch (error) {
      console.error('Failed to load messages:', error);
      Alert.alert('Error', 'Failed to load messages. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const scrollToBottom = () => {
    if (messages.length > 0) {
      flatListRef.current?.scrollToEnd({ animated: true });
    }
  };

  // ==========================================
  // WEBSOCKET SETUP
  // ==========================================

  const setupWebSocket = async () => {
    try {
      setConnectionStatus('connecting');
      console.log(`[GroupChat ${groupId}] Setting up WebSocket connection...`);

      // Set group-specific event handlers with component instance tracking
      webSocketService.setGroupEventHandlers(groupId, {
        onMessage: handleIncomingMessage,
        onMessageEdit: handleMessageEdit,
        onMessageDelete: handleMessageDelete,
        onTypingIndicator: handleTypingIndicator,
        onUserPresence: handleUserPresence,
        onError: handleWebSocketError,
        onConnect: () => {
          setConnectionStatus('connected');
          console.log(`[GroupChat ${groupId}] WebSocket connected successfully (instance: ${componentInstanceId})`);
        },
        onDisconnect: () => {
          setConnectionStatus('disconnected');
          console.log(`[GroupChat ${groupId}] WebSocket disconnected (instance: ${componentInstanceId})`);
        },
        onReconnect: () => {
          setConnectionStatus('connected');
          console.log(`[GroupChat ${groupId}] WebSocket reconnected (instance: ${componentInstanceId})`);
        }
      }, componentInstanceId);

      // Try to connect and subscribe to group channels with component instance ID
      await webSocketService.subscribeToGroup(groupId, componentInstanceId);
      console.log(`[GroupChat ${groupId}] Subscribed to group ${groupId} channels`);

      // Update presence to online (this might fail if connection isn't ready)
      setTimeout(() => {
        webSocketService.updatePresence('ONLINE');
      }, 1000); // Delay presence update to allow connection to stabilize

    } catch (error) {
      console.warn(`[GroupChat ${groupId}] WebSocket setup failed, will use HTTP fallback:`, error);
      setConnectionStatus('disconnected');
      // Don't throw error - the app should work with HTTP fallback
    }
  };

  // ==========================================
  // WEBSOCKET EVENT HANDLERS
  // ==========================================

  const handleIncomingMessage = useCallback((message: MessageResponse) => {
    console.log(`[GroupChat ${groupId}] 🔄 Received message for group ${message.groupId}: ${message.content?.substring(0, 50)}... (messageId: ${message.id}, instance: ${componentInstanceId})`);

    // DEFENSIVE LAYER 1: Component-level group ID check
    // This is a failsafe to ensure we're still processing the right group
    const currentGroupId = groupId; // Capture current group ID in this scope
    if (message.groupId !== currentGroupId) {
      console.error(`[GroupChat ${currentGroupId}] ❌ COMPONENT SAFETY: Message is for group ${message.groupId} but component is for group ${currentGroupId} (instance: ${componentInstanceId}) - BLOCKING`);
      return;
    }

    // DEFENSIVE LAYER 2: Strict group ID validation
    if (!message.groupId || typeof message.groupId !== 'number') {
      console.error(`[GroupChat ${groupId}] ❌ DEFENSIVE FILTER: Invalid groupId in message:`, message.groupId);
      return;
    }

    // DEFENSIVE LAYER 3: Exact group ID match (double-check)
    if (message.groupId !== groupId) {
      console.error(`[GroupChat ${groupId}] ❌ DEFENSIVE FILTER: Message groupId ${message.groupId} doesn't match current groupId ${groupId} - REJECTING`);
      return;
    }

    // DEFENSIVE LAYER 4: Message validity checks
    if (!message.id || !message.content || !message.senderUsername) {
      console.error(`[GroupChat ${groupId}] ❌ DEFENSIVE FILTER: Invalid message structure:`, { id: message.id, hasContent: !!message.content, sender: message.senderUsername });
      return;
    }

    console.log(`[GroupChat ${groupId}] ✅ All defensive filters passed - processing message`);
    setMessages(prevMessages => {
      // Check if message already exists to avoid duplicates
      const exists = prevMessages.some(m => m.id === message.id);
      if (exists) {
        console.log(`[GroupChat ${groupId}] ⚠️ Duplicate message detected, ignoring (messageId: ${message.id})`);
        return prevMessages;
      }

      console.log(`[GroupChat ${groupId}] ✅ Adding new message to state (messageId: ${message.id})`);
      return [...prevMessages, message];
    });

    // Auto-scroll if user is near bottom
    setTimeout(() => {
      scrollToBottom();
    }, 100);
  }, [groupId]);

  const handleMessageEdit = useCallback((editedMessage: MessageResponse) => {
    if (editedMessage.groupId === groupId) {
      setMessages(prevMessages => 
        prevMessages.map(m => 
          m.id === editedMessage.id ? editedMessage : m
        )
      );
    }
  }, [groupId]);

  const handleMessageDelete = useCallback((messageId: number) => {
    setMessages(prevMessages => 
      prevMessages.filter(m => m.id !== messageId)
    );
  }, []);

  const handleTypingIndicator = useCallback((indicator: TypingIndicatorType) => {
    if (indicator.groupId === groupId && user && indicator.username !== user.username) {
      setTypingUsers(prevTyping => {
        if (indicator.isTyping) {
          return prevTyping.includes(indicator.username) 
            ? prevTyping 
            : [...prevTyping, indicator.username];
        } else {
          return prevTyping.filter(username => username !== indicator.username);
        }
      });
    }
  }, [groupId, user]);

  const handleUserPresence = useCallback((presence: UserPresence) => {
    // Handle user presence updates if needed
    console.log('User presence update:', presence);
  }, []);

  const handleWebSocketError = useCallback((error: WebSocketError) => {
    console.error('WebSocket error:', error);
    // Could show a toast or other user feedback here
  }, []);

  // ==========================================
  // MESSAGE ACTIONS
  // ==========================================

  const handleSendMessage = async (request: SendMessageRequest) => {
    console.log(`[GroupChat ${groupId}] 🔍 HANDLE SEND MESSAGE: Current groupId=${groupId}, request.groupId=${request.groupId}, content="${request.content}"`);
    try {
      if (editingMessage) {
        // Edit existing message
        await messagingService.editMessage(editingMessage.id, { content: request.content });
        setEditingMessage(null);
      } else {
        // Send new message via WebSocket for real-time delivery
        await webSocketService.sendMessage(groupId, request);
      }
    } catch (error) {
      // Fallback to HTTP if WebSocket fails
      try {
        if (editingMessage) {
          const updated = await messagingService.editMessage(editingMessage.id, { content: request.content });
          handleMessageEdit(updated);
          setEditingMessage(null);
        } else {
          const newMessage = await messagingService.sendMessage(request);
          handleIncomingMessage(newMessage);
        }
      } catch (httpError) {
        console.error('Failed to send message via HTTP:', httpError);
        throw httpError;
      }
    }
  };

  const handleTyping = async (isTyping: boolean) => {
    try {
      await webSocketService.sendTypingIndicator(groupId, isTyping);
    } catch (error) {
      // Typing indicators are non-critical, fail silently
      console.warn('Failed to send typing indicator:', error);
    }
  };

  const handleReply = (message: MessageResponse) => {
    setReplyToMessage(message);
    setEditingMessage(null);
  };

  const handleEdit = (message: MessageResponse) => {
    setEditingMessage(message);
    setReplyToMessage(null);
  };

  const handleDelete = async (message: MessageResponse) => {
    try {
      await messagingService.deleteMessage(message.id);
      // The deletion will be handled by WebSocket event or we handle it locally
      handleMessageDelete(message.id);
    } catch (error) {
      console.error('Failed to delete message:', error);
      Alert.alert('Error', 'Failed to delete message. Please try again.');
    }
  };

  const cancelReply = () => setReplyToMessage(null);
  const cancelEdit = () => setEditingMessage(null);

  // ==========================================
  // RENDER METHODS
  // ==========================================

  const renderMessage = ({ item, index }: { item: MessageResponse; index: number }) => {
    const isLastInSequence = index === messages.length - 1 ||
      messages[index + 1]?.senderUsername !== item.senderUsername;


    return (
      <MessageBubble
        message={item}
        currentUsername={effectiveUsername}
        onReply={handleReply}
        onEdit={handleEdit}
        onDelete={handleDelete}
        isLastInSequence={isLastInSequence}
      />
    );
  };

  const keyExtractor = (item: MessageResponse) => item.id.toString();

  // Show loading state while auth is loading
  if (authLoading) {
    return (
      <View style={{ 
        flex: 1, 
        backgroundColor: '#0a0a0f', 
        justifyContent: 'center', 
        alignItems: 'center' 
      }}>
        <Text style={{ color: '#8b8b8b', fontSize: 16 }}>Loading...</Text>
      </View>
    );
  }

  // Show auth required state if no user
  if (!user) {
    return (
      <View style={{
        flex: 1,
        backgroundColor: '#0a0a0f',
        justifyContent: 'center',
        alignItems: 'center'
      }}>
        <Text style={{ color: '#8b8b8b', fontSize: 16, textAlign: 'center' }}>
          Please log in to access group chat
        </Text>
      </View>
    );
  }

  // Get effective username for message alignment - try multiple fallbacks
  const getEffectiveUsername = (user: any): string => {
    // Try username field first
    if (user && user.username && typeof user.username === 'string' && user.username.trim() !== '') {
      return user.username.trim();
    }

    // Fallback to name field
    if (user && user.name && typeof user.name === 'string' && user.name.trim() !== '') {
      return user.name.trim();
    }

    // Fallback to email prefix (before @)
    if (user && user.email && typeof user.email === 'string' && user.email.includes('@')) {
      return user.email.split('@')[0].trim();
    }

    // Last resort - use user ID
    if (user && user.id) {
      return `user_${user.id}`;
    }

    // DEVELOPMENT: For testing purposes when user is not authenticated
    // Return a development username instead of blocking
    return 'dev_user';
  };

  const effectiveUsername = getEffectiveUsername(user);

  // Log authentication status for debugging
  console.log('[GroupMessagingChat] Auth status:', {
    hasUser: !!user,
    isLoading: authLoading,
    effectiveUsername,
    userKeys: user ? Object.keys(user) : 'null',
    userValues: user ? {
      id: user.id,
      username: user.username,
      email: user.email,
      name: user.name
    } : 'null'
  });

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: '#0a0a0f' }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 85 + insets.bottom : 0}
    >
      <View style={{ flex: 1 }}>
        {/* Messages List */}
        <FlatList
          ref={flatListRef}
          data={messages}
          renderItem={renderMessage}
          keyExtractor={keyExtractor}
          style={{ flex: 1 }}
          contentContainerStyle={{
            paddingTop: 16,
            paddingBottom: 8,
            flexGrow: 1
          }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => loadMessages(true)}
              tintColor="#8b8b8b"
              colors={['#6366f1']}
            />
          }
          onContentSizeChange={scrollToBottom}
          onLayout={scrollToBottom}
          showsVerticalScrollIndicator={false}
          keyboardDismissMode="interactive"
          keyboardShouldPersistTaps="handled"
          maintainVisibleContentPosition={{
            minIndexForVisible: 0,
            autoscrollToTopThreshold: 10,
          }}
          // Performance optimizations
          initialNumToRender={15}
          maxToRenderPerBatch={10}
          windowSize={10}
          updateCellsBatchingPeriod={50}
        />

        {/* Typing Indicator */}
        <TypingIndicator typingUsers={typingUsers} />

        {/* Message Input - positioned above keyboard */}
        <MessageInput
          groupId={groupId}
          onSendMessage={handleSendMessage}
          onTyping={handleTyping}
          replyToMessage={replyToMessage}
          onCancelReply={cancelReply}
          editingMessage={editingMessage}
          onCancelEdit={cancelEdit}
          disabled={false}
          placeholder={
            connectionStatus === 'connecting'
              ? 'Connecting to real-time...'
              : connectionStatus === 'connected'
              ? 'Type a message...'
              : 'Type a message... (using HTTP)'
          }
        />
      </View>
    </KeyboardAvoidingView>
  );
};

export default GroupMessagingChat;