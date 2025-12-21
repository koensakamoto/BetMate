import React, { useState, useMemo } from 'react';
import { Text, View, TouchableOpacity, ScrollView, StatusBar, TextInput, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { Avatar } from '../../components/common/Avatar';
import { useFriends, useFriendsCount } from '../../hooks/useFriendshipQueries';
import { FriendDto } from '../../services/friendship/friendshipService';

export default function Friends() {
  const insets = useSafeAreaInsets();
  const [searchQuery, setSearchQuery] = useState('');

  // React Query hooks - handles loading, caching, and refetching automatically
  const { data: friends = [], isLoading, error, refetch } = useFriends();
  const { data: friendsCount = 0 } = useFriendsCount();

  // Filter friends based on search query (client-side filtering)
  const filteredFriends = useMemo(() => {
    if (searchQuery.trim().length === 0) {
      return friends;
    }
    return friends.filter(user => {
      const displayName = user.firstName && user.lastName
        ? `${user.firstName} ${user.lastName}`
        : user.username;
      return (
        displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.username.toLowerCase().includes(searchQuery.toLowerCase())
      );
    });
  }, [friends, searchQuery]);

  const UserItem = ({ user }: { user: FriendDto }) => (
    <TouchableOpacity
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 20,
        backgroundColor: 'rgba(255, 255, 255, 0.02)'
      }}
      activeOpacity={0.7}
    >
      {/* Avatar */}
      <View style={{ position: 'relative', marginRight: 12 }}>
        <Avatar
          imageUrl={user.profileImageUrl}
          firstName={user.firstName}
          lastName={user.lastName}
          username={user.username}
          userId={user.id}
          customSize={44}
        />
      </View>

      {/* User Info */}
      <View style={{ flex: 1, marginRight: 12 }}>
        <Text style={{
          fontSize: 15,
          fontWeight: '600',
          color: '#ffffff',
          marginBottom: 2
        }}>
          {user.username}
        </Text>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Text style={{
            fontSize: 14,
            color: 'rgba(255, 255, 255, 0.6)',
            marginRight: 8
          }}>
            {user.firstName && user.lastName ? `${user.firstName} ${user.lastName}` : user.username}
          </Text>
        </View>
      </View>

      {/* Friends Badge */}
      <View style={{
        alignItems: 'flex-end',
        justifyContent: 'center',
        minWidth: 100
      }}>
        <View style={{
          backgroundColor: 'rgba(255, 255, 255, 0.06)',
          paddingHorizontal: 10,
          paddingVertical: 6,
          borderRadius: 16,
          borderWidth: 0.5,
          borderColor: 'rgba(255, 255, 255, 0.15)'
        }}>
          <Text style={{
            fontSize: 12,
            color: 'rgba(255, 255, 255, 0.6)',
            fontWeight: '600',
            textAlign: 'center'
          }}>
            Friends
          </Text>
        </View>
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
            marginBottom: 20
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

            <View>
              <Text style={{
                fontSize: 24,
                fontWeight: '600',
                color: '#ffffff'
              }}>
                Friends
              </Text>
            </View>
          </View>

          {/* Friends Count */}
          <View style={{
            marginBottom: 16,
            alignItems: 'center'
          }}>
            <Text style={{
              fontSize: 16,
              fontWeight: '600',
              color: '#ffffff'
            }}>
              {friendsCount} friends
            </Text>
          </View>

          {/* Search Bar */}
          <View style={{
            backgroundColor: 'rgba(255, 255, 255, 0.08)',
            borderRadius: 12,
            paddingHorizontal: 16,
            paddingVertical: 12,
            flexDirection: 'row',
            alignItems: 'center',
            marginBottom: 8
          }}>
            <MaterialIcons
              name="search"
              size={20}
              color="rgba(255, 255, 255, 0.5)"
              style={{ marginRight: 12 }}
            />
            <TextInput
              style={{
                flex: 1,
                fontSize: 16,
                color: '#ffffff',
                fontWeight: '400'
              }}
              placeholder="Search friends"
              placeholderTextColor="rgba(255, 255, 255, 0.5)"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <MaterialIcons
                  name="close"
                  size={20}
                  color="rgba(255, 255, 255, 0.5)"
                />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Users List */}
        <ScrollView
          style={{ flex: 1 }}
          showsVerticalScrollIndicator={false}
          contentInsetAdjustmentBehavior="automatic"
        >
          {isLoading ? (
            <View style={{
              flex: 1,
              justifyContent: 'center',
              alignItems: 'center',
              paddingVertical: 60
            }}>
              <ActivityIndicator size="large" color="#00D4AA" />
              <Text style={{
                fontSize: 16,
                color: 'rgba(255, 255, 255, 0.6)',
                textAlign: 'center',
                marginTop: 16
              }}>
                Loading friends...
              </Text>
            </View>
          ) : error ? (
            <View style={{
              flex: 1,
              justifyContent: 'center',
              alignItems: 'center',
              paddingVertical: 60
            }}>
              <MaterialIcons
                name="error-outline"
                size={48}
                color="rgba(255, 255, 255, 0.3)"
                style={{ marginBottom: 16 }}
              />
              <Text style={{
                fontSize: 16,
                color: 'rgba(255, 255, 255, 0.4)',
                textAlign: 'center',
                marginBottom: 16
              }}>
                Failed to load friends
              </Text>
              <TouchableOpacity
                onPress={() => refetch()}
                style={{
                  backgroundColor: '#00D4AA',
                  paddingHorizontal: 20,
                  paddingVertical: 10,
                  borderRadius: 8
                }}
              >
                <Text style={{
                  color: '#000000',
                  fontWeight: '600'
                }}>
                  Try Again
                </Text>
              </TouchableOpacity>
            </View>
          ) : filteredFriends.length > 0 ? (
            filteredFriends.map((user, index) => (
              <View key={user.id}>
                <UserItem user={user} />
                {index < filteredFriends.length - 1 && (
                  <View style={{
                    height: 0.5,
                    backgroundColor: 'rgba(255, 255, 255, 0.06)',
                    marginLeft: 76
                  }} />
                )}
              </View>
            ))
          ) : friends.length === 0 ? (
            <View style={{
              flex: 1,
              justifyContent: 'center',
              alignItems: 'center',
              paddingVertical: 60
            }}>
              <MaterialIcons
                name="people-outline"
                size={48}
                color="rgba(255, 255, 255, 0.3)"
                style={{ marginBottom: 16 }}
              />
              <Text style={{
                fontSize: 16,
                color: 'rgba(255, 255, 255, 0.4)',
                textAlign: 'center',
                marginBottom: 4
              }}>
                No friends yet
              </Text>
              <Text style={{
                fontSize: 14,
                color: 'rgba(255, 255, 255, 0.3)',
                textAlign: 'center'
              }}>
                Find friends to add them to your network
              </Text>
            </View>
          ) : (
            <View style={{
              flex: 1,
              justifyContent: 'center',
              alignItems: 'center',
              paddingVertical: 60
            }}>
              <MaterialIcons
                name="search-off"
                size={48}
                color="rgba(255, 255, 255, 0.3)"
                style={{ marginBottom: 16 }}
              />
              <Text style={{
                fontSize: 16,
                color: 'rgba(255, 255, 255, 0.4)',
                textAlign: 'center'
              }}>
                No friends found
              </Text>
            </View>
          )}

          <View style={{ height: insets.bottom + 20 }} />
        </ScrollView>
      </View>
    </View>
  );
}
