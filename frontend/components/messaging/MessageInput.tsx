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
  Dimensions
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
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
  const [showAttachmentOptions, setShowAttachmentOptions] = useState(false);
  const [inputHeight, setInputHeight] = useState(36);
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<TextInput>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Smooth animations for professional feel
  const attachmentRotation = useRef(new Animated.Value(0)).current;
  const borderOpacity = useRef(new Animated.Value(0.1)).current;

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
  }, [onTyping]);

  const handleSend = async () => {
    const trimmedMessage = message.trim();
    if (!trimmedMessage || isSending || disabled) return;

    // Haptic feedback and animation
    setIsSending(true);
    

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
        duration: 250,
        create: {
          type: LayoutAnimation.Types.spring,
          property: LayoutAnimation.Properties.opacity,
          springDamping: 0.8,
        },
        update: {
          type: LayoutAnimation.Types.spring,
          springDamping: 0.8,
        },
      });
      setMessage('');
      setInputHeight(36);
      if (onTyping) onTyping(false);
      if (replyToMessage && onCancelReply) onCancelReply();
      if (editingMessage && onCancelEdit) onCancelEdit();

      // Dismiss keyboard smoothly
      Keyboard.dismiss();
      
    } catch (error) {
      console.error('Failed to send message:', error);
      Alert.alert('Error', 'Failed to send message. Please try again.');
    } finally {
      setIsSending(false);
    }
  };

  const handleAttachment = () => {
    // Smooth spring animation for attachment button rotation
    Animated.spring(attachmentRotation, {
      toValue: showAttachmentOptions ? 0 : 1,
      tension: 200,
      friction: 15,
      useNativeDriver: true,
    }).start();

    setShowAttachmentOptions(!showAttachmentOptions);
  };

  const handlePhotoAttachment = () => {
    setShowAttachmentOptions(false);
    attachmentRotation.setValue(0);
    // TODO: Implement photo picker
    Alert.alert('📷 Camera', 'Photo capture coming soon!');
  };

  const handleFileAttachment = () => {
    setShowAttachmentOptions(false);
    attachmentRotation.setValue(0);
    // TODO: Implement file picker
    Alert.alert('📎 Files', 'File attachments coming soon!');
  };

  const handleContentSizeChange = (event: any) => {
    const { height } = event.nativeEvent.contentSize;
    const newHeight = Math.min(Math.max(height, 36), 100);
    setInputHeight(newHeight);
  };

  const handleFocus = () => {
    setIsFocused(true);
    // Smooth border animation on focus - like iMessage
    Animated.timing(borderOpacity, {
      toValue: 0.3,
      duration: 200,
      useNativeDriver: false,
    }).start();
  };

  const handleBlur = () => {
    setIsFocused(false);
    // Smooth border animation on blur
    Animated.timing(borderOpacity, {
      toValue: 0.1,
      duration: 200,
      useNativeDriver: false,
    }).start();
  };

  const canSend = message.trim().length > 0 && !isSending && !disabled;
  const isEditing = !!editingMessage;
  const isReplying = !!replyToMessage;

  const rotateInterpolation = attachmentRotation.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '45deg']
  });

  return (
    <View style={{
      backgroundColor: 'rgba(0, 0, 0, 0.95)',
      borderTopWidth: 0.5,
      borderTopColor: 'rgba(255, 255, 255, 0.1)',
      paddingHorizontal: 12,
      paddingTop: 8,
      paddingBottom: Math.max(8, insets.bottom)
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

      {/* Attachment Options */}
      {showAttachmentOptions && (
        <Animated.View style={{
          flexDirection: 'row',
          justifyContent: 'space-around',
          paddingVertical: 6,
          marginBottom: 8
        }}>
          <TouchableOpacity
            onPress={handlePhotoAttachment}
            style={{
              alignItems: 'center',
              backgroundColor: 'rgba(255, 100, 150, 0.2)',
              borderRadius: 16,
              padding: 8,
              minWidth: 48
            }}
          >
            <Ionicons name="camera" size={20} color="#FF6496" />
            <Text style={{ color: '#FF6496', fontSize: 10, marginTop: 2, fontWeight: '600' }}>
              Camera
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            onPress={handleFileAttachment}
            style={{
              alignItems: 'center',
              backgroundColor: 'rgba(100, 150, 255, 0.2)',
              borderRadius: 16,
              padding: 8,
              minWidth: 48
            }}
          >
            <Ionicons name="document" size={20} color="#6496FF" />
            <Text style={{ color: '#6496FF', fontSize: 10, marginTop: 2, fontWeight: '600' }}>
              Files
            </Text>
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
        borderWidth: 1,
        borderColor: message.trim().length > 0
          ? 'rgba(0, 212, 170, 0.3)'
          : borderOpacity.interpolate({
              inputRange: [0.1, 0.3],
              outputRange: ['rgba(255, 255, 255, 0.1)', 'rgba(255, 255, 255, 0.3)']
            }),
        // Subtle shadow on focus for depth - like iMessage
        shadowColor: '#00D4AA',
        shadowOffset: { width: 0, height: isFocused ? 2 : 0 },
        shadowOpacity: isFocused ? 0.15 : 0,
        shadowRadius: isFocused ? 8 : 0,
        elevation: isFocused ? 3 : 0
      }}>
        {/* Attachment button */}
        <TouchableOpacity
          onPress={handleAttachment}
          disabled={disabled}
          style={{
            marginLeft: 6,
            marginRight: 2,
            opacity: disabled ? 0.5 : 1,
            padding: 6
          }}
        >
          <Animated.View
            style={{
              transform: [{ rotate: rotateInterpolation }]
            }}
          >
            <MaterialIcons
              name="add"
              size={20}
              color={showAttachmentOptions ? '#00D4AA' : 'rgba(255, 255, 255, 0.7)'}
            />
          </Animated.View>
        </TouchableOpacity>

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
          returnKeyType="send"
          blurOnSubmit={false}
          onSubmitEditing={handleSend}
        />

        {/* Send button */}
        <TouchableOpacity
          onPress={handleSend}
          disabled={!canSend}
          style={{
            marginRight: 2,
            marginLeft: 2,
            paddingVertical: 2
          }}
        >
          <View
            style={{
              borderRadius: 16,
              width: 32,
              height: 32,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: canSend ? '#00D4AA' : 'rgba(255, 255, 255, 0.2)',
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
          </View>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
};

export default MessageInput;