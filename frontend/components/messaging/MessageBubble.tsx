import React, { useCallback, useMemo } from 'react';
import { Text, View, TouchableOpacity, Alert } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { MessageResponse, MessageType } from '../../types/api';
import { messagingService } from '../../services';

interface MessageBubbleProps {
  message: MessageResponse;
  currentUsername: string;
  onReply?: (message: MessageResponse) => void;
  onEdit?: (message: MessageResponse) => void;
  onDelete?: (message: MessageResponse) => void;
  isLastInSequence?: boolean;
}

const MessageBubble: React.FC<MessageBubbleProps> = ({
  message,
  currentUsername,
  onReply,
  onEdit,
  onDelete,
  isLastInSequence = true
}) => {
  // Improved message ownership logic with defensive checks - memoized for performance
  const isOwnMessage = useMemo(() => {
    console.log(`[MessageBubble] DEBUG - Checking message ownership:`, {
      messageId: message.id,
      senderUsername: message.senderUsername,
      currentUsername: currentUsername,
      messageContent: message.content?.substring(0, 30) + '...'
    });

    // Validate inputs first
    if (!message.senderUsername || !currentUsername) {
      console.warn('[MessageBubble] Invalid username data:', {
        senderUsername: message.senderUsername,
        currentUsername: currentUsername
      });
      return false; // Default to left alignment when data is invalid
    }

    // Normalize usernames for comparison (trim whitespace, case-insensitive)
    const normalizedSender = message.senderUsername.trim().toLowerCase();
    const normalizedCurrent = currentUsername.trim().toLowerCase();

    const isOwn = normalizedSender === normalizedCurrent;
    console.log(`[MessageBubble] DEBUG - Ownership result:`, {
      normalizedSender,
      normalizedCurrent,
      isOwn,
      messageContent: message.content?.substring(0, 30) + '...'
    });

    return isOwn;
  }, [message.senderUsername, currentUsername, message.id, message.content]);

  const isSystemMessage = messagingService.isSystemMessage(message);
  const hasAttachment = messagingService.hasAttachment(message);

  const handleLongPress = useCallback(() => {
    if (isSystemMessage) return;

    const options = ['Reply'];

    if (message.canEdit && isOwnMessage) {
      options.push('Edit');
    }

    if (message.canDelete && isOwnMessage) {
      options.push('Delete');
    }

    options.push('Cancel');

    Alert.alert(
      'Message Actions',
      '',
      [
        ...options.slice(0, -1).map(option => ({
          text: option,
          onPress: () => {
            switch (option) {
              case 'Reply':
                onReply?.(message);
                break;
              case 'Edit':
                onEdit?.(message);
                break;
              case 'Delete':
                handleDelete();
                break;
            }
          }
        })),
        { text: 'Cancel', style: 'cancel' }
      ]
    );
  }, [isSystemMessage, message, isOwnMessage, onReply, onEdit, handleDelete]);

  const handleDelete = useCallback(() => {
    Alert.alert(
      'Delete Message',
      'Are you sure you want to delete this message?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => onDelete?.(message)
        }
      ]
    );
  }, [message, onDelete]);

  const formatTime = (timestamp: string): string => {
    return messagingService.formatMessageTime(timestamp);
  };

  const getMessageTypeIcon = (): string => {
    switch (message.messageType) {
      case MessageType.IMAGE:
        return 'image';
      case MessageType.FILE:
        return 'attach-file';
      case MessageType.BET_REFERENCE:
        return 'casino';
      case MessageType.ANNOUNCEMENT:
        return 'campaign';
      case MessageType.SYSTEM:
        return 'info';
      default:
        return 'chat';
    }
  };

  if (isSystemMessage) {
    return (
      <View style={{
        alignItems: 'center',
        marginVertical: 8,
        paddingHorizontal: 20
      }}>
        <View style={{
          backgroundColor: '#1a1a2e',
          borderRadius: 12,
          paddingHorizontal: 12,
          paddingVertical: 8,
          flexDirection: 'row',
          alignItems: 'center'
        }}>
          <MaterialIcons name="info-outline" size={16} color="#8b8b8b" style={{ marginRight: 6 }} />
          <Text style={{
            color: '#8b8b8b',
            fontSize: 13,
            fontStyle: 'italic'
          }}>
            {message.content}
          </Text>
        </View>
        <Text style={{
          color: '#5a5a5a',
          fontSize: 11,
          marginTop: 4
        }}>
          {formatTime(message.createdAt)}
        </Text>
      </View>
    );
  }

  return (
    <View style={{
      paddingHorizontal: 16,
      paddingVertical: 2,
      alignItems: isOwnMessage ? 'flex-end' : 'flex-start'
    }}>
      {/* Reply indicator */}
      {message.parentMessageId && (
        <View style={{
          flexDirection: 'row',
          alignItems: 'center',
          marginBottom: 4,
          opacity: 0.7
        }}>
          <MaterialIcons name="reply" size={14} color="#8b8b8b" />
          <Text style={{
            color: '#8b8b8b',
            fontSize: 12,
            marginLeft: 4
          }}>
            Reply to message
          </Text>
        </View>
      )}

      <TouchableOpacity
        onLongPress={handleLongPress}
        style={{
          backgroundColor: isOwnMessage ? '#00D4AA' : '#1f2937',
          borderRadius: 16,
          paddingHorizontal: 12,
          paddingVertical: 8,
          maxWidth: '80%',
          alignSelf: isOwnMessage ? 'flex-end' : 'flex-start'
        }}
      >
        {/* Message type indicator */}
        {message.messageType !== MessageType.TEXT && (
          <View style={{
            flexDirection: 'row',
            alignItems: 'center',
            marginBottom: 4
          }}>
            <MaterialIcons
              name={getMessageTypeIcon()}
              size={16}
              color={isOwnMessage ? 'rgba(0, 0, 0, 0.7)' : '#9ca3af'}
            />
            <Text style={{
              color: isOwnMessage ? 'rgba(0, 0, 0, 0.7)' : '#9ca3af',
              fontSize: 12,
              marginLeft: 4,
              fontWeight: '500'
            }}>
              {message.messageType}
            </Text>
          </View>
        )}

        {/* Attachment indicator */}
        {hasAttachment && (
          <View style={{
            flexDirection: 'row',
            alignItems: 'center',
            marginBottom: 6,
            padding: 8,
            backgroundColor: isOwnMessage ? 'rgba(0,0,0,0.1)' : 'rgba(0,0,0,0.2)',
            borderRadius: 8
          }}>
            <MaterialIcons name="attachment" size={16} color={isOwnMessage ? 'rgba(0, 0, 0, 0.7)' : '#9ca3af'} />
            <Text style={{
              color: isOwnMessage ? 'rgba(0, 0, 0, 0.7)' : '#9ca3af',
              fontSize: 12,
              marginLeft: 4
            }}>
              {messagingService.getAttachmentDisplayType(message)}
            </Text>
          </View>
        )}

        {/* Message content */}
        <Text style={{
          color: isOwnMessage ? '#000000' : '#f3f4f6',
          fontSize: 15,
          lineHeight: 20
        }}>
          {message.content}
        </Text>

        {/* Compact metadata - only show edited indicator and reply count */}
        {(message.isEdited || message.replyCount > 0) && (
          <View style={{
            flexDirection: 'row',
            alignItems: 'center',
            marginTop: 6,
            justifyContent: 'flex-end'
          }}>
            {message.isEdited && (
              <Text style={{
                color: isOwnMessage ? 'rgba(0, 0, 0, 0.6)' : '#9ca3af',
                fontSize: 11,
                fontStyle: 'italic'
              }}>
                edited
              </Text>
            )}
            {message.replyCount > 0 && (
              <>
                {message.isEdited && (
                  <Text style={{
                    color: isOwnMessage ? 'rgba(0, 0, 0, 0.6)' : '#9ca3af',
                    fontSize: 11,
                    marginHorizontal: 4
                  }}>
                    •
                  </Text>
                )}
                <MaterialIcons name="reply" size={12} color={isOwnMessage ? 'rgba(0, 0, 0, 0.6)' : '#9ca3af'} />
                <Text style={{
                  color: isOwnMessage ? 'rgba(0, 0, 0, 0.6)' : '#9ca3af',
                  fontSize: 11,
                  marginLeft: 2
                }}>
                  {message.replyCount}
                </Text>
              </>
            )}
          </View>
        )}
      </TouchableOpacity>

      {/* Timestamp and sender name below bubble */}
      {isLastInSequence && (
        <View style={{
          flexDirection: 'row',
          alignItems: 'center',
          marginTop: 4,
          marginLeft: isOwnMessage ? 0 : 14,
          marginRight: isOwnMessage ? 14 : 0
        }}>
          {!isOwnMessage && (
            <>
              <Text style={{
                color: '#6b7280',
                fontSize: 11,
                fontWeight: '500'
              }}>
                {message.senderDisplayName}
              </Text>
              <Text style={{
                color: '#6b7280',
                fontSize: 11,
                marginHorizontal: 6
              }}>
                •
              </Text>
            </>
          )}
          <Text style={{
            color: '#6b7280',
            fontSize: 11
          }}>
            {formatTime(message.createdAt)}
          </Text>
        </View>
      )}
    </View>
  );
};

export default React.memo(MessageBubble);