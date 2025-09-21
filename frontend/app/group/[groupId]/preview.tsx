import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Image, StatusBar, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { groupService, GroupDetailResponse } from '../../../services/group/groupService';
import { useAuth } from '../../../contexts/AuthContext';

export default function GroupPreview() {
  const insets = useSafeAreaInsets();
  const { groupId } = useLocalSearchParams();
  const { isAuthenticated, isLoading: authLoading, user } = useAuth();
  const [groupData, setGroupData] = useState<GroupDetailResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isJoining, setIsJoining] = useState(false);

  // Fetch group data
  useEffect(() => {
    const fetchGroupData = async () => {
      if (!isAuthenticated || authLoading || !groupId) return;

      try {
        setIsLoading(true);
        const numericGroupId = Array.isArray(groupId) ? parseInt(groupId[0]) : parseInt(groupId as string);
        const data = await groupService.getGroupById(numericGroupId);
        setGroupData(data);
      } catch (error) {
        console.error('Failed to fetch group data:', error);
        Alert.alert('Error', 'Failed to load group information.');
        router.back();
      } finally {
        setIsLoading(false);
      }
    };

    fetchGroupData();
  }, [groupId, isAuthenticated, authLoading]);

  const handleJoinGroup = async () => {
    if (!groupData) return;

    try {
      setIsJoining(true);
      await groupService.joinGroup(groupData.id);

      Alert.alert(
        'Joined Successfully!',
        `Welcome to ${groupData.groupName}`,
        [
          {
            text: 'Go to Group',
            onPress: () => router.replace(`/group/${groupData.id}`)
          }
        ]
      );
    } catch (error) {
      console.error('Failed to join group:', error);
      Alert.alert('Error', 'Failed to join group. Please try again.');
    } finally {
      setIsJoining(false);
    }
  };

  const handleBackPress = () => {
    router.back();
  };

  if (isLoading || !groupData) {
    return (
      <View style={{ flex: 1, backgroundColor: '#0a0a0f' }}>
        <StatusBar barStyle="light-content" backgroundColor="#0a0a0f" translucent={true} />
        {/* Loading state */}
        <View style={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center'
        }}>
          <Text style={{ color: '#ffffff', fontSize: 16 }}>Loading...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: '#0a0a0f' }}>
      <StatusBar barStyle="light-content" backgroundColor="#0a0a0f" translucent={true} />

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: insets.bottom + 20 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={{ paddingTop: insets.top + 16, paddingHorizontal: 20, marginBottom: 24 }}>
          <TouchableOpacity
            onPress={handleBackPress}
            style={{
              width: 40,
              height: 40,
              borderRadius: 20,
              backgroundColor: 'rgba(255, 255, 255, 0.08)',
              justifyContent: 'center',
              alignItems: 'center',
              marginBottom: 16
            }}
          >
            <MaterialIcons name="arrow-back" size={18} color="#ffffff" />
          </TouchableOpacity>
        </View>

        {/* Group Image & Basic Info */}
        <View style={{ paddingHorizontal: 20, marginBottom: 32 }}>
          <View style={{
            alignItems: 'center',
            marginBottom: 24
          }}>
            {/* Group Image */}
            <View style={{
              width: 120,
              height: 120,
              borderRadius: 24,
              backgroundColor: 'rgba(255, 255, 255, 0.1)',
              justifyContent: 'center',
              alignItems: 'center',
              marginBottom: 16
            }}>
              {groupData.groupImage ? (
                <Image
                  source={{ uri: groupData.groupImage }}
                  style={{
                    width: 120,
                    height: 120,
                    borderRadius: 24
                  }}
                />
              ) : (
                <MaterialIcons name="group" size={48} color="rgba(255, 255, 255, 0.6)" />
              )}
            </View>

            {/* Group Name */}
            <Text style={{
              fontSize: 28,
              fontWeight: '700',
              color: '#ffffff',
              textAlign: 'center',
              marginBottom: 8
            }}>
              {groupData.groupName}
            </Text>

            {/* Member Count */}
            <View style={{
              flexDirection: 'row',
              alignItems: 'center',
              backgroundColor: 'rgba(255, 255, 255, 0.1)',
              paddingHorizontal: 12,
              paddingVertical: 6,
              borderRadius: 16
            }}>
              <MaterialIcons name="people" size={16} color="rgba(255, 255, 255, 0.7)" />
              <Text style={{
                fontSize: 14,
                color: 'rgba(255, 255, 255, 0.7)',
                marginLeft: 4,
                fontWeight: '500'
              }}>
                {groupData.memberCount} {groupData.memberCount === 1 ? 'member' : 'members'}
              </Text>
            </View>
          </View>

          {/* Description */}
          {groupData.description && (
            <View style={{
              backgroundColor: 'rgba(255, 255, 255, 0.03)',
              borderRadius: 16,
              padding: 20,
              marginBottom: 24,
              borderWidth: 0.5,
              borderColor: 'rgba(255, 255, 255, 0.1)'
            }}>
              <Text style={{
                fontSize: 16,
                color: 'rgba(255, 255, 255, 0.8)',
                lineHeight: 24,
                textAlign: 'center'
              }}>
                {groupData.description}
              </Text>
            </View>
          )}

          {/* Group Stats */}
          <View style={{
            backgroundColor: 'rgba(255, 255, 255, 0.03)',
            borderRadius: 16,
            padding: 20,
            marginBottom: 32,
            borderWidth: 0.5,
            borderColor: 'rgba(255, 255, 255, 0.1)'
          }}>
            <Text style={{
              fontSize: 18,
              fontWeight: '600',
              color: '#ffffff',
              marginBottom: 16,
              textAlign: 'center'
            }}>
              Group Activity
            </Text>

            <View style={{
              flexDirection: 'row',
              justifyContent: 'space-around'
            }}>
              <View style={{ alignItems: 'center' }}>
                <Text style={{
                  fontSize: 24,
                  fontWeight: '700',
                  color: '#ffffff',
                  marginBottom: 4
                }}>
                  {groupData.totalBets || 0}
                </Text>
                <Text style={{
                  fontSize: 12,
                  color: 'rgba(255, 255, 255, 0.6)',
                  fontWeight: '500'
                }}>
                  Total Bets
                </Text>
              </View>

              <View style={{
                width: 1,
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                marginHorizontal: 20
              }} />

              <View style={{ alignItems: 'center' }}>
                <Text style={{
                  fontSize: 24,
                  fontWeight: '700',
                  color: '#ffffff',
                  marginBottom: 4
                }}>
                  {groupData.memberCount}
                </Text>
                <Text style={{
                  fontSize: 12,
                  color: 'rgba(255, 255, 255, 0.6)',
                  fontWeight: '500'
                }}>
                  Members
                </Text>
              </View>

              <View style={{
                width: 1,
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                marginHorizontal: 20
              }} />

              <View style={{ alignItems: 'center' }}>
                <Text style={{
                  fontSize: 24,
                  fontWeight: '700',
                  color: '#ffffff',
                  marginBottom: 4
                }}>
                  {groupData.privacy === 'PUBLIC' ? 'Open' : 'Private'}
                </Text>
                <Text style={{
                  fontSize: 12,
                  color: 'rgba(255, 255, 255, 0.6)',
                  fontWeight: '500'
                }}>
                  Privacy
                </Text>
              </View>
            </View>
          </View>

          {/* Join Button */}
          <TouchableOpacity
            onPress={handleJoinGroup}
            disabled={isJoining}
            style={{
              backgroundColor: '#ffffff',
              borderRadius: 16,
              paddingVertical: 16,
              paddingHorizontal: 24,
              alignItems: 'center',
              opacity: isJoining ? 0.7 : 1
            }}
          >
            <Text style={{
              fontSize: 18,
              fontWeight: '700',
              color: '#0a0a0f'
            }}>
              {isJoining ? 'Joining...' : 'Join Group'}
            </Text>
          </TouchableOpacity>

          {/* Info Note */}
          <Text style={{
            fontSize: 14,
            color: 'rgba(255, 255, 255, 0.5)',
            textAlign: 'center',
            marginTop: 16,
            lineHeight: 20
          }}>
            Join this group to participate in bets, chat with members, and access exclusive content.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}