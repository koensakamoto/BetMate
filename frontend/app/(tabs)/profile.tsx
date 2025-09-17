import { Text, View, Image, TouchableOpacity, ScrollView, StatusBar, ActivityIndicator, Alert } from "react-native";
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useState, useEffect } from 'react';
import { router, useFocusEffect } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { useCallback } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { userService, UserProfileResponse, UserStatistics } from '../../services/user/userService';
import { debugLog, errorLog } from '../../config/env';
import { NotificationIconButton } from '../../components/ui/NotificationBadge';

const icon = require("../../assets/images/icon.png");

export default function Profile() {
  const insets = useSafeAreaInsets();
  const { user: authUser, isAuthenticated, isLoading: authLoading } = useAuth();
  const [activeTab, setActiveTab] = useState(0);
  const [userProfile, setUserProfile] = useState<UserProfileResponse | null>(null);
  const [userStats, setUserStats] = useState<UserStatistics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const tabs = ['Activity', 'Stats', 'Achievements'];

  useEffect(() => {
    if (!authLoading) {
      if (isAuthenticated) {
        loadUserData();
      } else {
        // User is not authenticated, redirect to login
        router.replace('/auth/login');
      }
    }
  }, [authLoading, isAuthenticated]);

  // Reload data when screen comes into focus (e.g., returning from edit profile)
  useFocusEffect(
    useCallback(() => {
      if (isAuthenticated && !authLoading) {
        loadUserData();
      }
    }, [isAuthenticated, authLoading])
  );

  const loadUserData = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Load user profile
      const profile = await userService.getCurrentUserProfile();
      setUserProfile(profile);
      debugLog('User profile loaded:', profile);
      
      // Load user statistics
      const stats = await userService.getCurrentUserStatistics();
      setUserStats(stats);
      debugLog('User stats loaded:', stats);
      
    } catch (err: any) {
      errorLog('Failed to load user data:', err);
      setError(err.message || 'Failed to load profile data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditProfile = () => {
    router.push('/edit-profile');
  };


  const formatNumber = (num?: number): string => {
    if (num === undefined || num === null) return '0';
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
  };

  const formatPercentage = (percentage?: number): string => {
    if (percentage === undefined || percentage === null) return '0%';
    return Math.round(percentage) + '%';
  };

  // Show loading while checking authentication or loading profile data
  if (authLoading || isLoading) {
    return (
      <View style={{ flex: 1, backgroundColor: '#0a0a0f', justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#00D4AA" />
        <Text style={{ color: '#ffffff', marginTop: 16, fontSize: 16 }}>
          {authLoading ? 'Checking authentication...' : 'Loading profile...'}
        </Text>
      </View>
    );
  }

  // If not authenticated, don't render anything (will redirect)
  if (!isAuthenticated) {
    return null;
  }

  if (error) {
    return (
      <View style={{ flex: 1, backgroundColor: '#0a0a0f', justifyContent: 'center', alignItems: 'center', paddingHorizontal: 20 }}>
        <MaterialIcons name="error-outline" size={48} color="#EF4444" />
        <Text style={{ color: '#ffffff', marginTop: 16, fontSize: 18, textAlign: 'center' }}>Failed to load profile</Text>
        <Text style={{ color: 'rgba(255, 255, 255, 0.6)', marginTop: 8, fontSize: 14, textAlign: 'center' }}>{error}</Text>
        <TouchableOpacity 
          onPress={loadUserData}
          style={{
            backgroundColor: '#00D4AA',
            paddingHorizontal: 24,
            paddingVertical: 12,
            borderRadius: 8,
            marginTop: 20
          }}
        >
          <Text style={{ color: '#000000', fontWeight: '600', fontSize: 16 }}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const displayName = userProfile?.firstName && userProfile?.lastName 
    ? `${userProfile.firstName} ${userProfile.lastName}`
    : userProfile?.username || 'Unknown User';
  
  const username = userProfile?.username || '';


  return (
    <View style={{ flex: 1, backgroundColor: '#0a0a0f' }}>
      <StatusBar
        barStyle="light-content"
        backgroundColor="#0a0a0f"
        translucent={true}
      />
      
      <ScrollView 
        style={{ flex: 1 }} 
        contentContainerStyle={{ paddingTop: insets.top + 8, paddingBottom: insets.bottom + 20 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header Icons */}
        <View style={{ 
          flexDirection: 'row', 
          justifyContent: 'space-between', 
          paddingHorizontal: 20, 
          marginBottom: 8,
          alignItems: 'center'
        }}>
          {/* Find Friends Icon */}
          <TouchableOpacity 
            onPress={() => router.push('/find-friends')}
            style={{
              width: 40,
              height: 40,
              borderRadius: 20,
              backgroundColor: 'rgba(255, 255, 255, 0.08)',
              justifyContent: 'center',
              alignItems: 'center'
            }}
          >
            <MaterialIcons 
              name="person-add" 
              size={20} 
              color="#ffffff" 
            />
          </TouchableOpacity>

          <View style={{ 
            flexDirection: 'row', 
            gap: 16 
          }}>
            {/* Notifications Icon with Badge */}
            <NotificationIconButton size={20} />

            {/* Settings Icon */}
            <TouchableOpacity 
              onPress={() => router.push('/settings')}
              style={{
                width: 40,
                height: 40,
                borderRadius: 20,
                backgroundColor: 'rgba(255, 255, 255, 0.08)',
                justifyContent: 'center',
                alignItems: 'center'
              }}
            >
              <MaterialIcons 
                name="settings" 
                size={20} 
                color="#ffffff" 
              />
            </TouchableOpacity>
          </View>
        </View>

        {/* Sleek Header */}
        <View style={{ paddingHorizontal: 20, marginBottom: 12 }}>
          {/* Avatar & Basic Info */}
          <View style={{ alignItems: 'center', marginBottom: 20 }}>
            <View style={{ position: 'relative', marginBottom: 12 }}>
              <Image 
                source={icon}
                style={{ 
                  width: 90, 
                  height: 90, 
                  borderRadius: 45
                }}
              />
              {/* Subtle ring indicator */}
              <View style={{
                position: 'absolute',
                inset: -3,
                borderRadius: 48,
                borderWidth: 1,
                borderColor: 'rgba(255, 255, 255, 0.1)'
              }} />
            </View>
            
            <View style={{ alignItems: 'center', marginBottom: 16 }}>
              <Text style={{ 
                fontSize: 20, 
                fontWeight: '500', 
                color: '#ffffff',
                marginBottom: 4
              }}>
                {displayName}
              </Text>
              <Text style={{ 
                fontSize: 14, 
                color: 'rgba(255, 255, 255, 0.5)',
                marginBottom: 8
              }}>
                @{username}
              </Text>
            </View>

            {/* Social Stats */}
            <View style={{ 
              flexDirection: 'row', 
              alignItems: 'center',
              gap: 24,
              marginBottom: 20
            }}>
              <View style={{ alignItems: 'center' }}>
                <Text style={{ 
                  fontSize: 18, 
                  fontWeight: '600', 
                  color: '#ffffff',
                  marginBottom: 2
                }}>
                  {formatNumber(0)} {/* TODO: Add friends count from backend */}
                </Text>
                <Text style={{
                  fontSize: 11,
                  color: 'rgba(255, 255, 255, 0.4)',
                  textTransform: 'uppercase',
                  letterSpacing: 0.5
                }}>
                  Friends
                </Text>
              </View>
              
              <View style={{
                width: 1,
                height: 20,
                backgroundColor: 'rgba(255, 255, 255, 0.1)'
              }} />
              
              <View style={{ alignItems: 'center' }}>
                <Text style={{ 
                  fontSize: 18, 
                  fontWeight: '600', 
                  color: '#00D4AA',
                  marginBottom: 2
                }}>
                  {formatNumber(userStats?.totalGames || 0)}
                </Text>
                <Text style={{ 
                  fontSize: 11, 
                  color: 'rgba(255, 255, 255, 0.4)',
                  textTransform: 'uppercase',
                  letterSpacing: 0.5
                }}>
                  Bets
                </Text>
              </View>
            </View>

            {/* Bio Section */}
            <Text style={{
              fontSize: 14,
              color: 'rgba(255, 255, 255, 0.8)',
              textAlign: 'center',
              lineHeight: 20,
              marginBottom: 20,
              paddingHorizontal: 20
            }}>
              {userProfile?.bio || "No bio yet. Tap edit to add one!"}
            </Text>

            {/* Action Buttons */}
            <View style={{
              flexDirection: 'row',
              gap: 12,
              marginBottom: 16
            }}>
              {/* Sleek Edit Button */}
              <TouchableOpacity
                onPress={() => router.push('/edit-profile')}
                style={{
                  backgroundColor: 'rgba(255, 255, 255, 0.06)',
                  paddingVertical: 10,
                  paddingHorizontal: 24,
                  borderRadius: 20,
                  borderWidth: 0.5,
                  borderColor: 'rgba(255, 255, 255, 0.1)',
                  flex: 1
                }}
              >
                <Text style={{
                  color: '#ffffff',
                  fontSize: 14,
                  fontWeight: '500',
                  letterSpacing: 0.2,
                  textAlign: 'center'
                }}>
                  Edit Profile
                </Text>
              </TouchableOpacity>
            </View>

          </View>
        </View>

        {/* Tab Navigation */}
        <View style={{
          flexDirection: 'row',
          paddingHorizontal: 24,
          marginBottom: 12
        }}>
          {tabs.map((tab, index) => {
            const isActive = index === activeTab;
            return (
              <TouchableOpacity
                key={tab}
                onPress={() => setActiveTab(index)}
                style={{
                  paddingBottom: 8,
                  borderBottomWidth: isActive ? 1 : 0,
                  borderBottomColor: '#ffffff',
                  flex: 1,
                  alignItems: 'center'
                }}
              >
                <Text style={{
                  fontSize: 14,
                  fontWeight: isActive ? '600' : '400',
                  color: isActive ? '#ffffff' : 'rgba(255, 255, 255, 0.5)'
                }} numberOfLines={1}>
                  {tab}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Tab Content */}
        <View style={{ paddingHorizontal: 24, flex: 1 }}>
          {activeTab === 0 && (
            /* Activity Tab - Combined betting activity with filters */
            <View>
              <Text style={{
                fontSize: 16,
                fontWeight: '600',
                color: '#ffffff',
                marginBottom: 16
              }}>
                Betting Activity
              </Text>
              
              {/* Filter Buttons */}
              <View style={{
                flexDirection: 'row',
                marginBottom: 20,
                gap: 8
              }}>
                {['All', 'Won', 'Lost', 'Active'].map((filter) => (
                  <TouchableOpacity
                    key={filter}
                    style={{
                      backgroundColor: filter === 'All' ? '#00D4AA' : 'rgba(255, 255, 255, 0.08)',
                      paddingHorizontal: 16,
                      paddingVertical: 8,
                      borderRadius: 16
                    }}
                  >
                    <Text style={{
                      color: filter === 'All' ? '#000000' : '#ffffff',
                      fontSize: 13,
                      fontWeight: '600'
                    }}>
                      {filter}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Activity Items */}
              {[
                { type: 'won', game: 'Lakers vs Warriors', amount: '+$125', time: '2 hours ago', status: 'completed' },
                { type: 'active', game: 'Celtics vs Heat', amount: '$75', time: '1 day left', status: 'active' },
                { type: 'lost', game: 'Bulls vs Nets', amount: '-$50', time: '3 hours ago', status: 'completed' },
                { type: 'won', game: 'Knicks vs 76ers', amount: '+$200', time: '1 day ago', status: 'completed' },
                { type: 'active', game: 'Clippers vs Nuggets', amount: '$100', time: '2 days left', status: 'active' }
              ].map((item, index) => (
                <View key={index} style={{
                  backgroundColor: 'rgba(255, 255, 255, 0.03)',
                  padding: 16,
                  borderRadius: 8,
                  marginBottom: 12,
                  borderLeftWidth: 3,
                  borderLeftColor: 
                    item.type === 'won' ? '#00D4AA' : 
                    item.type === 'lost' ? '#EF4444' : 
                    '#FFB800'
                }}>
                  <View style={{
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: 8
                  }}>
                    <Text style={{
                      fontSize: 15,
                      fontWeight: '600',
                      color: '#ffffff'
                    }}>
                      {item.game}
                    </Text>
                    <Text style={{
                      fontSize: 14,
                      fontWeight: '600',
                      color: 
                        item.type === 'won' ? '#00D4AA' : 
                        item.type === 'lost' ? '#EF4444' : 
                        '#ffffff'
                    }}>
                      {item.amount}
                    </Text>
                  </View>
                  <View style={{
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}>
                    <Text style={{
                      fontSize: 13,
                      color: 'rgba(255, 255, 255, 0.5)'
                    }}>
                      {item.time}
                    </Text>
                    <View style={{
                      backgroundColor: 
                        item.status === 'active' ? 'rgba(255, 184, 0, 0.2)' : 
                        'rgba(255, 255, 255, 0.1)',
                      paddingHorizontal: 8,
                      paddingVertical: 2,
                      borderRadius: 4
                    }}>
                      <Text style={{
                        fontSize: 11,
                        fontWeight: '600',
                        color: 
                          item.status === 'active' ? '#FFB800' : 
                          'rgba(255, 255, 255, 0.6)',
                        textTransform: 'uppercase'
                      }}>
                        {item.status}
                      </Text>
                    </View>
                  </View>
                </View>
              ))}
            </View>
          )}

          {activeTab === 1 && (
            /* Stats Tab - Comprehensive betting statistics */
            <View>
              <Text style={{
                fontSize: 16,
                fontWeight: '600',
                color: '#ffffff',
                marginBottom: 16
              }}>
                Betting Performance
              </Text>
              
              {/* Performance Overview Cards */}
              <View style={{
                flexDirection: 'row',
                marginBottom: 20,
                gap: 12
              }}>
                <View style={{
                  flex: 1,
                  backgroundColor: 'rgba(0, 212, 170, 0.1)',
                  padding: 16,
                  borderRadius: 12,
                  borderWidth: 1,
                  borderColor: 'rgba(0, 212, 170, 0.2)'
                }}>
                  <Text style={{
                    fontSize: 20,
                    fontWeight: '700',
                    color: '#00D4AA',
                    marginBottom: 4
                  }}>
                    {formatPercentage(userStats?.winRate ? userStats.winRate * 100 : 0)}
                  </Text>
                  <Text style={{
                    fontSize: 13,
                    color: 'rgba(255, 255, 255, 0.7)'
                  }}>
                    Win Rate
                  </Text>
                </View>
                
                <View style={{
                  flex: 1,
                  backgroundColor: 'rgba(255, 255, 255, 0.03)',
                  padding: 16,
                  borderRadius: 12
                }}>
                  <Text style={{
                    fontSize: 20,
                    fontWeight: '700',
                    color: '#ffffff',
                    marginBottom: 4
                  }}>
                    {formatNumber(userStats?.totalGames)}
                  </Text>
                  <Text style={{
                    fontSize: 13,
                    color: 'rgba(255, 255, 255, 0.7)'
                  }}>
                    Total Bets
                  </Text>
                </View>
              </View>
              
              {/* Win/Loss Summary */}
              <View style={{
                flexDirection: 'row',
                marginBottom: 20,
                gap: 12
              }}>
                <View style={{
                  flex: 1,
                  backgroundColor: 'rgba(0, 212, 170, 0.05)',
                  padding: 16,
                  borderRadius: 12,
                  alignItems: 'center'
                }}>
                  <Text style={{
                    fontSize: 24,
                    fontWeight: '700',
                    color: '#00D4AA',
                    marginBottom: 4
                  }}>
                    {formatNumber(userStats?.winCount)}
                  </Text>
                  <Text style={{
                    fontSize: 13,
                    color: 'rgba(255, 255, 255, 0.7)'
                  }}>
                    Wins
                  </Text>
                </View>
                
                <View style={{
                  flex: 1,
                  backgroundColor: 'rgba(239, 68, 68, 0.05)',
                  padding: 16,
                  borderRadius: 12,
                  alignItems: 'center'
                }}>
                  <Text style={{
                    fontSize: 24,
                    fontWeight: '700',
                    color: '#EF4444',
                    marginBottom: 4
                  }}>
                    {formatNumber(userStats?.lossCount)}
                  </Text>
                  <Text style={{
                    fontSize: 13,
                    color: 'rgba(255, 255, 255, 0.7)'
                  }}>
                    Losses
                  </Text>
                </View>
              </View>

              {/* Detailed Stats */}
              <View style={{
                backgroundColor: 'rgba(255, 255, 255, 0.03)',
                borderRadius: 12,
                padding: 16,
                marginBottom: 20
              }}>
                <Text style={{
                  fontSize: 15,
                  fontWeight: '600',
                  color: '#ffffff',
                  marginBottom: 16
                }}>
                  Detailed Statistics
                </Text>
                
                {[
                  { label: 'Wins', value: formatNumber(userStats?.winCount), color: '#00D4AA' },
                  { label: 'Losses', value: formatNumber(userStats?.lossCount), color: '#EF4444' },
                  { label: 'Win Rate', value: formatPercentage(userStats?.winRate ? userStats.winRate * 100 : 0), color: '#00D4AA' },
                  { label: 'Total Games', value: formatNumber(userStats?.totalGames), color: '#ffffff' },
                  { label: 'Longest Streak', value: formatNumber(userStats?.longestStreak), color: '#00D4AA' },
                  { label: 'Current Streak', value: formatNumber(userStats?.currentStreak), color: '#FFB800' }
                ].map((stat, index) => (
                  <View key={index} style={{
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    paddingVertical: 8,
                    borderBottomWidth: index < 5 ? 0.5 : 0,
                    borderBottomColor: 'rgba(255, 255, 255, 0.1)'
                  }}>
                    <Text style={{
                      fontSize: 14,
                      color: 'rgba(255, 255, 255, 0.8)'
                    }}>
                      {stat.label}
                    </Text>
                    <Text style={{
                      fontSize: 14,
                      fontWeight: '600',
                      color: stat.color
                    }}>
                      {stat.value}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {activeTab === 2 && (
            /* Achievements Tab */
            <View>
              <Text style={{
                fontSize: 16,
                fontWeight: '600',
                color: '#ffffff',
                marginBottom: 16
              }}>
                Achievements
              </Text>
              
              <View style={{
                flexDirection: 'row',
                flexWrap: 'wrap',
                gap: 12
              }}>
                {[
                  { title: 'First Win', desc: 'Won your first bet', color: '#FFD700' },
                  { title: 'Hot Streak', desc: '5 wins in a row', color: '#FF6B6B' },
                  { title: 'Big Winner', desc: 'Won $1000+ in a bet', color: '#4ECDC4' },
                  { title: 'Social Star', desc: '100+ friends', color: '#45B7D1' }
                ].map((achievement, index) => (
                  <View key={index} style={{
                    backgroundColor: 'rgba(255, 255, 255, 0.03)',
                    padding: 16,
                    borderRadius: 12,
                    width: '47%',
                    alignItems: 'center'
                  }}>
                    <View style={{
                      width: 40,
                      height: 40,
                      borderRadius: 20,
                      backgroundColor: achievement.color,
                      marginBottom: 12,
                      justifyContent: 'center',
                      alignItems: 'center'
                    }}>
                      <Text style={{ fontSize: 18 }}>🏆</Text>
                    </View>
                    <Text style={{
                      fontSize: 14,
                      fontWeight: '600',
                      color: '#ffffff',
                      textAlign: 'center',
                      marginBottom: 4
                    }}>
                      {achievement.title}
                    </Text>
                    <Text style={{
                      fontSize: 12,
                      color: 'rgba(255, 255, 255, 0.5)',
                      textAlign: 'center'
                    }}>
                      {achievement.desc}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          )}

        </View>

      </ScrollView>
    </View>
  );
}