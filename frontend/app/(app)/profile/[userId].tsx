import React, { useState, useMemo } from 'react';
import { Text, View, ScrollView, TouchableOpacity, StatusBar, ActivityIndicator, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { BetSummaryResponse } from '../../../services/bet/betService';
import { SkeletonCard } from '../../../components/common/SkeletonCard';
import { formatPercentage } from '../../../utils/formatters';
import { Avatar } from '../../../components/common/Avatar';
import { useUserProfile, useUserStatistics } from '../../../hooks/useUserQueries';
import {
  useFriendshipStatus,
  useMutualFriendsCount,
  useSendFriendRequest,
  useRemoveFriend
} from '../../../hooks/useFriendshipQueries';
import { useProfileBets } from '../../../hooks/useBetQueries';

export default function UserProfilePage() {
  const insets = useSafeAreaInsets();
  const { userId } = useLocalSearchParams<{ userId: string }>();
  const numericUserId = userId ? Number(userId) : undefined;

  const [isProcessing, setIsProcessing] = useState(false);

  // React Query hooks for data fetching
  const { data: user, isLoading: userLoading, error: userError } = useUserProfile(numericUserId);
  const { data: friendshipStatus } = useFriendshipStatus(numericUserId);

  // Only fetch additional data if profile is not private
  const isPrivateProfile = user?.private === true;

  const { data: stats } = useUserStatistics(!isPrivateProfile ? numericUserId : undefined);
  const { data: mutualFriendsCount = 0 } = useMutualFriendsCount(!isPrivateProfile ? numericUserId : undefined);
  const { data: recentBets = [] } = useProfileBets(!isPrivateProfile ? numericUserId : undefined, 0, 3);

  // Mutations
  const sendFriendRequestMutation = useSendFriendRequest();
  const removeFriendMutation = useRemoveFriend();

  // Derive friendship state from the status response
  const friendshipState = useMemo(() => {
    if (!friendshipStatus) return 'none';
    if (friendshipStatus.areFriends) return 'friends';
    if (friendshipStatus.hasPendingRequest) return 'pending_sent';
    return 'none';
  }, [friendshipStatus]);

  const handleSendFriendRequest = async () => {
    if (!numericUserId) return;

    setIsProcessing(true);
    try {
      await sendFriendRequestMutation.mutateAsync(numericUserId);
      Alert.alert('Success', 'Friend request sent!');
    } catch (err) {
      Alert.alert('Error', 'Failed to send friend request');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRemoveFriend = async () => {
    if (!numericUserId) return;

    Alert.alert(
      'Remove Friend',
      'Are you sure you want to remove this friend?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            setIsProcessing(true);
            try {
              await removeFriendMutation.mutateAsync(numericUserId);
              Alert.alert('Success', 'Friend removed');
            } catch (err) {
              Alert.alert('Error', 'Failed to remove friend');
            } finally {
              setIsProcessing(false);
            }
          }
        }
      ]
    );
  };

  const getActionButtonConfig = () => {
    switch (friendshipState) {
      case 'friends':
        return {
          text: 'Friends',
          icon: 'check',
          backgroundColor: 'rgba(255, 255, 255, 0.08)',
          textColor: 'rgba(255, 255, 255, 0.8)',
          onPress: handleRemoveFriend
        };
      case 'pending_sent':
        return {
          text: 'Pending',
          icon: 'schedule',
          backgroundColor: 'rgba(255, 255, 255, 0.05)',
          textColor: 'rgba(255, 255, 255, 0.4)',
          onPress: () => {}
        };
      case 'none':
      default:
        return {
          text: 'Add Friend',
          icon: 'person-add-alt-1',
          backgroundColor: '#00D4AA',
          textColor: '#000000',
          onPress: handleSendFriendRequest
        };
    }
  };

  const formatNumber = (num: number): string => {
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'k';
    }
    return num.toString();
  };

  const formatTimeAgo = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;
    return `${Math.floor(diffInSeconds / 604800)}w ago`;
  };

  const getBetResult = (bet: BetSummaryResponse): 'win' | 'loss' | 'pending' => {
    if (bet.status !== 'RESOLVED') return 'pending';
    return bet.outcome ? 'win' : 'loss';
  };

  if (userLoading) {
    return (
      <View style={{ flex: 1, backgroundColor: '#0a0a0f' }}>
        <StatusBar barStyle="light-content" backgroundColor="transparent" translucent={true} />
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ paddingTop: insets.top + 20, paddingBottom: insets.bottom + 24 }}
        >
          {/* Header Skeleton */}
          <View style={{ paddingHorizontal: 24, marginBottom: 8 }}>
            <SkeletonCard width={40} height={40} borderRadius={20} />
          </View>

          {/* Profile Section Skeleton */}
          <View style={{ paddingHorizontal: 24, alignItems: 'center', marginBottom: 24 }}>
            <SkeletonCard width={90} height={90} borderRadius={45} style={{ marginBottom: 16 }} />
            <SkeletonCard width={160} height={24} borderRadius={8} style={{ marginBottom: 8 }} />
            <SkeletonCard width={100} height={16} borderRadius={8} style={{ marginBottom: 24 }} />

            <View style={{ flexDirection: 'row', gap: 32, marginBottom: 24, width: '100%', justifyContent: 'center' }}>
              <View style={{ alignItems: 'center' }}>
                <SkeletonCard width={40} height={20} borderRadius={6} style={{ marginBottom: 4 }} />
                <SkeletonCard width={50} height={14} borderRadius={6} />
              </View>
              <View style={{ alignItems: 'center' }}>
                <SkeletonCard width={40} height={20} borderRadius={6} style={{ marginBottom: 4 }} />
                <SkeletonCard width={50} height={14} borderRadius={6} />
              </View>
              <View style={{ alignItems: 'center' }}>
                <SkeletonCard width={40} height={20} borderRadius={6} style={{ marginBottom: 4 }} />
                <SkeletonCard width={60} height={14} borderRadius={6} />
              </View>
            </View>

            <SkeletonCard width={'100%'} height={44} borderRadius={8} />
          </View>

          <View style={{ height: 1, backgroundColor: 'rgba(255, 255, 255, 0.05)', marginBottom: 24 }} />

          <View style={{ paddingHorizontal: 24, marginBottom: 24 }}>
            <SkeletonCard width={120} height={18} borderRadius={6} style={{ marginBottom: 12 }} />
            <View style={{ flexDirection: 'row', gap: 12 }}>
              <SkeletonCard width={'48%'} height={80} borderRadius={10} />
              <SkeletonCard width={'48%'} height={80} borderRadius={10} />
            </View>
          </View>

          <View style={{ paddingHorizontal: 24 }}>
            <SkeletonCard width={140} height={18} borderRadius={6} style={{ marginBottom: 12 }} />
            {[1, 2, 3].map((i) => (
              <SkeletonCard key={i} width={'100%'} height={72} borderRadius={12} style={{ marginBottom: 12 }} />
            ))}
          </View>
        </ScrollView>
      </View>
    );
  }

  if (userError || !user) {
    return (
      <View style={{ flex: 1, backgroundColor: '#0a0a0f', justifyContent: 'center', alignItems: 'center', paddingHorizontal: 32 }}>
        <MaterialIcons name="person-off" size={56} color="rgba(255, 255, 255, 0.2)" />
        <Text style={{ fontSize: 18, fontWeight: '600', color: '#ffffff', marginTop: 24, textAlign: 'center' }}>
          Profile Not Found
        </Text>
        <Text style={{ fontSize: 14, color: 'rgba(255, 255, 255, 0.4)', textAlign: 'center', marginTop: 8, marginBottom: 32 }}>
          This user could not be found
        </Text>
        <TouchableOpacity
          onPress={() => router.back()}
          style={{
            backgroundColor: '#00D4AA',
            borderRadius: 8,
            paddingVertical: 12,
            paddingHorizontal: 24
          }}
        >
          <Text style={{ fontSize: 15, fontWeight: '600', color: '#000000' }}>
            Go Back
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  const displayName = user.displayName || (user.firstName && user.lastName
    ? `${user.firstName} ${user.lastName}`
    : user.username);

  const username = user.username;
  const actionButton = getActionButtonConfig();

  // Use actual stats or defaults
  const totalBets = stats?.totalGames ?? 0;
  const wins = stats?.winCount ?? 0;
  const losses = stats?.lossCount ?? 0;
  const winRate = stats?.winRate ?? 0;

  return (
    <View style={{ flex: 1, backgroundColor: '#0a0a0f' }}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent={true} />

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingTop: insets.top + 20, paddingBottom: insets.bottom + 20 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={{
          paddingHorizontal: 24,
          marginBottom: 8
        }}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={{
              width: 40,
              height: 40,
              justifyContent: 'center',
              alignItems: 'center'
            }}
          >
            <MaterialIcons name="arrow-back" size={24} color="#ffffff" />
          </TouchableOpacity>
        </View>

        {/* Profile Section */}
        <View style={{ paddingHorizontal: 24, paddingBottom: 32 }}>
          {/* Avatar */}
          <View style={{ alignItems: 'center', marginBottom: 24 }}>
            <View style={{ marginBottom: 16 }}>
              <Avatar
                imageUrl={user.profileImageUrl}
                firstName={user.firstName}
                lastName={user.lastName}
                username={user.username}
                userId={user.id}
                size="lg"
              />
            </View>

            <Text style={{
              fontSize: 24,
              fontWeight: '700',
              color: '#ffffff',
              marginBottom: 8,
              letterSpacing: -0.5
            }}>
              {displayName}
            </Text>

            <Text style={{
              fontSize: 15,
              color: 'rgba(255, 255, 255, 0.5)',
              fontWeight: '500'
            }}>
              @{username}
            </Text>

            {/* Bio */}
            {user.bio && (
              <Text style={{
                fontSize: 14,
                color: 'rgba(255, 255, 255, 0.6)',
                textAlign: 'center',
                marginTop: 12,
                paddingHorizontal: 24,
                lineHeight: 20
              }}>
                {user.bio}
              </Text>
            )}
          </View>

          {/* Stats - only show for public profiles */}
          {!isPrivateProfile && (
            <View style={{
              flexDirection: 'row',
              justifyContent: 'center',
              gap: 32,
              marginBottom: 24
            }}>
              <View style={{ alignItems: 'center' }}>
                <Text style={{
                  fontSize: 20,
                  fontWeight: '700',
                  color: '#ffffff',
                  marginBottom: 4
                }}>
                  {formatNumber(mutualFriendsCount)}
                </Text>
                <Text style={{
                  fontSize: 13,
                  color: 'rgba(255, 255, 255, 0.5)'
                }}>
                  Friends
                </Text>
              </View>

              <View style={{ alignItems: 'center' }}>
                <Text style={{
                  fontSize: 20,
                  fontWeight: '700',
                  color: '#ffffff',
                  marginBottom: 4
                }}>
                  {formatNumber(totalBets)}
                </Text>
                <Text style={{
                  fontSize: 13,
                  color: 'rgba(255, 255, 255, 0.5)'
                }}>
                  Bets
                </Text>
              </View>

              <View style={{ alignItems: 'center' }}>
                <Text style={{
                  fontSize: 20,
                  fontWeight: '700',
                  color: '#00D4AA',
                  marginBottom: 4
                }}>
                  {formatPercentage(winRate * 100)}
                </Text>
                <Text style={{
                  fontSize: 13,
                  color: 'rgba(255, 255, 255, 0.5)'
                }}>
                  Win Rate
                </Text>
              </View>
            </View>
          )}

          {/* Action Button */}
          <TouchableOpacity
            onPress={actionButton.onPress}
            disabled={isProcessing || friendshipState === 'pending_sent'}
            style={{
              backgroundColor: actionButton.backgroundColor,
              paddingVertical: 12,
              borderRadius: 8,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              opacity: isProcessing ? 0.6 : 1
            }}
          >
            {isProcessing ? (
              <ActivityIndicator size="small" color={actionButton.textColor} />
            ) : (
              <>
                <MaterialIcons
                  name={actionButton.icon as any}
                  size={18}
                  color={actionButton.textColor}
                  style={{ marginRight: 8 }}
                />
                <Text style={{
                  color: actionButton.textColor,
                  fontSize: 15,
                  fontWeight: '600'
                }}>
                  {actionButton.text}
                </Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        {/* Private Profile Message */}
        {isPrivateProfile && (
          <View style={{
            paddingHorizontal: 24,
            paddingVertical: 40,
            alignItems: 'center'
          }}>
            <MaterialIcons
              name="lock"
              size={48}
              color="rgba(255, 255, 255, 0.2)"
              style={{ marginBottom: 16 }}
            />
            <Text style={{
              fontSize: 16,
              fontWeight: '600',
              color: 'rgba(255, 255, 255, 0.6)',
              textAlign: 'center',
              marginBottom: 8
            }}>
              Private Profile
            </Text>
            <Text style={{
              fontSize: 14,
              color: 'rgba(255, 255, 255, 0.4)',
              textAlign: 'center',
              lineHeight: 20
            }}>
              {user.message || 'Add as friend to view full profile'}
            </Text>
          </View>
        )}

        {/* Divider - only show for public profiles */}
        {!isPrivateProfile && (
          <View style={{ height: 1, backgroundColor: 'rgba(255, 255, 255, 0.05)', marginBottom: 24 }} />
        )}

        {/* Performance - only show for public profiles */}
        {!isPrivateProfile && (
          <View style={{ paddingHorizontal: 24, marginBottom: 24 }}>
            <Text style={{
              fontSize: 17,
              fontWeight: '700',
              color: '#ffffff',
              marginBottom: 12,
              letterSpacing: -0.3
            }}>
              Performance
            </Text>

            <View style={{
              flexDirection: 'row',
              gap: 12
            }}>
              <View style={{
                flex: 1,
                backgroundColor: 'rgba(255, 255, 255, 0.04)',
                borderRadius: 10,
                padding: 16,
                alignItems: 'center'
              }}>
                <Text style={{
                  fontSize: 22,
                  fontWeight: '700',
                  color: '#00D4AA',
                  marginBottom: 4
                }}>
                  {formatNumber(wins)}
                </Text>
                <Text style={{
                  fontSize: 12,
                  color: 'rgba(255, 255, 255, 0.4)'
                }}>
                  Wins
                </Text>
              </View>

              <View style={{
                flex: 1,
                backgroundColor: 'rgba(255, 255, 255, 0.04)',
                borderRadius: 10,
                padding: 16,
                alignItems: 'center'
              }}>
                <Text style={{
                  fontSize: 22,
                  fontWeight: '700',
                  color: 'rgba(255, 255, 255, 0.6)',
                  marginBottom: 4
                }}>
                  {formatNumber(losses)}
                </Text>
                <Text style={{
                  fontSize: 12,
                  color: 'rgba(255, 255, 255, 0.4)'
                }}>
                  Losses
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* Recent Activity - only show for public profiles */}
        {!isPrivateProfile && (
          <View style={{ paddingHorizontal: 24 }}>
            <Text style={{
              fontSize: 17,
              fontWeight: '700',
              color: '#ffffff',
              marginBottom: 16,
              letterSpacing: -0.3
            }}>
              Recent Activity
            </Text>

            {recentBets.length === 0 ? (
              <View style={{
                alignItems: 'center',
                paddingVertical: 32
              }}>
                <MaterialIcons
                  name="sports-esports"
                  size={40}
                  color="rgba(255, 255, 255, 0.2)"
                  style={{ marginBottom: 12 }}
                />
                <Text style={{
                  fontSize: 14,
                  color: 'rgba(255, 255, 255, 0.4)',
                  textAlign: 'center'
                }}>
                  No recent activity
                </Text>
              </View>
            ) : (
              recentBets.map((bet) => {
                const result = getBetResult(bet);
                const isWin = result === 'win';
                const isPending = result === 'pending';

                return (
                  <TouchableOpacity
                    key={bet.id}
                    onPress={() => router.push(`/(app)/bet-details/${bet.id}`)}
                    style={{
                      backgroundColor: 'rgba(255, 255, 255, 0.04)',
                      borderRadius: 12,
                      padding: 16,
                      marginBottom: 12,
                      flexDirection: 'row',
                      alignItems: 'center',
                      justifyContent: 'space-between'
                    }}
                  >
                    <View style={{ flex: 1 }}>
                      <Text style={{
                        fontSize: 15,
                        fontWeight: '600',
                        color: '#ffffff',
                        marginBottom: 8
                      }}>
                        {bet.title}
                      </Text>
                      <Text style={{
                        fontSize: 13,
                        color: 'rgba(255, 255, 255, 0.4)'
                      }}>
                        {formatTimeAgo(bet.createdAt)} • {bet.groupName}
                      </Text>
                    </View>

                    <View style={{ alignItems: 'flex-end' }}>
                      {bet.stakeType === 'CREDIT' && bet.userAmount !== undefined && (
                        <Text style={{
                          fontSize: 16,
                          fontWeight: '700',
                          color: isWin ? '#00D4AA' : isPending ? 'rgba(255, 255, 255, 0.5)' : 'rgba(255, 255, 255, 0.3)'
                        }}>
                          {isPending ? bet.userAmount : isWin ? `+${bet.userAmount}` : `-${bet.userAmount}`}
                        </Text>
                      )}
                      <Text style={{
                        fontSize: 12,
                        color: isWin ? '#00D4AA' : isPending ? 'rgba(255, 255, 255, 0.5)' : 'rgba(255, 255, 255, 0.3)',
                        marginTop: 4,
                        textTransform: 'capitalize'
                      }}>
                        {isPending ? 'Active' : result}
                      </Text>
                    </View>
                  </TouchableOpacity>
                );
              })
            )}
          </View>
        )}
      </ScrollView>
    </View>
  );
}
