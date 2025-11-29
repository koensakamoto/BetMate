import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Text,
  View,
  TextInput,
  TouchableOpacity,
  Alert,
  Keyboard,
  Platform,
  Animated,
  LayoutAnimation,
  Dimensions,
  NativeSyntheticEvent,
  TextInputContentSizeChangeEventData
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { MessageResponse, SendMessageRequest, MessageType } from '../../types/api';

interface MessageInputProps {
  groupId: number;
  onSendMessage: (request: SendMessageRequest) => Promise<void>;
  onTyping?: (isTyping: boolean) => void;
  replyToMessage?: MessageResponse | null;
  onCancelReply?: () => void;
  editingMessage?: MessageResponse | null;
  onCancelEdit?: () => void;
  disabled?: boolean;
  placeholder?: string;
}

const { width: screenWidth } = Dimensions.get('window');

const MessageInput: React.FC<MessageInputProps> = ({
  groupId,
  onSendMessage,
  onTyping,
  replyToMessage,
  onCancelReply,
  editingMessage,
  onCancelEdit,
  disabled = false,
  placeholder = "Message..."
}) => {
  const insets = useSafeAreaInsets();
  const [message, setMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [inputHeight, setInputHeight] = useState(36);
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<TextInput>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Smooth animations for professional feel
  const borderOpacity = useRef(new Animated.Value(0.1)).current;
  const sendButtonScale = useRef(new Animated.Value(0.8)).current;
  const inputContainerHeight = useRef(new Animated.Value(40)).current;

  // Auto-focus when replying or editing
  useEffect(() => {
    if (replyToMessage || editingMessage) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [replyToMessage, editingMessage]);

  // Set message content when editing
  useEffect(() => {
    if (editingMessage) {
      setMessage(editingMessage.content);
    } else {
      setMessage('');
    }
  }, [editingMessage]);



  // Memoize text change handler to prevent recreation on every render
  const handleTextChange = useCallback((text: string) => {
    setMessage(text);

    // Animate send button when text is entered/cleared
    Animated.spring(sendButtonScale, {
      toValue: text.trim().length > 0 ? 1 : 0.8,
      useNativeDriver: true,
      tension: 150,
      friction: 8,
    }).start();

    // Handle typing indicators
    if (onTyping && text.trim().length > 0) {
      onTyping(true);

      // Clear existing timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }

      // Set typing to false after 2 seconds of inactivity
      typingTimeoutRef.current = setTimeout(() => {
        onTyping(false);
      }, 2000);
    } else if (onTyping && text.trim().length === 0) {
      onTyping(false);
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    }
  }, [onTyping, sendButtonScale]);

  const handleSend = async () => {
    const trimmedMessage = message.trim();
    if (!trimmedMessage || isSending || disabled) return;

    // Haptic feedback and animation
    setIsSending(true);

    // Bounce animation on send button - like iMessage
    Animated.sequence([
      Animated.spring(sendButtonScale, {
        toValue: 0.7,
        useNativeDriver: true,
        tension: 200,
        friction: 5,
      }),
      Animated.spring(sendButtonScale, {
        toValue: 0.8,
        useNativeDriver: true,
        tension: 150,
        friction: 8,
      })
    ]).start();

    try {
      const request: SendMessageRequest = {
        groupId,
        content: trimmedMessage,
        messageType: MessageType.TEXT,
        parentMessageId: replyToMessage?.id
      };

      console.log(`[MessageInput] 🔍 SENDING MESSAGE: groupId=${groupId}, content="${trimmedMessage}", request=`, request);
      await onSendMessage(request);

      // Clear the input and reset states with smooth spring animation
      LayoutAnimation.configureNext({
        duration: 200,
        create: {
          type: LayoutAnimation.Types.spring,
          property: LayoutAnimation.Properties.opacity,
          springDamping: 0.9,
        },
        update: {
          type: LayoutAnimation.Types.spring,
          springDamping: 0.9,
        },
      });
      setMessage('');
      setInputHeight(36);

      // Smooth height reset animation
      Animated.spring(inputContainerHeight, {
        toValue: 40,
        useNativeDriver: false,
        tension: 100,
        friction: 10,
      }).start();

      if (onTyping) onTyping(false);
      if (replyToMessage && onCancelReply) onCancelReply();
      if (editingMessage && onCancelEdit) onCancelEdit();

      // Keep keyboard open for rapid messaging (modern chat app UX)
      // Users can still dismiss manually via swipe or tapping message list

    } catch (error) {
      console.error('Failed to send message:', error);
      Alert.alert('Error', 'Failed to send message. Please try again.');
    } finally {
      setIsSending(false);
    }
  };


  const handleContentSizeChange = (event: NativeSyntheticEvent<TextInputContentSizeChangeEventData>) => {
    const { height } = event.nativeEvent.contentSize;
    const newHeight = Math.min(Math.max(height, 36), 100);

    // Smooth spring animation for height changes - like iMessage
    Animated.spring(inputContainerHeight, {
      toValue: newHeight + 8,
      useNativeDriver: false,
      tension: 100,
      friction: 10,
    }).start();

    setInputHeight(newHeight);
  };

  const handleFocus = () => {
    setIsFocused(true);
    // Smooth spring animation on focus - like iMessage
    Animated.spring(borderOpacity, {
      toValue: 0.3,
      useNativeDriver: false,
      tension: 100,
      friction: 8,
    }).start();
  };

  const handleBlur = () => {
    setIsFocused(false);
    // Smooth spring animation on blur
    Animated.spring(borderOpacity, {
      toValue: 0.1,
      useNativeDriver: false,
      tension: 100,
      friction: 8,
    }).start();
  };

  const canSend = message.trim().length > 0 && !isSending && !disabled;
  const isEditing = !!editingMessage;
  const isReplying = !!replyToMessage;

  return (
    <View style={{
      backgroundColor: 'rgba(0, 0, 0, 0.95)',
      borderTopWidth: 0.5,
      borderTopColor: 'rgba(255, 255, 255, 0.1)',
      paddingHorizontal: 12,
      paddingTop: 8,
      paddingBottom: Math.max(16, insets.bottom + 8)
    }}>
      {/* Reply/Edit indicator */}
      {(isReplying || isEditing) && (
        <Animated.View style={{
          flexDirection: 'row',
          alignItems: 'center',
          backgroundColor: 'rgba(255, 255, 255, 0.1)',
          borderRadius: 16,
          paddingHorizontal: 12,
          paddingVertical: 8,
          marginBottom: 8,
          borderLeftWidth: 3,
          borderLeftColor: isEditing ? '#FFD700' : '#00D4AA',
        }}>
          <View style={{
            backgroundColor: isEditing ? 'rgba(255, 215, 0, 0.2)' : 'rgba(0, 212, 170, 0.2)',
            borderRadius: 10,
            padding: 4,
            marginRight: 8
          }}>
            <MaterialIcons
              name={isEditing ? 'edit' : 'reply'}
              size={14}
              color={isEditing ? '#FFD700' : '#00D4AA'}
            />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{
              color: 'rgba(255, 255, 255, 0.8)',
              fontSize: 11,
              fontWeight: '600',
              marginBottom: 1
            }}>
              {isEditing ? 'Editing message' : `Replying to ${replyToMessage?.senderDisplayName}`}
            </Text>
            <Text style={{
              color: 'rgba(255, 255, 255, 0.6)',
              fontSize: 13,
            }} numberOfLines={1}>
              {isEditing ? editingMessage?.content : replyToMessage?.content}
            </Text>
          </View>
          <TouchableOpacity
            onPress={isEditing ? onCancelEdit : onCancelReply}
            style={{
              backgroundColor: 'rgba(255, 255, 255, 0.1)',
              borderRadius: 10,
              padding: 6
            }}
          >
            <MaterialIcons name="close" size={14} color="rgba(255, 255, 255, 0.8)" />
          </TouchableOpacity>
        </Animated.View>
      )}

      {/* Main input container with smooth animations */}
      <Animated.View style={{
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.08)',
        borderRadius: 20,
        paddingHorizontal: 4,
        paddingVertical: 4,
        borderWidth: 0,
      }}>
        {/* Text input */}
        <TextInput
          ref={inputRef}
          value={message}
          onChangeText={handleTextChange}
          onContentSizeChange={handleContentSizeChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          placeholder={placeholder}
          placeholderTextColor="rgba(255, 255, 255, 0.5)"
          style={{
            flex: 1,
            color: '#FFFFFF',
            fontSize: 15,
            lineHeight: 20,
            includeFontPadding: false,
            textAlignVertical: 'center',
            height: inputHeight,
            paddingHorizontal: 10,
            paddingVertical: 8,
          }}
          multiline
          editable={!disabled}
          returnKeyType="default"
          keyboardAppearance="dark"
          blurOnSubmit={false}
          onSubmitEditing={handleSend}
        />

        {/* Send button with smooth scale animation */}
        <TouchableOpacity
          onPress={handleSend}
          disabled={!canSend}
          style={{
            marginRight: 2,
            marginLeft: 2,
            paddingVertical: 2
          }}
        >
          <Animated.View
            style={{
              borderRadius: 16,
              width: 32,
              height: 32,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: canSend ? '#00D4AA' : 'rgba(255, 255, 255, 0.2)',
              transform: [{ scale: sendButtonScale }],
            }}
          >
            {isSending ? (
              <MaterialIcons name="hourglass-empty" size={16} color="#FFFFFF" />
            ) : (
              <MaterialIcons
                name={isEditing ? "check" : "send"}
                size={16}
                color="#FFFFFF"
              />
            )}
          </Animated.View>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
};

export default MessageInput;