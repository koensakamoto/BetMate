import { Text, View, Image, TouchableOpacity, ScrollView, StatusBar } from "react-native";
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useState } from 'react';
import { router } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';

const icon = require("../../assets/images/icon.png");

export default function Profile() {
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState(0);
  const tabs = ['Activity', 'Stats', 'Achievements'];

  return (
    <View style={{ flex: 1, backgroundColor: '#0a0a0f' }}>
      <StatusBar
        barStyle="light-content"
        backgroundColor="#0a0a0f"
        translucent={true}
      />
      
      <ScrollView 
        style={{ flex: 1 }} 
        contentContainerStyle={{ paddingTop: insets.top + 20, paddingBottom: insets.bottom + 20 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header Icons */}
        <View style={{ 
          flexDirection: 'row', 
          justifyContent: 'flex-end', 
          paddingHorizontal: 20, 
          marginBottom: 12,
          gap: 16 
        }}>
          {/* Notifications Icon */}
          <TouchableOpacity 
            onPress={() => router.push('/notifications')}
            style={{
            width: 40,
            height: 40,
            borderRadius: 20,
            backgroundColor: 'rgba(255, 255, 255, 0.08)',
            justifyContent: 'center',
            alignItems: 'center',
            position: 'relative'
          }}>
            <MaterialIcons 
              name="notifications-none" 
              size={20} 
              color="#ffffff" 
            />
            {/* Notification badge */}
            <View style={{
              position: 'absolute',
              top: 8,
              right: 8,
              width: 8,
              height: 8,
              borderRadius: 4,
              backgroundColor: '#EF4444'
            }} />
          </TouchableOpacity>

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

        {/* Sleek Header */}
        <View style={{ paddingHorizontal: 20, marginBottom: 16 }}>
          {/* Avatar & Basic Info */}
          <View style={{ alignItems: 'center', marginBottom: 24 }}>
            <View style={{ position: 'relative', marginBottom: 16 }}>
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
            
            <Text style={{ 
              fontSize: 20, 
              fontWeight: '500', 
              color: '#ffffff',
              marginBottom: 4
            }}>
              John Doe
            </Text>
            <Text style={{ 
              fontSize: 14, 
              color: 'rgba(255, 255, 255, 0.5)',
              marginBottom: 20
            }}>
              @johnbets2024
            </Text>

            {/* Inline Stats */}
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
                  1.2K
                </Text>
                <Text style={{ 
                  fontSize: 11, 
                  color: 'rgba(255, 255, 255, 0.4)',
                  textTransform: 'uppercase',
                  letterSpacing: 0.5
                }}>
                  Followers
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
                  color: '#ffffff',
                  marginBottom: 2
                }}>
                  120
                </Text>
                <Text style={{ 
                  fontSize: 11, 
                  color: 'rgba(255, 255, 255, 0.4)',
                  textTransform: 'uppercase',
                  letterSpacing: 0.5
                }}>
                  Following
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
                  85%
                </Text>
                <Text style={{ 
                  fontSize: 11, 
                  color: 'rgba(255, 255, 255, 0.4)',
                  textTransform: 'uppercase',
                  letterSpacing: 0.5
                }}>
                  Win Rate
                </Text>
              </View>
            </View>

            {/* Sleek Edit Button */}
            <TouchableOpacity style={{ 
              backgroundColor: 'rgba(255, 255, 255, 0.06)',
              paddingVertical: 10,
              paddingHorizontal: 24,
              borderRadius: 20,
              borderWidth: 0.5,
              borderColor: 'rgba(255, 255, 255, 0.1)'
            }}>
              <Text style={{ 
                color: '#ffffff', 
                fontSize: 14, 
                fontWeight: '500',
                letterSpacing: 0.2
              }}>
                Edit Profile
              </Text>
            </TouchableOpacity>
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
                Performance Stats
              </Text>
              
              {/* Performance Cards */}
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
                    $2,450
                  </Text>
                  <Text style={{
                    fontSize: 13,
                    color: 'rgba(255, 255, 255, 0.7)'
                  }}>
                    Total Profit
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
                    247
                  </Text>
                  <Text style={{
                    fontSize: 13,
                    color: 'rgba(255, 255, 255, 0.7)'
                  }}>
                    Total Bets
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
                  This Month
                </Text>
                
                {[
                  { label: 'Wins', value: '34', color: '#00D4AA' },
                  { label: 'Losses', value: '12', color: '#EF4444' },
                  { label: 'Win Rate', value: '74%', color: '#00D4AA' },
                  { label: 'Avg Bet', value: '$85', color: '#ffffff' },
                  { label: 'Best Win', value: '$450', color: '#00D4AA' },
                  { label: 'Current Streak', value: '5W', color: '#FFB800' }
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
                  { title: 'Social Star', desc: '100+ followers', color: '#45B7D1' }
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