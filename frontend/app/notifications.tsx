import React, { useState, useEffect } from 'react';
import { Text, View, TouchableOpacity, ScrollView, StatusBar, RefreshControl, Alert, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { useNotifications, useNotificationWebSocket } from '../services/notification';
import { NotificationResponse, NotificationType, NotificationPriority } from '../types/api';
import { friendshipService } from '../services/user/friendshipService';

export default function Notifications() {
  const insets = useSafeAreaInsets();
  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  const [processingRequests, setProcessingRequests] = useState<Set<number>>(new Set());

  const {
    notifications,
    loading,
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
        return 'sports-esports';
      case NotificationType.BET_DEADLINE:
      case 'BET_DEADLINE':
        return 'schedule';
      case NotificationType.BET_CANCELLED:
      case 'BET_CANCELLED':
        return 'cancel';
      case NotificationType.FRIEND_REQUEST:
      case 'FRIEND_REQUEST':
      case NotificationType.FRIEND_REQUEST_ACCEPTED:
      case 'FRIEND_REQUEST_ACCEPTED':
        return 'person-add';
      case NotificationType.GROUP_INVITE:
      case NotificationType.GROUP_MEMBER_JOINED:
      case NotificationType.GROUP_MEMBER_LEFT:
      case NotificationType.GROUP_ROLE_CHANGED:
        return 'group';
      case NotificationType.NEW_MESSAGE:
      case NotificationType.MESSAGE_MENTION:
      case NotificationType.MESSAGE_REPLY:
        return 'message';
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

  const getTypeColor = (type: NotificationType | string | undefined, priority: NotificationPriority): string => {
    if (priority === NotificationPriority.HIGH || priority === NotificationPriority.URGENT) {
      return '#EF4444';
    }

    switch (type) {
      case NotificationType.BET_RESULT:
      case 'BET_RESULT':
      case NotificationType.CREDITS_RECEIVED:
      case 'CREDITS_RECEIVED':
        return '#00D4AA';
      case NotificationType.BET_CANCELLED:
      case 'BET_CANCELLED':
        return '#EF4444';
      case NotificationType.ACHIEVEMENT_UNLOCKED:
      case 'ACHIEVEMENT_UNLOCKED':
      case NotificationType.STREAK_MILESTONE:
      case 'STREAK_MILESTONE':
      case NotificationType.LEVEL_UP:
      case 'LEVEL_UP':
        return '#FFB800';
      case NotificationType.FRIEND_REQUEST:
      case 'FRIEND_REQUEST':
      case NotificationType.FRIEND_REQUEST_ACCEPTED:
      case 'FRIEND_REQUEST_ACCEPTED':
        return '#8B5CF6';
      case NotificationType.GROUP_INVITE:
      case 'GROUP_INVITE':
        return '#06B6D4';
      default:
        return 'rgba(255, 255, 255, 0.6)';
    }
  };

  const formatTime = (timestamp: string) => {
    const now = new Date();
    const notificationTime = new Date(timestamp);
    const diffInHours = (now.getTime() - notificationTime.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 1) {
      const diffInMinutes = Math.floor(diffInHours * 60);
      return `${diffInMinutes}m`;
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
      const timestamp = new Date(notification.createdAt);
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
    // Mark as read if not already read
    if (!notification.isRead) {
      await markAsRead(notification.id);
    }

    // Navigate to action URL if available
    if (notification.actionUrl) {
      // Parse action URL and navigate accordingly
      const url = notification.actionUrl;

      if (url.startsWith('/bets/')) {
        const betId = url.split('/')[2];
        router.push(`/bet/${betId}` as any);
      } else if (url.startsWith('/groups/')) {
        const groupId = url.split('/')[2];
        router.push(`/group/${groupId}` as any);
      } else if (url === '/friends/requests') {
        router.push('/friends' as any);
      } else if (url === '/friends') {
        router.push('/friends' as any);
      } else {
        // Default navigation
        console.log('Navigate to:', url);
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

      // Refresh the notifications list to remove this notification
      await refresh();

      Alert.alert('Success', 'Friend request accepted!');
    } catch (error) {
      Alert.alert('Error', 'Failed to accept friend request');
      console.error('Error accepting friend request:', error);
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

      // Refresh the notifications list to remove this notification
      await refresh();

      Alert.alert('Success', 'Friend request declined');
    } catch (error) {
      Alert.alert('Error', 'Failed to decline friend request');
      console.error('Error rejecting friend request:', error);
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
    router.push(`/profile/${userId}` as any);
  };

  const NotificationItem = ({ notification }: { notification: NotificationResponse }) => {
    // Check both type and notificationType fields since backend sends notificationType
    const notificationType = notification.type || notification.notificationType;
    const isFriendRequest = notificationType === 'FRIEND_REQUEST';
    const showFriendRequestActions = isFriendRequest && !notification.isRead;
    const isProcessing = processingRequests.has(notification.id);

    // Debug logging
    console.log('Notification:', {
      id: notification.id,
      type: notification.type,
      notificationType: notification.notificationType,
      isFriendRequest,
      showFriendRequestActions,
      isRead: notification.isRead,
      message: notification.message,
      relatedEntityId: notification.relatedEntityId
    });

    // Extract username from message for friend requests
    const extractUsername = (message: string) => {
      const match = message?.match(/(.+?) wants to be your friend/);
      return match ? match[1] : null;
    };

    const username = isFriendRequest ? extractUsername(notification.message || '') : null;

    return (
      <View style={{
        paddingVertical: 16,
        paddingHorizontal: 20,
        backgroundColor: notification.isRead ? 'transparent' : 'rgba(255, 255, 255, 0.02)'
      }}>
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => !showFriendRequestActions && handleNotificationPress(notification)}
          style={{
            flexDirection: 'row',
            alignItems: 'flex-start'
          }}
        >
          {!isFriendRequest && (
            <View style={{
              width: 36,
              height: 36,
              borderRadius: 18,
              backgroundColor: 'rgba(255, 255, 255, 0.08)',
              justifyContent: 'center',
              alignItems: 'center',
              marginRight: 12
            }}>
              <MaterialIcons
                name={getTypeIcon(notificationType) as any}
                size={18}
                color={getTypeColor(notificationType, notification.priority)}
              />
            </View>
          )}

          <View style={{ flex: 1, paddingTop: 1 }}>
            {!isFriendRequest && (
              <View style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                marginBottom: 4
              }}>
                <Text style={{
                  fontSize: 16,
                  fontWeight: notification.isRead ? '500' : '600',
                  color: notification.isRead ? 'rgba(255, 255, 255, 0.8)' : '#ffffff',
                  flex: 1,
                  marginRight: 8
                }}>
                  {notification.title}
                </Text>

                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={{
                    fontSize: 14,
                    color: 'rgba(255, 255, 255, 0.5)',
                    marginBottom: 2
                  }}>
                    {formatTime(notification.createdAt)}
                  </Text>
                  {notification.priority === NotificationPriority.HIGH && (
                    <View style={{
                      backgroundColor: '#EF4444',
                      borderRadius: 8,
                      paddingHorizontal: 6,
                      paddingVertical: 2
                    }}>
                      <Text style={{
                        fontSize: 10,
                        fontWeight: '600',
                        color: '#ffffff'
                      }}>
                        HIGH
                      </Text>
                    </View>
                  )}
                </View>
              </View>
            )}

            {isFriendRequest ? (
              <View style={{ marginTop: 4 }}>
                {/* Single Compact Row */}
                <View style={{
                  flexDirection: 'row',
                  alignItems: 'center'
                }}>
                  {/* Profile Picture */}
                  <TouchableOpacity
                    onPress={() => notification.relatedEntityId && handleViewProfile(notification.relatedEntityId)}
                    style={{
                      width: 38,
                      height: 38,
                      borderRadius: 19,
                      backgroundColor: '#1a1a1f',
                      justifyContent: 'center',
                      alignItems: 'center',
                      marginRight: 10
                    }}
                  >
                    <MaterialIcons name="person" size={18} color="#666" />
                  </TouchableOpacity>

                  {/* Username + Request Text */}
                  <TouchableOpacity
                    onPress={() => notification.relatedEntityId && handleViewProfile(notification.relatedEntityId)}
                    style={{ flex: 1, marginRight: 10 }}
                  >
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 2 }}>
                      <Text style={{
                        fontSize: 15,
                        color: '#ffffff',
                        fontWeight: '600',
                        marginRight: 8
                      }}>
                        {username || 'Someone'}
                      </Text>
                      <Text style={{
                        fontSize: 13,
                        color: 'rgba(255, 255, 255, 0.5)'
                      }}>
                        {formatTime(notification.createdAt)}
                      </Text>
                    </View>
                    <Text style={{
                      fontSize: 13,
                      color: 'rgba(255, 255, 255, 0.6)',
                      fontWeight: '400'
                    }}>
                      New friend request
                    </Text>
                  </TouchableOpacity>

                  {/* Action Buttons */}
                  <View style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 8
                  }}>
                    <TouchableOpacity
                      onPress={() => handleAcceptFriendRequest(notification)}
                      disabled={isProcessing}
                      style={{
                        backgroundColor: '#ffffff',
                        borderRadius: 6,
                        paddingVertical: 8,
                        paddingHorizontal: 14,
                        opacity: isProcessing ? 0.7 : 1,
                        minWidth: 75
                      }}
                    >
                      {isProcessing ? (
                        <ActivityIndicator size="small" color="#000000" />
                      ) : (
                        <Text style={{
                          fontSize: 13,
                          fontWeight: '600',
                          color: '#000000',
                          textAlign: 'center'
                        }}>
                          Accept
                        </Text>
                      )}
                    </TouchableOpacity>

                    <TouchableOpacity
                      onPress={() => handleRejectFriendRequest(notification)}
                      disabled={isProcessing}
                      style={{
                        width: 34,
                        height: 34,
                        borderRadius: 17,
                        backgroundColor: 'rgba(255, 255, 255, 0.1)',
                        justifyContent: 'center',
                        alignItems: 'center',
                        opacity: isProcessing ? 0.7 : 1
                      }}
                    >
                      {isProcessing ? (
                        <ActivityIndicator size="small" color="#ffffff" />
                      ) : (
                        <MaterialIcons
                          name="close"
                          size={16}
                          color="rgba(255, 255, 255, 0.8)"
                        />
                      )}
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            ) : (
              <Text style={{
                fontSize: 15,
                color: 'rgba(255, 255, 255, 0.6)',
                lineHeight: 20,
                letterSpacing: -0.2
              }}>
                {notification.message || notification.content || 'No message content'}
              </Text>
            )}

            {!notification.isRead && (
              <View style={{
                position: 'absolute',
                right: -8,
                top: 6,
                width: 8,
                height: 8,
                borderRadius: 4,
                backgroundColor: '#00D4AA'
              }} />
            )}
          </View>
        </TouchableOpacity>
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
              refreshing={loading}
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
            Object.entries(groupedNotifications).map(([dateGroup, groupNotifications]) => (
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
                {groupNotifications.map((notification, index) => (
                  <View key={notification.id}>
                    <NotificationItem notification={notification} />
                    {index < groupNotifications.length - 1 && (
                      <View style={{
                        height: 0.5,
                        backgroundColor: 'rgba(255, 255, 255, 0.06)',
                        marginLeft: 68
                      }} />
                    )}
                  </View>
                ))}
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