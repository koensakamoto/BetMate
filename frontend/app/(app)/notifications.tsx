import React, { useState, useEffect } from 'react';
import { Text, View, TouchableOpacity, ScrollView, StatusBar, RefreshControl, Alert, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { useNotifications, useNotificationWebSocket } from '../../services/notification';
import { NotificationResponse, NotificationType, NotificationPriority } from '../../types/api';
import { friendshipService } from '../../services/user/friendshipService';
import { groupService } from '../../services/group/groupService';
import { BetDeadlineCard } from '../../components/notifications/BetDeadlineCard';
import { parseBackendDate } from '../../utils/dateUtils';

export default function Notifications() {
  const insets = useSafeAreaInsets();
  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  const [processingRequests, setProcessingRequests] = useState<Set<number>>(new Set());

  const {
    notifications,
    loading,
    refreshing,
    error,
    hasMore,
    unreadCount,
    stats,
    loadMore,
    refresh,
    markAsRead,
    markAllAsRead,
    addNotification,
    setUnreadOnly
  } = useNotifications({
    autoRefresh: true,
    pageSize: 20
  });

  // Setup WebSocket for real-time notifications
  useNotificationWebSocket({
    onNotificationReceived: addNotification,
    enabled: true
  });

  // Handle filter change
  useEffect(() => {
    setUnreadOnly(filter === 'unread');
  }, [filter, setUnreadOnly]);

  const getTypeIcon = (type: NotificationType | string | undefined): string => {
    switch (type) {
      case NotificationType.BET_RESULT:
      case 'BET_RESULT':
        return 'trending-up';
      case NotificationType.BET_CREATED:
      case 'BET_CREATED':
        return 'handshake';
      case NotificationType.BET_DEADLINE:
      case 'BET_DEADLINE':
        return 'schedule';
      case NotificationType.BET_RESOLUTION_REMINDER:
      case 'BET_RESOLUTION_REMINDER':
        return 'gavel';
      case NotificationType.BET_CANCELLED:
      case 'BET_CANCELLED':
        return 'cancel';
      case NotificationType.FRIEND_REQUEST:
      case 'FRIEND_REQUEST':
      case NotificationType.FRIEND_REQUEST_ACCEPTED:
      case 'FRIEND_REQUEST_ACCEPTED':
        return 'person-add';
      case NotificationType.GROUP_INVITE:
      case NotificationType.GROUP_JOIN_REQUEST:
      case NotificationType.GROUP_MEMBER_JOINED:
      case NotificationType.GROUP_MEMBER_LEFT:
      case NotificationType.GROUP_ROLE_CHANGED:
        return 'group';
      case NotificationType.NEW_MESSAGE:
      case 'NEW_MESSAGE':
      case 'GROUP_MESSAGE':
      case NotificationType.MESSAGE_MENTION:
      case 'MESSAGE_MENTION':
      case NotificationType.MESSAGE_REPLY:
      case 'MESSAGE_REPLY':
        return 'chat-bubble';
      case NotificationType.ACHIEVEMENT_UNLOCKED:
      case NotificationType.STREAK_MILESTONE:
      case NotificationType.LEVEL_UP:
        return 'emoji-events';
      case NotificationType.CREDITS_RECEIVED:
        return 'attach-money';
      case NotificationType.SYSTEM_ANNOUNCEMENT:
      case NotificationType.MAINTENANCE:
      case NotificationType.WELCOME:
        return 'info';
      default:
        return 'notifications';
    }
  };

  const getTypeColor = (): string => {
    return 'rgba(255, 255, 255, 0.6)';
  };

  const formatTime = (timestamp: string) => {
    const now = new Date();
    const notificationTime = parseBackendDate(timestamp);
    const diffInHours = (now.getTime() - notificationTime.getTime()) / (1000 * 60 * 60);

    // Handle future timestamps or very recent (negative/zero diff)
    if (diffInHours <= 0) {
      return 'Just now';
    }

    if (diffInHours < 1) {
      const diffInMinutes = Math.floor(diffInHours * 60);
      return diffInMinutes < 1 ? 'Just now' : `${diffInMinutes}m`;
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)}h`;
    } else {
      const diffInDays = Math.floor(diffInHours / 24);
      if (diffInDays === 1) return '1d';
      if (diffInDays < 7) return `${diffInDays}d`;
      return `${Math.floor(diffInDays / 7)}w`;
    }
  };

  const groupByDate = (notifications: NotificationResponse[]) => {
    const groups: { [key: string]: NotificationResponse[] } = {};
    const now = new Date();

    // Handle undefined or null notifications array
    if (!notifications || !Array.isArray(notifications)) {
      return groups;
    }

    notifications.forEach(notification => {
      const timestamp = parseBackendDate(notification.createdAt);
      const diffInDays = Math.floor((now.getTime() - timestamp.getTime()) / (1000 * 60 * 60 * 24));

      let groupKey;
      if (diffInDays === 0) {
        groupKey = 'Today';
      } else if (diffInDays === 1) {
        groupKey = 'Yesterday';
      } else if (diffInDays < 7) {
        groupKey = 'This week';
      } else {
        groupKey = 'Earlier';
      }

      if (!groups[groupKey]) {
        groups[groupKey] = [];
      }
      groups[groupKey].push(notification);
    });

    return groups;
  };

  const filteredNotifications = notifications || [];
  const groupedNotifications = groupByDate(filteredNotifications);

  const handleNotificationPress = async (notification: NotificationResponse) => {
    // Try to mark as read first (don't block navigation on failure)
    if (notification.id) {
      try {
        await markAsRead(notification.id);
      } catch (error) {
        // Log but don't block navigation
        // Error handled silently
      }
    }

    // Navigate to action URL if available
    if (notification.actionUrl) {
      // Parse action URL and navigate accordingly
      const url = notification.actionUrl;
      const notificationType = notification.type || notification.notificationType;

      if (url.startsWith('/bets/')) {
        const betId = url.split('/')[2];
        router.push(`/(app)/bet-details/${betId}` as any);
      } else if (url.startsWith('/groups/')) {
        const groupId = url.split('/')[2];

        // For role change notifications, navigate to People tab (index 2) to show the user their new role
        if (notificationType === 'GROUP_ROLE_CHANGED') {
          router.push(`/(app)/group/${groupId}?tab=2` as any);
        } else {
          router.push(`/(app)/group/${groupId}` as any);
        }
      } else if (url === '/friends/requests') {
        router.push('/(app)/friends' as any);
      } else if (url === '/friends') {
        router.push('/(app)/friends' as any);
      } else {
        // Default navigation - unhandled URL type
      }
    }
  };

  const handleMarkAllAsRead = () => {
    Alert.alert(
      'Mark All as Read',
      'Are you sure you want to mark all notifications as read?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Mark All Read', onPress: markAllAsRead }
      ]
    );
  };

  const handleAcceptFriendRequest = async (notification: NotificationResponse) => {
    if (!notification.relatedEntityId) return;

    setProcessingRequests(prev => new Set([...prev, notification.id]));

    try {
      // The relatedEntityId contains the friendship ID directly
      const friendshipId = notification.relatedEntityId;

      await friendshipService.acceptFriendRequest(friendshipId);
      await markAsRead(notification.id);

      // Refresh notifications to update the list
      await refresh();

      // No success alert - the notification disappearing is enough feedback
    } catch (error) {
      Alert.alert('Error', 'Failed to accept friend request');
      // Error handled silently
    } finally {
      setProcessingRequests(prev => {
        const newSet = new Set(prev);
        newSet.delete(notification.id);
        return newSet;
      });
    }
  };

  const handleRejectFriendRequest = async (notification: NotificationResponse) => {
    if (!notification.relatedEntityId) return;

    setProcessingRequests(prev => new Set([...prev, notification.id]));

    try {
      // The relatedEntityId contains the friendship ID directly
      const friendshipId = notification.relatedEntityId;

      await friendshipService.rejectFriendRequest(friendshipId);
      await markAsRead(notification.id);

      // Refresh notifications to update the list
      await refresh();

      // No success alert - the notification disappearing is enough feedback
    } catch (error) {
      Alert.alert('Error', 'Failed to decline friend request');
      // Error handled silently
    } finally {
      setProcessingRequests(prev => {
        const newSet = new Set(prev);
        newSet.delete(notification.id);
        return newSet;
      });
    }
  };

  const handleAcceptGroupInvitation = async (notification: NotificationResponse) => {
    if (!notification.relatedEntityId) return;

    setProcessingRequests(prev => new Set([...prev, notification.id]));

    try {
      // The relatedEntityId contains the membershipId
      const membershipId = notification.relatedEntityId;

      await groupService.acceptInvitation(membershipId);
      await markAsRead(notification.id);
      await refresh();

      // No success alert - the notification disappearing is enough feedback
    } catch (error) {
      Alert.alert('Error', 'Failed to accept group invitation');
      // Error handled silently
    } finally {
      setProcessingRequests(prev => {
        const newSet = new Set(prev);
        newSet.delete(notification.id);
        return newSet;
      });
    }
  };

  const handleRejectGroupInvitation = async (notification: NotificationResponse) => {
    if (!notification.relatedEntityId) return;

    setProcessingRequests(prev => new Set([...prev, notification.id]));

    try {
      // The relatedEntityId contains the membershipId
      const membershipId = notification.relatedEntityId;

      await groupService.rejectInvitation(membershipId);
      await markAsRead(notification.id);
      await refresh();

      // No success alert - the notification disappearing is enough feedback
    } catch (error) {
      Alert.alert('Error', 'Failed to decline group invitation');
      // Error handled silently
    } finally {
      setProcessingRequests(prev => {
        const newSet = new Set(prev);
        newSet.delete(notification.id);
        return newSet;
      });
    }
  };

  const handleApproveJoinRequest = async (notification: NotificationResponse) => {
    if (!notification.relatedEntityId || !notification.actionUrl) return;

    setProcessingRequests(prev => new Set([...prev, notification.id]));

    try {
      // Extract groupId from actionUrl: "/groups/{groupId}/requests"
      const groupId = parseInt(notification.actionUrl.split('/')[2]);
      // The relatedEntityId contains the membershipId
      const membershipId = notification.relatedEntityId;

      await groupService.approvePendingRequest(groupId, membershipId);
      await markAsRead(notification.id);
      await refresh();

      // No success alert - the notification disappearing is enough feedback
    } catch (error) {
      Alert.alert('Error', 'Failed to approve join request');
      // Error handled silently
    } finally {
      setProcessingRequests(prev => {
        const newSet = new Set(prev);
        newSet.delete(notification.id);
        return newSet;
      });
    }
  };

  const handleDenyJoinRequest = async (notification: NotificationResponse) => {
    if (!notification.relatedEntityId || !notification.actionUrl) return;

    setProcessingRequests(prev => new Set([...prev, notification.id]));

    try {
      // Extract groupId from actionUrl: "/groups/{groupId}/requests"
      const groupId = parseInt(notification.actionUrl.split('/')[2]);
      // The relatedEntityId contains the membershipId
      const membershipId = notification.relatedEntityId;

      await groupService.denyPendingRequest(groupId, membershipId);
      await markAsRead(notification.id);
      await refresh();

      // No success alert - the notification disappearing is enough feedback
    } catch (error) {
      Alert.alert('Error', 'Failed to deny join request');
      // Error handled silently
    } finally {
      setProcessingRequests(prev => {
        const newSet = new Set(prev);
        newSet.delete(notification.id);
        return newSet;
      });
    }
  };

  const handleViewProfile = (userId: number) => {
    // Navigate to user profile
    router.push(`/(app)/profile/${userId}` as any);
  };

  const NotificationItem = ({ notification }: { notification: NotificationResponse }) => {
    // Check both type and notificationType fields since backend sends notificationType
    const notificationType = notification.type || notification.notificationType;
    const isBetDeadline = notificationType === 'BET_DEADLINE';
    const isBetResolutionReminder = notificationType === 'BET_RESOLUTION_REMINDER';
    const isFriendRequest = notificationType === 'FRIEND_REQUEST';
    const isGroupInvite = notificationType === 'GROUP_INVITE';
    const isGroupJoinRequest = notificationType === 'GROUP_JOIN_REQUEST';
    const isGroupRoleChanged = notificationType === 'GROUP_ROLE_CHANGED';
    const showFriendRequestActions = isFriendRequest && !notification.isRead;
    const showGroupInviteActions = isGroupInvite && !notification.isRead;
    const showGroupJoinRequestActions = isGroupJoinRequest && !notification.isRead;
    const isProcessing = processingRequests.has(notification.id);

    // Use modern card design for BET_DEADLINE and BET_RESOLUTION_REMINDER notifications
    if (isBetDeadline || isBetResolutionReminder) {
      return (
        <BetDeadlineCard
          notification={notification}
          onPress={() => handleNotificationPress(notification)}
        />
      );
    }

    // Extract username from message for friend requests
    const extractUsername = (message: string) => {
      const match = message?.match(/(.+?) wants to be your friend/);
      return match ? match[1] : null;
    };

    // Extract inviter name and group name for group invites
    const extractGroupInviteInfo = (message: string) => {
      // Expected format: "{inviterName} invited you to join {groupName}"
      const match = message?.match(/(.+?) invited you to join (.+)/);
      return match ? { inviterName: match[1], groupName: match[2] } : null;
    };

    // Extract requester info for group join requests
    const extractGroupJoinRequestInfo = (message: string, title: string) => {
      // Message format: "{requesterName} (@{requesterUsername}) wants to join your group"
      // Title format: "Join Request for {groupName}"
      const messageMatch = message?.match(/(.+?) \(@(.+?)\) wants to join your group/);
      const titleMatch = title?.match(/Join Request for (.+)/);
      return {
        requesterName: messageMatch ? messageMatch[1] : null,
        requesterUsername: messageMatch ? messageMatch[2] : null,
        groupName: titleMatch ? titleMatch[1] : null
      };
    };

    // Extract role change info for GROUP_ROLE_CHANGED notifications
    const extractRoleChangeInfo = (message: string, title: string) => {
      // Message format: "You were promoted to OFFICER in GroupName" OR
      //                 "Your role was changed to MEMBER in GroupName"
      // Title format: "Role Changed: GroupName"
      const isPromotion = message.includes('promoted');
      const roleMatch = message?.match(/(MEMBER|OFFICER|ADMIN)/);
      const titleMatch = title?.match(/Role Changed: (.+)/);

      return {
        isPromotion,
        newRole: roleMatch ? roleMatch[1] : null,
        groupName: titleMatch ? titleMatch[1] : null
      };
    };

    const username = isFriendRequest ? extractUsername(notification.message || '') : null;
    const groupInviteInfo = isGroupInvite ? extractGroupInviteInfo(notification.message || '') : null;
    const groupJoinRequestInfo = isGroupJoinRequest ? extractGroupJoinRequestInfo(notification.message || '', notification.title || '') : null;
    const roleChangeInfo = isGroupRoleChanged ? extractRoleChangeInfo(notification.message || '', notification.title || '') : null;

    // Check if notification has an action URL and should be clickable
    const hasAction = notification.actionUrl && !showFriendRequestActions && !showGroupInviteActions && !showGroupJoinRequestActions && !isGroupRoleChanged;

    const notificationContent = (
      <View style={{
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'transparent',
        paddingVertical: 8,
        paddingHorizontal: 0,
        borderRadius: 6,
        opacity: notification.isRead ? 0.5 : 1,
      }}>
          {!isFriendRequest && !isGroupInvite && !isGroupJoinRequest && !isGroupRoleChanged && (
            <MaterialIcons
              name={getTypeIcon(notificationType) as any}
              size={16}
              color={getTypeColor(notificationType, notification.priority)}
              style={{ marginRight: 10 }}
            />
          )}

          <View style={{ flex: 1 }}>
            {!isFriendRequest && !isGroupInvite && !isGroupJoinRequest && !isGroupRoleChanged && (
              <View style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 2
              }}>
                <Text style={{
                  fontSize: 14,
                  fontWeight: '600',
                  color: '#ffffff',
                  flex: 1,
                  marginRight: 8
                }}>
                  {notification.title}
                </Text>

                <Text style={{
                    fontSize: 11,
                    color: 'rgba(255, 255, 255, 0.4)',
                    fontWeight: '500',
                  }}>
                    {formatTime(notification.createdAt)}
                  </Text>
              </View>
            )}

            {isFriendRequest ? (
              <View>
                <View style={{
                  flexDirection: 'row',
                  alignItems: 'center'
                }}>
                  {/* Profile Icon */}
                  <MaterialIcons
                    name="person-add"
                    size={16}
                    color="rgba(255, 255, 255, 0.6)"
                    style={{ marginRight: 10 }}
                  />

                  {/* Username + Time */}
                  <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 2 }}>
                      <Text style={{
                        fontSize: 14,
                        color: '#ffffff',
                        fontWeight: '600',
                      }}>
                        {username || 'Someone'}
                      </Text>
                      <Text style={{
                          fontSize: 11,
                          color: 'rgba(255, 255, 255, 0.4)',
                          fontWeight: '500',
                        }}>
                          {formatTime(notification.createdAt)}
                        </Text>
                    </View>
                    <Text style={{
                      fontSize: 13,
                      color: 'rgba(255, 255, 255, 0.6)',
                    }}>
                      Friend request
                    </Text>
                  </View>
                </View>

                {/* Action Buttons */}
                {showFriendRequestActions && (
                  <View style={{
                    flexDirection: 'row',
                    marginTop: 8,
                    gap: 6
                  }}>
                    <TouchableOpacity
                      onPress={() => handleAcceptFriendRequest(notification)}
                      disabled={isProcessing}
                      style={{
                        flex: 1,
                        backgroundColor: '#00D4AA',
                        borderRadius: 6,
                        paddingVertical: 8,
                        alignItems: 'center',
                        opacity: isProcessing ? 0.7 : 1,
                      }}
                    >
                      {isProcessing ? (
                        <ActivityIndicator size="small" color="#ffffff" />
                      ) : (
                        <Text style={{
                          fontSize: 13,
                          fontWeight: '600',
                          color: '#ffffff',
                        }}>
                          Accept
                        </Text>
                      )}
                    </TouchableOpacity>

                    <TouchableOpacity
                      onPress={() => handleRejectFriendRequest(notification)}
                      disabled={isProcessing}
                      style={{
                        flex: 1,
                        backgroundColor: 'rgba(255, 255, 255, 0.08)',
                        borderRadius: 6,
                        paddingVertical: 8,
                        alignItems: 'center',
                        opacity: isProcessing ? 0.7 : 1
                      }}
                    >
                      {isProcessing ? (
                        <ActivityIndicator size="small" color="#ffffff" />
                      ) : (
                        <Text style={{
                          fontSize: 13,
                          fontWeight: '600',
                          color: 'rgba(255, 255, 255, 0.7)',
                        }}>
                          Decline
                        </Text>
                      )}
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            ) : isGroupInvite ? (
              <View>
                <View style={{
                  flexDirection: 'row',
                  alignItems: 'center'
                }}>
                  {/* Group Icon */}
                  <MaterialIcons
                    name="group"
                    size={16}
                    color="rgba(255, 255, 255, 0.6)"
                    style={{ marginRight: 10 }}
                  />

                  {/* Group Name + Inviter Info */}
                  <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 2 }}>
                      <Text style={{
                        fontSize: 14,
                        color: '#ffffff',
                        fontWeight: '600',
                      }}>
                        {groupInviteInfo?.groupName || 'Group'}
                      </Text>
                      <Text style={{
                          fontSize: 11,
                          color: 'rgba(255, 255, 255, 0.4)',
                          fontWeight: '500',
                        }}>
                          {formatTime(notification.createdAt)}
                        </Text>
                    </View>
                    <Text style={{
                      fontSize: 13,
                      color: 'rgba(255, 255, 255, 0.6)',
                    }}>
                      {groupInviteInfo?.inviterName ? `Invited by ${groupInviteInfo.inviterName}` : 'Group invitation'}
                    </Text>
                  </View>
                </View>

                {/* Action Buttons */}
                {showGroupInviteActions && (
                  <View style={{
                    flexDirection: 'row',
                    marginTop: 8,
                    gap: 6
                  }}>
                    <TouchableOpacity
                      onPress={() => handleAcceptGroupInvitation(notification)}
                      disabled={isProcessing}
                      style={{
                        flex: 1,
                        backgroundColor: '#00D4AA',
                        borderRadius: 6,
                        paddingVertical: 8,
                        alignItems: 'center',
                        opacity: isProcessing ? 0.7 : 1,
                      }}
                    >
                      {isProcessing ? (
                        <ActivityIndicator size="small" color="#ffffff" />
                      ) : (
                        <Text style={{
                          fontSize: 13,
                          fontWeight: '600',
                          color: '#ffffff',
                        }}>
                          Accept
                        </Text>
                      )}
                    </TouchableOpacity>

                    <TouchableOpacity
                      onPress={() => handleRejectGroupInvitation(notification)}
                      disabled={isProcessing}
                      style={{
                        flex: 1,
                        backgroundColor: 'rgba(255, 255, 255, 0.08)',
                        borderRadius: 6,
                        paddingVertical: 8,
                        alignItems: 'center',
                        opacity: isProcessing ? 0.7 : 1
                      }}
                    >
                      {isProcessing ? (
                        <ActivityIndicator size="small" color="#ffffff" />
                      ) : (
                        <Text style={{
                          fontSize: 13,
                          fontWeight: '600',
                          color: 'rgba(255, 255, 255, 0.7)',
                        }}>
                          Decline
                        </Text>
                      )}
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            ) : isGroupJoinRequest ? (
              <View>
                <View style={{
                  flexDirection: 'row',
                  alignItems: 'center'
                }}>
                  {/* Group Icon */}
                  <MaterialIcons
                    name="group-add"
                    size={16}
                    color="rgba(255, 255, 255, 0.6)"
                    style={{ marginRight: 10 }}
                  />

                  {/* Group Name + Requester Info */}
                  <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 2 }}>
                      <Text style={{
                        fontSize: 14,
                        color: '#ffffff',
                        fontWeight: '600',
                      }}>
                        {groupJoinRequestInfo?.groupName || 'Group'}
                      </Text>
                      <Text style={{
                          fontSize: 11,
                          color: 'rgba(255, 255, 255, 0.4)',
                          fontWeight: '500',
                        }}>
                          {formatTime(notification.createdAt)}
                        </Text>
                    </View>
                    <Text style={{
                      fontSize: 13,
                      color: 'rgba(255, 255, 255, 0.6)',
                    }}>
                      {groupJoinRequestInfo?.requesterName || 'Someone'} wants to join
                    </Text>
                  </View>
                </View>

                {/* Action Buttons */}
                {showGroupJoinRequestActions && (
                  <View style={{
                    flexDirection: 'row',
                    marginTop: 8,
                    gap: 6
                  }}>
                    <TouchableOpacity
                      onPress={() => handleApproveJoinRequest(notification)}
                      disabled={isProcessing}
                      style={{
                        flex: 1,
                        backgroundColor: '#00D4AA',
                        borderRadius: 6,
                        paddingVertical: 8,
                        alignItems: 'center',
                        opacity: isProcessing ? 0.7 : 1,
                      }}
                    >
                      {isProcessing ? (
                        <ActivityIndicator size="small" color="#ffffff" />
                      ) : (
                        <Text style={{
                          fontSize: 13,
                          fontWeight: '600',
                          color: '#ffffff',
                        }}>
                          Accept
                        </Text>
                      )}
                    </TouchableOpacity>

                    <TouchableOpacity
                      onPress={() => handleDenyJoinRequest(notification)}
                      disabled={isProcessing}
                      style={{
                        flex: 1,
                        backgroundColor: 'rgba(255, 255, 255, 0.08)',
                        borderRadius: 6,
                        paddingVertical: 8,
                        alignItems: 'center',
                        opacity: isProcessing ? 0.7 : 1
                      }}
                    >
                      {isProcessing ? (
                        <ActivityIndicator size="small" color="#ffffff" />
                      ) : (
                        <Text style={{
                          fontSize: 13,
                          fontWeight: '600',
                          color: 'rgba(255, 255, 255, 0.7)',
                        }}>
                          Deny
                        </Text>
                      )}
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            ) : isGroupRoleChanged ? (
              <View>
                <View style={{
                  flexDirection: 'row',
                  alignItems: 'center'
                }}>
                  {/* Role Change Icon */}
                  <MaterialIcons
                    name={roleChangeInfo?.isPromotion ? "trending-up" : "swap-horiz"}
                    size={16}
                    color="rgba(255, 255, 255, 0.6)"
                    style={{ marginRight: 10 }}
                  />

                  {/* Group Name + Role Info */}
                  <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 2 }}>
                      <Text style={{
                        fontSize: 14,
                        color: '#ffffff',
                        fontWeight: '600',
                      }}>
                        {roleChangeInfo?.groupName || 'Group'}
                      </Text>
                      <Text style={{
                          fontSize: 11,
                          color: 'rgba(255, 255, 255, 0.4)',
                          fontWeight: '500',
                        }}>
                          {formatTime(notification.createdAt)}
                        </Text>
                    </View>
                    <Text style={{
                      fontSize: 13,
                      color: 'rgba(255, 255, 255, 0.6)',
                    }}>
                      {roleChangeInfo?.isPromotion ? 'Promoted to ' : 'Role changed to '}
                      {roleChangeInfo?.newRole || 'MEMBER'}
                    </Text>
                  </View>
                </View>
              </View>
            ) : (
              <Text style={{
                fontSize: 13,
                color: 'rgba(255, 255, 255, 0.6)',
                lineHeight: 16,
              }} numberOfLines={2}>
                {notification.message || notification.content || 'No message content'}
              </Text>
            )}
          </View>

          {/* Chevron for standard notifications with action */}
          {!isFriendRequest && !isGroupInvite && !isGroupJoinRequest && !isGroupRoleChanged && hasAction && (
            <MaterialIcons
              name="chevron-right"
              size={18}
              color="rgba(255, 255, 255, 0.2)"
              style={{ marginLeft: 6 }}
            />
          )}

          {/* Chevron for role changed notifications */}
          {isGroupRoleChanged && notification.actionUrl && (
            <MaterialIcons
              name="chevron-right"
              size={18}
              color="rgba(255, 255, 255, 0.2)"
              style={{ marginLeft: 6 }}
            />
          )}
      </View>
    );

    const shouldBeTappable = hasAction || (isGroupRoleChanged && notification.actionUrl);

    return (
      <View style={{
        paddingVertical: 2,
        paddingHorizontal: 16,
      }}>
        {shouldBeTappable ? (
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => handleNotificationPress(notification)}
          >
            {notificationContent}
          </TouchableOpacity>
        ) : (
          notificationContent
        )}
      </View>
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#0a0a0f' }}>
      <StatusBar
        barStyle="light-content"
        backgroundColor="#0a0a0f"
        translucent={true}
      />

      {/* Solid background behind status bar */}
      <View style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: insets.top,
        backgroundColor: '#0a0a0f',
        zIndex: 1
      }} />

      <View style={{ flex: 1 }}>
        {/* Header */}
        <View style={{
          paddingTop: insets.top + 20,
          paddingHorizontal: 20,
          paddingBottom: 16,
          borderBottomWidth: 0.5,
          borderBottomColor: 'rgba(255, 255, 255, 0.08)'
        }}>
          <View style={{
            flexDirection: 'row',
            alignItems: 'center',
            marginBottom: 16
          }}>
            <TouchableOpacity
              onPress={() => router.back()}
              style={{
                width: 40,
                height: 40,
                borderRadius: 20,
                backgroundColor: 'rgba(255, 255, 255, 0.08)',
                justifyContent: 'center',
                alignItems: 'center',
                marginRight: 16
              }}
            >
              <MaterialIcons
                name="arrow-back"
                size={18}
                color="#ffffff"
              />
            </TouchableOpacity>

            <Text style={{
              fontSize: 24,
              fontWeight: '600',
              color: '#ffffff',
              flex: 1
            }}>
              Inbox
            </Text>

            {/* Mark All Read Button */}
            {unreadCount > 0 && (
              <TouchableOpacity
                onPress={handleMarkAllAsRead}
                style={{
                  paddingHorizontal: 12,
                  paddingVertical: 6,
                  backgroundColor: 'rgba(255, 255, 255, 0.08)',
                  borderRadius: 16
                }}
              >
                <Text style={{
                  fontSize: 12,
                  fontWeight: '500',
                  color: '#ffffff'
                }}>
                  Mark All Read
                </Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Filter Tabs */}
          <View style={{
            flexDirection: 'row',
            gap: 24
          }}>
            <TouchableOpacity
              onPress={() => setFilter('all')}
              style={{
                paddingBottom: 8,
                borderBottomWidth: filter === 'all' ? 1 : 0,
                borderBottomColor: '#ffffff'
              }}
            >
              <Text style={{
                fontSize: 16,
                fontWeight: filter === 'all' ? '500' : '400',
                color: filter === 'all' ? '#ffffff' : 'rgba(255, 255, 255, 0.5)'
              }}>
                All
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setFilter('unread')}
              style={{
                paddingBottom: 8,
                borderBottomWidth: filter === 'unread' ? 1 : 0,
                borderBottomColor: '#ffffff',
                flexDirection: 'row',
                alignItems: 'center'
              }}
            >
              <Text style={{
                fontSize: 16,
                fontWeight: filter === 'unread' ? '500' : '400',
                color: filter === 'unread' ? '#ffffff' : 'rgba(255, 255, 255, 0.5)'
              }}>
                Unread
              </Text>
              {unreadCount > 0 && (
                <View style={{
                  marginLeft: 6,
                  backgroundColor: '#00D4AA',
                  borderRadius: 10,
                  minWidth: 20,
                  height: 20,
                  justifyContent: 'center',
                  alignItems: 'center',
                  paddingHorizontal: 6
                }}>
                  <Text style={{
                    fontSize: 12,
                    fontWeight: '600',
                    color: '#000000'
                  }}>
                    {unreadCount}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* Error State */}
        {error && (
          <View style={{
            paddingHorizontal: 20,
            paddingVertical: 16,
            backgroundColor: 'rgba(239, 68, 68, 0.1)',
            borderBottomWidth: 0.5,
            borderBottomColor: 'rgba(239, 68, 68, 0.3)'
          }}>
            <Text style={{
              fontSize: 14,
              color: '#EF4444',
              textAlign: 'center'
            }}>
              {error}
            </Text>
          </View>
        )}

        {/* Notifications List */}
        <ScrollView
          style={{ flex: 1 }}
          showsVerticalScrollIndicator={false}
          contentInsetAdjustmentBehavior="automatic"
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={refresh}
              tintColor="#ffffff"
              colors={["#00D4AA"]}
            />
          }
          onScroll={({ nativeEvent }) => {
            const { layoutMeasurement, contentOffset, contentSize } = nativeEvent;
            const isCloseToBottom = layoutMeasurement.height + contentOffset.y >= contentSize.height - 200;

            if (isCloseToBottom && hasMore && !loading) {
              loadMore();
            }
          }}
          scrollEventThrottle={16}
        >
          {Object.keys(groupedNotifications).length > 0 ? (
            ['Today', 'Yesterday', 'This week', 'Earlier']
              .filter(group => groupedNotifications[group]?.length > 0)
              .map((dateGroup) => ({ dateGroup, groupNotifications: groupedNotifications[dateGroup] }))
              .map(({ dateGroup, groupNotifications }) => (
              <View key={dateGroup}>
                {/* Date Group Header */}
                <View style={{
                  paddingHorizontal: 20,
                  paddingVertical: 12,
                  backgroundColor: 'rgba(255, 255, 255, 0.02)'
                }}>
                  <Text style={{
                    fontSize: 14,
                    fontWeight: '600',
                    color: 'rgba(255, 255, 255, 0.8)',
                    textTransform: 'uppercase',
                    letterSpacing: 0.5
                  }}>
                    {dateGroup}
                  </Text>
                </View>

                {/* Notifications in this group */}
                {groupNotifications.map((notification, index) => {
                  const notificationType = notification.type || notification.notificationType;
                  const isBetDeadline = notificationType === 'BET_DEADLINE';
                  const nextIsBetDeadline = index < groupNotifications.length - 1 &&
                    (groupNotifications[index + 1].type || groupNotifications[index + 1].notificationType) === 'BET_DEADLINE';

                  return (
                    <View key={notification.id}>
                      <NotificationItem notification={notification} />
                      {/* Skip divider for modern card designs */}
                      {index < groupNotifications.length - 1 && !isBetDeadline && !nextIsBetDeadline && (
                        <View style={{
                          height: 0.5,
                          backgroundColor: 'rgba(255, 255, 255, 0.06)',
                          marginLeft: 68
                        }} />
                      )}
                    </View>
                  );
                })}
              </View>
            ))
          ) : (
            <View style={{
              flex: 1,
              justifyContent: 'center',
              alignItems: 'center',
              paddingVertical: 100
            }}>
              <MaterialIcons
                name="inbox"
                size={48}
                color="rgba(255, 255, 255, 0.3)"
                style={{ marginBottom: 16 }}
              />
              <Text style={{
                fontSize: 17,
                color: 'rgba(255, 255, 255, 0.4)',
                textAlign: 'center'
              }}>
                {loading ? 'Loading notifications...' :
                 filter === 'unread' ? 'No unread notifications' : 'Inbox is empty'}
              </Text>
            </View>
          )}

          {/* Loading More Indicator */}
          {loading && notifications && notifications.length > 0 && (
            <View style={{
              paddingVertical: 20,
              alignItems: 'center'
            }}>
              <Text style={{
                fontSize: 14,
                color: 'rgba(255, 255, 255, 0.5)'
              }}>
                Loading more...
              </Text>
            </View>
          )}

          <View style={{ height: insets.bottom + 20 }} />
        </ScrollView>
      </View>
    </View>
  );
}