import React, { useState } from 'react';
import { Text, View, TouchableOpacity, ScrollView, StatusBar } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';

export default function Notifications() {
  const insets = useSafeAreaInsets();
  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  
  const [notifications, setNotifications] = useState([
    {
      id: '1',
      title: 'Your bet won',
      subtitle: 'Lakers vs Warriors',
      value: '+$125',
      timestamp: new Date(Date.now() - 2 * 60 * 1000),
      read: false,
      type: 'win'
    },
    {
      id: '2',
      title: 'New follower',
      subtitle: 'Mike Johnson started following you',
      timestamp: new Date(Date.now() - 60 * 60 * 1000),
      read: false,
      type: 'social'
    },
    {
      id: '3',
      title: 'Game starting soon',
      subtitle: 'Celtics vs Heat in 30 minutes',
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
      read: true,
      type: 'reminder'
    },
    {
      id: '4',
      title: 'Achievement unlocked',
      subtitle: 'Hot Streak - 5 wins in a row',
      timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000),
      read: true,
      type: 'achievement'
    },
    {
      id: '5',
      title: 'Bet settled',
      subtitle: 'Bulls vs Nets',
      value: '-$50',
      timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000),
      read: true,
      type: 'loss'
    },
    {
      id: '6',
      title: 'Group invitation',
      subtitle: 'You were invited to join Elite Squad',
      timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      read: true,
      type: 'social'
    },
    {
      id: '7',
      title: 'Weekly summary',
      subtitle: 'Your betting performance this week',
      timestamp: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      read: true,
      type: 'system'
    }
  ]);

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'win': return 'trending-up';
      case 'loss': return 'trending-down';
      case 'social': return 'person-add';
      case 'reminder': return 'schedule';
      case 'achievement': return 'emoji-events';
      case 'system': return 'info';
      default: return 'notifications';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'win': return '#00D4AA';
      case 'loss': return '#EF4444';
      case 'achievement': return '#FFB800';
      default: return 'rgba(255, 255, 255, 0.6)';
    }
  };

  const formatTime = (timestamp: Date) => {
    const now = new Date();
    const diffInHours = (now.getTime() - timestamp.getTime()) / (1000 * 60 * 60);
    
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

  const groupByDate = (notifications: any[]) => {
    const groups: { [key: string]: any[] } = {};
    const now = new Date();
    
    notifications.forEach(notification => {
      const timestamp = notification.timestamp;
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

  const filteredNotifications = filter === 'unread' 
    ? notifications.filter(n => !n.read)
    : notifications;
    
  const groupedNotifications = groupByDate(filteredNotifications);
  const unreadCount = notifications.filter(n => !n.read).length;
  
  const markAsRead = (id: string) => {
    setNotifications(prev => prev.map(n => 
      n.id === id ? { ...n, read: true } : n
    ));
  };
  

  const NotificationItem = ({ notification }: { notification: any }) => (
    <TouchableOpacity 
      activeOpacity={0.7}
      onPress={() => markAsRead(notification.id)}
      style={{
        paddingVertical: 16,
        paddingHorizontal: 20,
        flexDirection: 'row',
        alignItems: 'flex-start',
        backgroundColor: notification.read ? 'transparent' : 'rgba(255, 255, 255, 0.02)'
      }}
    >
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
          name={getTypeIcon(notification.type) as any} 
          size={18} 
          color={getTypeColor(notification.type)} 
        />
      </View>
      
      <View style={{ flex: 1, paddingTop: 1 }}>
        <View style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          marginBottom: 4
        }}>
          <Text style={{
            fontSize: 16,
            fontWeight: notification.read ? '500' : '600',
            color: notification.read ? 'rgba(255, 255, 255, 0.8)' : '#ffffff',
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
              {formatTime(notification.timestamp)}
            </Text>
            {notification.value && (
              <Text style={{
                fontSize: 15,
                fontWeight: '600',
                color: notification.type === 'win' ? '#00D4AA' : '#EF4444'
              }}>
                {notification.value}
              </Text>
            )}
          </View>
        </View>
        
        <Text style={{
          fontSize: 15,
          color: 'rgba(255, 255, 255, 0.6)',
          lineHeight: 20,
          letterSpacing: -0.2
        }}>
          {notification.subtitle}
        </Text>
        
        {!notification.read && (
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
  );

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
              onPress={() => router.push('/(tabs)/profile')}
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

        {/* Notifications List */}
        <ScrollView 
          style={{ flex: 1 }}
          showsVerticalScrollIndicator={false}
          contentInsetAdjustmentBehavior="automatic"
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
                {filter === 'unread' ? 'No unread notifications' : 'Inbox is empty'}
              </Text>
            </View>
          )}
          
          <View style={{ height: insets.bottom + 20 }} />
        </ScrollView>
      </View>
    </View>
  );
}