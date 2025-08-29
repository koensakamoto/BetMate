import { Text, View, ScrollView, Image, TouchableOpacity, StatusBar } from "react-native";
import { useState } from "react";
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';

const icon = require("../../../assets/images/icon.png");

export default function GroupDetails() {
  const { groupId } = useLocalSearchParams();
  const insets = useSafeAreaInsets();
  
  // Mock data based on groupId - replace with actual API call
  const getGroupData = (id: string | string[]) => {
    const groups: { [key: string]: any } = {
      "1": { name: "Elite Squad", description: "Your main gaming crew", memberCount: 12, totalBets: 47, userPosition: 3 },
      "2": { name: "Weekend Warriors", description: "Casual weekend gaming sessions", memberCount: 8, totalBets: 23, userPosition: 2 },
      "3": { name: "Strategy Masters", description: "Advanced tactics and competitive play", memberCount: 15, totalBets: 65, userPosition: 7 },
      "4": { name: "Night Owls", description: "Late night gaming sessions", memberCount: 6, totalBets: 18, userPosition: 1 },
    };
    const groupId = Array.isArray(id) ? id[0] : id;
    return groups[groupId] || groups["1"];
  };

  const baseData = getGroupData(groupId);
  const groupData = {
    id: groupId,
    name: baseData.name,
    description: baseData.description,
    memberCount: baseData.memberCount,
    createdDate: "March 2024",
    isAdmin: false,
    isMember: true,
    image: icon,
    totalBets: baseData.totalBets,
    userPosition: baseData.userPosition,
    groupAchievements: 8
  };

  const recentActivity = [
    {
      id: 1,
      type: "message",
      user: "Alex",
      content: "Who's ready for tonight's tournament?",
      timestamp: "2 min ago"
    },
    {
      id: 2,
      type: "bet",
      user: "Sarah",
      content: "Created a new bet: Team Alpha vs Team Beta",
      timestamp: "15 min ago"
    },
    {
      id: 3,
      type: "join",
      user: "Mike",
      content: "joined the group",
      timestamp: "1 hour ago"
    }
  ];

  const activeBets = [
    {
      id: 1,
      title: "Team Alpha vs Team Beta",
      description: "Championship finals match",
      participants: 8,
      endTime: "2 hours left",
      userParticipated: false
    },
    {
      id: 2,
      title: "Weekend Tournament Winner",
      description: "Who will take the crown?",
      participants: 12,
      endTime: "1 day left",
      userParticipated: true
    }
  ];

  return (
    <View style={{ flex: 1, backgroundColor: '#0a0a0f' }}>
      <StatusBar
        barStyle="light-content"
        backgroundColor="#0a0a0f"
        translucent={true}
      />
      
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingTop: insets.top }}>
        {/* Header Section */}
        <View style={{
          padding: 20,
          borderBottomWidth: 0.5,
          borderBottomColor: 'rgba(255, 255, 255, 0.1)',
          marginBottom: 24
        }}>
          {/* Back Button */}
          <TouchableOpacity 
            onPress={() => router.back()}
            style={{
              position: 'absolute',
              top: 20,
              left: 20,
              zIndex: 1,
              padding: 8
            }}
          >
            <Text style={{ fontSize: 18, color: '#ffffff' }}>←</Text>
          </TouchableOpacity>

          {/* Group Info */}
          <View style={{ alignItems: 'center', marginTop: 16 }}>
            <Image 
              source={groupData.image} 
              style={{
                width: 80,
                height: 80,
                borderRadius: 20,
                marginBottom: 16
              }}
            />
            
            <Text style={{
              fontSize: 24,
              fontWeight: '700',
              color: '#ffffff',
              marginBottom: 8,
              textAlign: 'center'
            }}>
              {groupData.name}
            </Text>
            
            <View style={{
              backgroundColor: 'rgba(0, 212, 170, 0.15)',
              paddingHorizontal: 12,
              paddingVertical: 4,
              borderRadius: 12,
              marginBottom: 8
            }}>
              <Text style={{
                fontSize: 12,
                color: '#00D4AA',
                fontWeight: '600'
              }}>
                Active Member
              </Text>
            </View>
            
            <Text style={{
              fontSize: 14,
              color: 'rgba(255, 255, 255, 0.6)',
              textAlign: 'center'
            }}>
              {groupData.memberCount} members • {groupData.createdDate}
            </Text>
          </View>
        </View>

        {/* Primary Actions */}
        <View style={{
          flexDirection: 'row',
          paddingHorizontal: 20,
          marginBottom: 32,
          justifyContent: 'space-between'
        }}>
          <TouchableOpacity style={{
            backgroundColor: '#00D4AA',
            flex: 1,
            paddingVertical: 12,
            borderRadius: 12,
            marginRight: 8
          }}>
            <Text style={{
              color: '#000000',
              fontSize: 16,
              fontWeight: '600',
              textAlign: 'center'
            }}>💬 Chat</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={{
            backgroundColor: 'rgba(255, 255, 255, 0.08)',
            flex: 1,
            paddingVertical: 12,
            borderRadius: 12,
            marginHorizontal: 4
          }}>
            <Text style={{
              color: '#ffffff',
              fontSize: 16,
              fontWeight: '600',
              textAlign: 'center'
            }}>👥 Members</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={{
            backgroundColor: 'rgba(255, 255, 255, 0.08)',
            flex: 1,
            paddingVertical: 12,
            borderRadius: 12,
            marginLeft: 8
          }}>
            <Text style={{
              color: '#ffffff',
              fontSize: 16,
              fontWeight: '600',
              textAlign: 'center'
            }}>📤 Invite</Text>
          </TouchableOpacity>
        </View>

        <View style={{ paddingHorizontal: 20 }}>
          {/* Recent Activity */}
          <View style={{ marginBottom: 32 }}>
            <Text style={{
              fontSize: 18,
              fontWeight: '600',
              color: '#ffffff',
              marginBottom: 16
            }}>Recent Activity</Text>
            
            {recentActivity.map((activity) => (
              <View key={activity.id} style={{
                backgroundColor: 'rgba(255, 255, 255, 0.03)',
                padding: 16,
                borderRadius: 12,
                marginBottom: 12,
                borderWidth: 0.5,
                borderColor: 'rgba(255, 255, 255, 0.08)'
              }}>
                <View style={{
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start'
                }}>
                  <View style={{ flex: 1 }}>
                    <Text style={{
                      fontSize: 14,
                      color: '#ffffff',
                      marginBottom: 4
                    }}>
                      <Text style={{ fontWeight: '600' }}>{activity.user}</Text>
                      {activity.type === 'message' && (
                        <Text style={{ color: 'rgba(255, 255, 255, 0.7)' }}> said: </Text>
                      )}
                      {activity.type === 'bet' && (
                        <Text style={{ color: 'rgba(255, 255, 255, 0.7)' }}> </Text>
                      )}
                      {activity.type === 'join' && (
                        <Text style={{ color: 'rgba(255, 255, 255, 0.7)' }}> </Text>
                      )}
                    </Text>
                    <Text style={{
                      fontSize: 14,
                      color: 'rgba(255, 255, 255, 0.8)',
                      lineHeight: 18
                    }}>
                      {activity.content}
                    </Text>
                  </View>
                  <Text style={{
                    fontSize: 12,
                    color: 'rgba(255, 255, 255, 0.5)',
                    marginLeft: 12
                  }}>
                    {activity.timestamp}
                  </Text>
                </View>
              </View>
            ))}
          </View>

          {/* Active Bets */}
          <View style={{ marginBottom: 32 }}>
            <Text style={{
              fontSize: 18,
              fontWeight: '600',
              color: '#ffffff',
              marginBottom: 16
            }}>Active Group Bets</Text>
            
            {activeBets.map((bet) => (
              <View key={bet.id} style={{
                backgroundColor: 'rgba(255, 255, 255, 0.03)',
                padding: 16,
                borderRadius: 12,
                marginBottom: 12,
                borderWidth: 0.5,
                borderColor: 'rgba(255, 255, 255, 0.08)'
              }}>
                <Text style={{
                  fontSize: 16,
                  fontWeight: '600',
                  color: '#ffffff',
                  marginBottom: 4
                }}>
                  {bet.title}
                </Text>
                <Text style={{
                  fontSize: 14,
                  color: 'rgba(255, 255, 255, 0.7)',
                  marginBottom: 12,
                  lineHeight: 18
                }}>
                  {bet.description}
                </Text>
                <View style={{
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <View>
                    <Text style={{
                      fontSize: 12,
                      color: 'rgba(255, 255, 255, 0.6)'
                    }}>
                      {bet.participants} participants • {bet.endTime}
                    </Text>
                  </View>
                  <TouchableOpacity style={{
                    backgroundColor: bet.userParticipated ? 'rgba(0, 212, 170, 0.15)' : '#00D4AA',
                    paddingHorizontal: 16,
                    paddingVertical: 6,
                    borderRadius: 8
                  }}>
                    <Text style={{
                      fontSize: 13,
                      fontWeight: '600',
                      color: bet.userParticipated ? '#00D4AA' : '#000000'
                    }}>
                      {bet.userParticipated ? 'Participating' : 'Join Bet'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>

          {/* Group Stats */}
          <View style={{ marginBottom: 40 }}>
            <Text style={{
              fontSize: 18,
              fontWeight: '600',
              color: '#ffffff',
              marginBottom: 16
            }}>Group Stats</Text>
            
            <View style={{
              backgroundColor: 'rgba(255, 255, 255, 0.03)',
              padding: 20,
              borderRadius: 12,
              borderWidth: 0.5,
              borderColor: 'rgba(255, 255, 255, 0.08)'
            }}>
              <View style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                marginBottom: 16
              }}>
                <View style={{ alignItems: 'center' }}>
                  <Text style={{
                    fontSize: 24,
                    fontWeight: '700',
                    color: '#00D4AA',
                    marginBottom: 4
                  }}>
                    {groupData.totalBets}
                  </Text>
                  <Text style={{
                    fontSize: 12,
                    color: 'rgba(255, 255, 255, 0.6)',
                    textAlign: 'center'
                  }}>
                    Total Bets
                  </Text>
                </View>
                <View style={{ alignItems: 'center' }}>
                  <Text style={{
                    fontSize: 24,
                    fontWeight: '700',
                    color: '#00D4AA',
                    marginBottom: 4
                  }}>
                    #{groupData.userPosition}
                  </Text>
                  <Text style={{
                    fontSize: 12,
                    color: 'rgba(255, 255, 255, 0.6)',
                    textAlign: 'center'
                  }}>
                    Your Rank
                  </Text>
                </View>
                <View style={{ alignItems: 'center' }}>
                  <Text style={{
                    fontSize: 24,
                    fontWeight: '700',
                    color: '#00D4AA',
                    marginBottom: 4
                  }}>
                    {groupData.groupAchievements}
                  </Text>
                  <Text style={{
                    fontSize: 12,
                    color: 'rgba(255, 255, 255, 0.6)',
                    textAlign: 'center'
                  }}>
                    Achievements
                  </Text>
                </View>
              </View>
              
              <TouchableOpacity style={{
                backgroundColor: 'rgba(255, 255, 255, 0.08)',
                paddingVertical: 12,
                borderRadius: 8,
                marginTop: 8
              }}>
                <Text style={{
                  color: '#ffffff',
                  fontSize: 14,
                  fontWeight: '600',
                  textAlign: 'center'
                }}>
                  View Full Leaderboard
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}