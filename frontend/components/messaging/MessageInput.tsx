import React, { useState, useRef, useEffect } from 'react';
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
  const [inputHeight, setInputHeight] = useState(40);
  const inputRef = useRef<TextInput>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Animations
  const sendButtonScale = useRef(new Animated.Value(0.8)).current;
  const attachmentRotation = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

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

  // Animate send button based on message content
  useEffect(() => {
    Animated.spring(sendButtonScale, {
      toValue: message.trim().length > 0 ? 1 : 0.8,
      useNativeDriver: true,
      tension: 300,
      friction: 10,
    }).start();
  }, [message]);

  // Pulsing animation for the send button when ready
  useEffect(() => {
    if (message.trim().length > 0) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.05,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      pulseAnim.setValue(1);
    }
  }, [message]);


  const handleTextChange = (text: string) => {
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
  };

  const handleSend = async () => {
    const trimmedMessage = message.trim();
    if (!trimmedMessage || isSending || disabled) return;

    // Haptic feedback and animation
    setIsSending(true);
    
    // Quick scale animation for send button
    Animated.sequence([
      Animated.timing(sendButtonScale, {
        toValue: 0.8,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(sendButtonScale, {
        toValue: 1.2,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(sendButtonScale, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
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
      
      // Clear the input and reset states with animation
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      setMessage('');
      setInputHeight(40);
      if (onTyping) onTyping(false);
      if (replyToMessage && onCancelReply) onCancelReply();
      if (editingMessage && onCancelEdit) onCancelEdit();
      
      // Dismiss keyboard
      Keyboard.dismiss();
      
    } catch (error) {
      console.error('Failed to send message:', error);
      Alert.alert('Error', 'Failed to send message. Please try again.');
    } finally {
      setIsSending(false);
    }
  };

  const handleAttachment = () => {
    // Animate attachment button rotation
    Animated.timing(attachmentRotation, {
      toValue: showAttachmentOptions ? 0 : 1,
      duration: 200,
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
    const newHeight = Math.min(Math.max(height, 40), 120);
    setInputHeight(newHeight);
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
      paddingHorizontal: 16,
      paddingTop: 12,
      paddingBottom: Math.max(insets.bottom, 16)
    }}>
      {/* Reply/Edit indicator */}
      {(isReplying || isEditing) && (
        <Animated.View style={{
          flexDirection: 'row',
          alignItems: 'center',
          backgroundColor: 'rgba(255, 255, 255, 0.1)',
          borderRadius: 16,
          paddingHorizontal: 16,
          paddingVertical: 12,
          marginBottom: 12,
          borderLeftWidth: 3,
          borderLeftColor: isEditing ? '#FFD700' : '#00D4FF',
        }}>
          <View style={{
            backgroundColor: isEditing ? 'rgba(255, 215, 0, 0.2)' : 'rgba(0, 212, 255, 0.2)',
            borderRadius: 12,
            padding: 6,
            marginRight: 10
          }}>
            <MaterialIcons 
              name={isEditing ? 'edit' : 'reply'} 
              size={16} 
              color={isEditing ? '#FFD700' : '#00D4FF'} 
            />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{
              color: 'rgba(255, 255, 255, 0.8)',
              fontSize: 12,
              fontWeight: '600',
              marginBottom: 2
            }}>
              {isEditing ? 'Editing message' : `Replying to ${replyToMessage?.senderDisplayName}`}
            </Text>
            <Text style={{
              color: 'rgba(255, 255, 255, 0.6)',
              fontSize: 14,
            }} numberOfLines={1}>
              {isEditing ? editingMessage?.content : replyToMessage?.content}
            </Text>
          </View>
          <TouchableOpacity
            onPress={isEditing ? onCancelEdit : onCancelReply}
            style={{
              backgroundColor: 'rgba(255, 255, 255, 0.1)',
              borderRadius: 12,
              padding: 8
            }}
          >
            <MaterialIcons name="close" size={16} color="rgba(255, 255, 255, 0.8)" />
          </TouchableOpacity>
        </Animated.View>
      )}

      {/* Attachment Options */}
      {showAttachmentOptions && (
        <Animated.View style={{
          flexDirection: 'row',
          justifyContent: 'space-around',
          paddingVertical: 12,
          marginBottom: 12
        }}>
          <TouchableOpacity
            onPress={handlePhotoAttachment}
            style={{
              alignItems: 'center',
              backgroundColor: 'rgba(255, 100, 150, 0.2)',
              borderRadius: 20,
              padding: 12,
              minWidth: 60
            }}
          >
            <Ionicons name="camera" size={24} color="#FF6496" />
            <Text style={{ color: '#FF6496', fontSize: 12, marginTop: 4, fontWeight: '600' }}>
              Camera
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            onPress={handleFileAttachment}
            style={{
              alignItems: 'center',
              backgroundColor: 'rgba(100, 150, 255, 0.2)',
              borderRadius: 20,
              padding: 12,
              minWidth: 60
            }}
          >
            <Ionicons name="document" size={24} color="#6496FF" />
            <Text style={{ color: '#6496FF', fontSize: 12, marginTop: 4, fontWeight: '600' }}>
              Files
            </Text>
          </TouchableOpacity>
        </Animated.View>
      )}

      {/* Main input container */}
      <View style={{
        flexDirection: 'row',
        alignItems: 'flex-end',
        backgroundColor: 'rgba(255, 255, 255, 0.08)',
        borderRadius: 25,
        paddingHorizontal: 6,
        paddingVertical: 6,
        borderWidth: 1,
        borderColor: message.trim().length > 0 ? 'rgba(0, 212, 255, 0.5)' : 'rgba(255, 255, 255, 0.1)',
      }}>
        {/* Attachment button */}
        <TouchableOpacity
          onPress={handleAttachment}
          disabled={disabled}
          style={{
            marginLeft: 8,
            marginRight: 4,
            opacity: disabled ? 0.5 : 1,
            padding: 4
          }}
        >
          <Animated.View
            style={{
              transform: [{ rotate: rotateInterpolation }]
            }}
          >
            <MaterialIcons 
              name="add" 
              size={24} 
              color={showAttachmentOptions ? '#00D4FF' : 'rgba(255, 255, 255, 0.7)'} 
            />
          </Animated.View>
        </TouchableOpacity>

        {/* Text input */}
        <TextInput
          ref={inputRef}
          value={message}
          onChangeText={handleTextChange}
          onContentSizeChange={handleContentSizeChange}
          onFocus={() => {
            // Small delay to ensure keyboard animation starts
            setTimeout(() => {
              inputRef.current?.focus();
            }, 100);
          }}
          placeholder={placeholder}
          placeholderTextColor="rgba(255, 255, 255, 0.5)"
          style={{
            flex: 1,
            color: '#FFFFFF',
            fontSize: 16,
            lineHeight: 22,
            height: inputHeight,
            paddingHorizontal: 12,
            paddingVertical: 8,
            textAlignVertical: 'center',
          }}
          multiline
          editable={!disabled}
          returnKeyType="send"
          blurOnSubmit={false}
          onSubmitEditing={handleSend}
        />

        {/* Send button */}
        <Animated.View
          style={{
            transform: [
              { scale: sendButtonScale },
              { scale: canSend ? pulseAnim : 1 }
            ]
          }}
        >
          <TouchableOpacity
            onPress={handleSend}
            disabled={!canSend}
            style={{
              marginRight: 4,
              marginLeft: 4
            }}
          >
            <LinearGradient
              colors={
                canSend 
                  ? ['#FF6B6B', '#4ECDC4', '#45B7D1'] 
                  : ['rgba(255, 255, 255, 0.2)', 'rgba(255, 255, 255, 0.1)']
              }
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={{
                borderRadius: 20,
                width: 40,
                height: 40,
                alignItems: 'center',
                justifyContent: 'center',
                shadowColor: canSend ? '#00D4FF' : 'transparent',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.3,
                shadowRadius: 4,
                elevation: canSend ? 5 : 0,
              }}
            >
              {isSending ? (
                <Animated.View
                  style={{
                    transform: [{
                      rotate: pulseAnim.interpolate({
                        inputRange: [1, 1.05],
                        outputRange: ['0deg', '360deg']
                      })
                    }]
                  }}
                >
                  <MaterialIcons name="hourglass-empty" size={20} color="#FFFFFF" />
                </Animated.View>
              ) : (
                <MaterialIcons 
                  name={isEditing ? "check" : "send"} 
                  size={20} 
                  color="#FFFFFF" 
                />
              )}
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </View>
  );
};

export default MessageInput;