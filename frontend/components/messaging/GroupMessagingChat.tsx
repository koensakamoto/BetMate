import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  FlatList,
  Alert,
  RefreshControl,
  KeyboardAvoidingView,
  Platform,
  Text,
  Keyboard,
  Animated,
  Dimensions,
  Easing
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
  const keyboardHeight = useRef(new Animated.Value(0)).current;
  const contentScale = useRef(new Animated.Value(1)).current;
  
  // State
  const [messages, setMessages] = useState<MessageResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const [replyToMessage, setReplyToMessage] = useState<MessageResponse | null>(null);
  const [editingMessage, setEditingMessage] = useState<MessageResponse | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'connecting' | 'disconnected'>('disconnected');

  // Initialize when user becomes available
  useEffect(() => {
    if (user && !authLoading) {
      initializeChat();
    }
    return () => cleanup();
  }, [groupId, user, authLoading]);

  // Keyboard handling
  useEffect(() => {
    const keyboardWillShowListener = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      (e) => {
        // Parallel animations for smooth, natural movement
        Animated.parallel([
          Animated.spring(keyboardHeight, {
            toValue: e.endCoordinates.height,
            tension: 100,
            friction: 8,
            useNativeDriver: false,
          }),
          Animated.spring(contentScale, {
            toValue: 0.98,
            tension: 100,
            friction: 8,
            useNativeDriver: true,
          })
        ]).start();
      }
    );
    
    const keyboardWillHideListener = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      (e) => {
        // Slightly faster hide animation with spring
        Animated.parallel([
          Animated.spring(keyboardHeight, {
            toValue: 0,
            tension: 120,
            friction: 9,
            useNativeDriver: false,
          }),
          Animated.spring(contentScale, {
            toValue: 1,
            tension: 120,
            friction: 9,
            useNativeDriver: true,
          })
        ]).start();
      }
    );

    return () => {
      keyboardWillShowListener?.remove();
      keyboardWillHideListener?.remove();
    };
  }, [keyboardHeight, contentScale]);

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

  const cleanup = async () => {
    try {
      console.log('Cleaning up messaging chat...');
      
      // Unsubscribe from WebSocket events
      webSocketService.unsubscribeFromGroup(groupId);
      
      // Update presence to offline when leaving chat (non-critical)
      webSocketService.updatePresence('OFFLINE'); // Don't await this
    } catch (error) {
      console.warn('Error during cleanup (non-critical):', error);
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
      console.log('Setting up WebSocket connection...');
      
      // Set event handlers
      webSocketService.setEventHandlers({
        onMessage: handleIncomingMessage,
        onMessageEdit: handleMessageEdit,
        onMessageDelete: handleMessageDelete,
        onTypingIndicator: handleTypingIndicator,
        onUserPresence: handleUserPresence,
        onError: handleWebSocketError,
        onConnect: () => {
          setConnectionStatus('connected');
          console.log('WebSocket connected successfully');
        },
        onDisconnect: () => {
          setConnectionStatus('disconnected');
          console.log('WebSocket disconnected');
        },
        onReconnect: () => {
          setConnectionStatus('connected');
          console.log('WebSocket reconnected');
        }
      });

      // Try to connect and subscribe to group channels
      await webSocketService.subscribeToGroup(groupId);
      console.log(`Subscribed to group ${groupId} channels`);
      
      // Update presence to online (this might fail if connection isn't ready)
      setTimeout(() => {
        webSocketService.updatePresence('ONLINE');
      }, 1000); // Delay presence update to allow connection to stabilize
      
    } catch (error) {
      console.warn('WebSocket setup failed, will use HTTP fallback:', error);
      setConnectionStatus('disconnected');
      // Don't throw error - the app should work with HTTP fallback
    }
  };

  // ==========================================
  // WEBSOCKET EVENT HANDLERS
  // ==========================================

  const handleIncomingMessage = useCallback((message: MessageResponse) => {
    if (message.groupId === groupId) {
      setMessages(prevMessages => {
        // Check if message already exists to avoid duplicates
        const exists = prevMessages.some(m => m.id === message.id);
        if (exists) return prevMessages;
        
        return [...prevMessages, message];
      });
      
      // Auto-scroll if user is near bottom
      setTimeout(() => {
        scrollToBottom();
      }, 100);
    }
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
        currentUsername={user?.username || ''}
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

  return (
    <View style={{ flex: 1, backgroundColor: '#0a0a0f' }}>
      {/* Messages List */}
      <Animated.View 
        style={{ 
          flex: 1,
          marginBottom: keyboardHeight,
          transform: [{ scale: contentScale }]
        }}
      >
        <FlatList
          ref={flatListRef}
          data={messages}
          renderItem={renderMessage}
          keyExtractor={keyExtractor}
          style={{ flex: 1 }}
          contentContainerStyle={{ paddingTop: 16, paddingBottom: 8 }}
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
          disabled={false} // Always allow messaging - will use HTTP fallback if WebSocket fails
          placeholder={
            connectionStatus === 'connecting' 
              ? 'Connecting to real-time...' 
              : connectionStatus === 'connected'
              ? 'Type a message...'
              : 'Type a message... (using HTTP)'
          }
        />
      </Animated.View>
    </View>
  );
};

export default GroupMessagingChat;