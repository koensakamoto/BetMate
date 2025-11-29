import React, { useEffect, useState } from 'react';
import { Text, View, ScrollView, TouchableOpacity, StatusBar, ActivityIndicator, Alert, Image } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { UserProfile } from '../../types/api';
import { friendshipService } from '../../../services/user/friendshipService';
import { userService, UserProfileResponse, UserStatistics } from '../../../services/user/userService';
import { betService, BetSummaryResponse } from '../../../services/bet/betService';
import { debugLog, errorLog } from '../../../config/env';
import { SkeletonCard } from '../../../components/common/SkeletonCard';
import { formatPercentage } from '../../../utils/formatters';
import { getFullImageUrl } from '../../../utils/avatarUtils';
import { getErrorMessage } from '../../../utils/errorUtils';

const icon = require("../../../assets/images/icon.png");

export default function UserProfilePage() {
  const insets = useSafeAreaInsets();
  const { userId } = useLocalSearchParams<{ userId: string }>();
  const [user, setUser] = useState<UserProfileResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [friendshipStatus, setFriendshipStatus] = useState<'none' | 'pending_sent' | 'pending_received' | 'friends' | 'blocked'>('none');
  const [isProcessing, setIsProcessing] = useState(false);
  const [friendsCount, setFriendsCount] = useState<number>(0);
  const [stats, setStats] = useState<UserStatistics | null>(null);
  const [recentBets, setRecentBets] = useState<BetSummaryResponse[]>([]);

  useEffect(() => {
    if (userId) {
      loadUserProfile();
      checkFriendshipStatus();
    }
  }, [userId]);

  // Load additional data only after we know the profile is not private
  useEffect(() => {
    if (user && !user.private) {
      loadUserStats();
      loadFriendsCount();
      loadRecentBets();
    }
  }, [user]);

  const loadUserProfile = async () => {
    try {
      setLoading(true);
      const response = await userService.getUserById(Number(userId));
      setUser(response);
    } catch (err) {
      errorLog('Failed to load user profile:', err);
      setError('Failed to load user profile');
    } finally {
      setLoading(false);
    }
  };

  const loadUserStats = async () => {
    try {
      const statistics = await userService.getUserStatistics(Number(userId));
      setStats(statistics);
      debugLog('User stats loaded:', statistics);
    } catch (err) {
      errorLog('Failed to load user stats:', err);
    }
  };

  const loadFriendsCount = async () => {
    try {
      const { mutualFriendsCount } = await friendshipService.getMutualFriendsCount(Number(userId));
      setFriendsCount(mutualFriendsCount);
      debugLog('Friends count loaded:', mutualFriendsCount);
    } catch (err) {
      errorLog('Failed to load friends count:', err);
      setFriendsCount(0);
    }
  };

  const loadRecentBets = async () => {
    try {
      const bets = await betService.getProfileBets(Number(userId), 0, 3);
      setRecentBets(bets);
      debugLog('Recent bets loaded:', bets);
    } catch (err) {
      errorLog('Failed to load recent bets:', err);
      setRecentBets([]);
    }
  };

  const checkFriendshipStatus = async () => {
    try {
      // Check if already friends
      const friends = await friendshipService.getFriends();
      const isFriend = friends.some(friend => friend.id === Number(userId));

      if (isFriend) {
        setFriendshipStatus('friends');
        return;
      }

      // Check if there's a pending request
      const sentRequests = await friendshipService.getPendingRequestsSent();
      const hasPendingRequest = sentRequests.some(request => request.user.id === Number(userId));

      if (hasPendingRequest) {
        setFriendshipStatus('pending_sent');
      } else {
        setFriendshipStatus('none');
      }
    } catch (err) {
      // Error handled silently
    }
  };

  const handleSendFriendRequest = async () => {
    if (!userId) return;

    setIsProcessing(true);
    try {
      await friendshipService.sendFriendRequest(Number(userId));
      setFriendshipStatus('pending_sent');
      Alert.alert('Success', 'Friend request sent!');
    } catch (err) {
      Alert.alert('Error', 'Failed to send friend request');
      // Error handled silently
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRemoveFriend = async () => {
    if (!userId) return;

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
              await friendshipService.removeFriend(Number(userId));
              setFriendshipStatus('none');
              Alert.alert('Success', 'Friend removed');
            } catch (err) {
              Alert.alert('Error', 'Failed to remove friend');
              // Error handled silently
            } finally {
              setIsProcessing(false);
            }
          }
        }
      ]
    );
  };

  const getActionButtonConfig = () => {
    switch (friendshipStatus) {
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
    // This is a simplified check - you may need to add more logic based on your bet structure
    // For now, we'll assume hasUserParticipated means they were involved
    return bet.outcome ? 'win' : 'loss';
  };

  if (loading) {
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
            {/* Avatar */}
            <SkeletonCard width={90} height={90} borderRadius={45} style={{ marginBottom: 16 }} />

            {/* Name */}
            <SkeletonCard width={160} height={24} borderRadius={8} style={{ marginBottom: 8 }} />

            {/* Username */}
            <SkeletonCard width={100} height={16} borderRadius={8} style={{ marginBottom: 24 }} />

            {/* Stats Row */}
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

            {/* Action Button */}
            <SkeletonCard width={'100%'} height={44} borderRadius={8} />
          </View>

          {/* Divider */}
          <View style={{ height: 1, backgroundColor: 'rgba(255, 255, 255, 0.05)', marginBottom: 24 }} />

          {/* Performance Section Skeleton */}
          <View style={{ paddingHorizontal: 24, marginBottom: 24 }}>
            <SkeletonCard width={120} height={18} borderRadius={6} style={{ marginBottom: 12 }} />
            <View style={{ flexDirection: 'row', gap: 12 }}>
              <SkeletonCard width={'48%'} height={80} borderRadius={10} />
              <SkeletonCard width={'48%'} height={80} borderRadius={10} />
            </View>
          </View>

          {/* Recent Activity Section Skeleton */}
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

  if (error || !user) {
    return (
      <View style={{ flex: 1, backgroundColor: '#0a0a0f', justifyContent: 'center', alignItems: 'center', paddingHorizontal: 32 }}>
        <MaterialIcons name="person-off" size={56} color="rgba(255, 255, 255, 0.2)" />
        <Text style={{ fontSize: 18, fontWeight: '600', color: '#ffffff', marginTop: 24, textAlign: 'center' }}>
          Profile Not Found
        </Text>
        <Text style={{ fontSize: 14, color: 'rgba(255, 255, 255, 0.4)', textAlign: 'center', marginTop: 8, marginBottom: 32 }}>
          {error || 'This user could not be found'}
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

  // Check if profile is private (limited view)
  const isPrivateProfile = user.private === true;

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
            <Image
              source={getFullImageUrl(user.profileImageUrl) ? { uri: getFullImageUrl(user.profileImageUrl)! } : icon}
              style={{
                width: 90,
                height: 90,
                borderRadius: 45,
                marginBottom: 16
              }}
            />

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
                  {formatNumber(friendsCount)}
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
            disabled={isProcessing || friendshipStatus === 'pending_sent'}
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
