import React from 'react';
import { Text, View, TouchableOpacity } from 'react-native';

interface GroupStatsTabProps {
  groupData: {
    memberCount: number;
    totalBets: number;
    userPosition: number;
    groupAchievements: number;
  };
}

const GroupStatsTab: React.FC<GroupStatsTabProps> = ({ groupData }) => {
  return (
    <View>
      {/* Your Performance Card */}
      <View style={{
        backgroundColor: 'rgba(0, 212, 170, 0.08)',
        borderWidth: 1,
        borderColor: 'rgba(0, 212, 170, 0.2)',
        borderRadius: 16,
        padding: 20,
        marginBottom: 20
      }}>
        <View style={{
          flexDirection: 'row',
          alignItems: 'center',
          marginBottom: 16
        }}>
          <View style={{
            width: 8,
            height: 8,
            borderRadius: 4,
            backgroundColor: '#00D4AA',
            marginRight: 8
          }}></View>
          <Text style={{
            fontSize: 16,
            fontWeight: '600',
            color: '#00D4AA'
          }}>
            Your Performance
          </Text>
        </View>

        <View style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <View>
            <Text style={{
              fontSize: 32,
              fontWeight: '800',
              color: '#ffffff',
              marginBottom: 4
            }}>
              #{groupData.userPosition}
            </Text>
            <Text style={{
              fontSize: 14,
              color: 'rgba(255, 255, 255, 0.7)'
            }}>
              Group Ranking
            </Text>
          </View>

          <View style={{
            alignItems: 'flex-end'
          }}>
            <Text style={{
              fontSize: 24,
              fontWeight: '700',
              color: '#00D4AA',
              marginBottom: 2
            }}>
              {Math.round(100 - (groupData.userPosition / groupData.memberCount) * 100)}%
            </Text>
            <Text style={{
              fontSize: 12,
              color: 'rgba(255, 255, 255, 0.6)'
            }}>
              Better than others
            </Text>
          </View>
        </View>
      </View>

      {/* Group Overview */}
      <View style={{
        backgroundColor: 'rgba(255, 255, 255, 0.03)',
        borderRadius: 16,
        padding: 20,
        marginBottom: 20,
        borderWidth: 0.5,
        borderColor: 'rgba(255, 255, 255, 0.08)'
      }}>
        <Text style={{
          fontSize: 16,
          fontWeight: '600',
          color: '#ffffff',
          marginBottom: 16
        }}>
          Group Overview
        </Text>

        <View style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          marginBottom: 16
        }}>
          <View style={{ flex: 1 }}>
            <Text style={{
              fontSize: 24,
              fontWeight: '700',
              color: '#ffffff',
              marginBottom: 4
            }}>
              {groupData.totalBets}
            </Text>
            <Text style={{
              fontSize: 13,
              color: 'rgba(255, 255, 255, 0.6)'
            }}>
              Total Bets Placed
            </Text>
          </View>

          <View style={{ flex: 1 }}>
            <Text style={{
              fontSize: 24,
              fontWeight: '700',
              color: '#ffffff',
              marginBottom: 4
            }}>
              {groupData.memberCount}
            </Text>
            <Text style={{
              fontSize: 13,
              color: 'rgba(255, 255, 255, 0.6)'
            }}>
              Active Members
            </Text>
          </View>

          <View style={{ flex: 1 }}>
            <Text style={{
              fontSize: 24,
              fontWeight: '700',
              color: '#ffffff',
              marginBottom: 4
            }}>
              {groupData.groupAchievements}
            </Text>
            <Text style={{
              fontSize: 13,
              color: 'rgba(255, 255, 255, 0.6)'
            }}>
              Achievements
            </Text>
          </View>
        </View>

        <View style={{
          backgroundColor: 'rgba(255, 255, 255, 0.05)',
          paddingVertical: 12,
          paddingHorizontal: 16,
          borderRadius: 8,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <Text style={{
            fontSize: 14,
            color: 'rgba(255, 255, 255, 0.8)',
            fontWeight: '500'
          }}>
            Group Activity Level
          </Text>
          <View style={{
            backgroundColor: '#00D4AA',
            paddingHorizontal: 12,
            paddingVertical: 4,
            borderRadius: 12
          }}>
            <Text style={{
              fontSize: 12,
              fontWeight: '600',
              color: '#000000'
            }}>
              Very Active
            </Text>
          </View>
        </View>
      </View>

      {/* Leaderboard Preview */}
      <View style={{
        backgroundColor: 'rgba(255, 255, 255, 0.03)',
        borderRadius: 16,
        padding: 20,
        marginBottom: 20,
        borderWidth: 0.5,
        borderColor: 'rgba(255, 255, 255, 0.08)'
      }}>
        <Text style={{
          fontSize: 16,
          fontWeight: '600',
          color: '#ffffff',
          marginBottom: 16
        }}>
          Top Performers
        </Text>

        {/* Mock leaderboard entries */}
        {[
          { name: 'Alex', position: 1, score: 247 },
          { name: 'Sarah', position: 2, score: 189 },
          { name: 'You', position: groupData.userPosition, score: 156, isUser: true },
          { name: 'Mike', position: 4, score: 134 }
        ].slice(0, 3).map((player, index) => (
          <View key={index} style={{
            flexDirection: 'row',
            alignItems: 'center',
            paddingVertical: 12,
            backgroundColor: player.isUser ? 'rgba(0, 212, 170, 0.1)' : 'transparent',
            paddingHorizontal: player.isUser ? 12 : 0,
            borderRadius: player.isUser ? 8 : 0,
            marginBottom: index < 2 ? 8 : 0
          }}>
            <View style={{
              width: 32,
              height: 32,
              borderRadius: 16,
              backgroundColor: player.position === 1 ? '#FFD700' : player.position === 2 ? '#C0C0C0' : player.position === 3 ? '#CD7F32' : 'rgba(255, 255, 255, 0.1)',
              justifyContent: 'center',
              alignItems: 'center',
              marginRight: 12
            }}>
              <Text style={{
                fontSize: 14,
                fontWeight: '700',
                color: player.position <= 3 ? '#000000' : '#ffffff'
              }}>
                {player.position}
              </Text>
            </View>

            <View style={{ flex: 1 }}>
              <Text style={{
                fontSize: 15,
                fontWeight: '600',
                color: player.isUser ? '#00D4AA' : '#ffffff',
                marginBottom: 2
              }}>
                {player.name}
              </Text>
            </View>

            <Text style={{
              fontSize: 16,
              fontWeight: '700',
              color: '#ffffff'
            }}>
              {player.score}
            </Text>
          </View>
        ))}

        <TouchableOpacity style={{
          backgroundColor: 'rgba(255, 255, 255, 0.08)',
          paddingVertical: 14,
          borderRadius: 8,
          marginTop: 16,
          alignItems: 'center'
        }}>
          <Text style={{
            color: '#ffffff',
            fontSize: 14,
            fontWeight: '600'
          }}>
            View Full Leaderboard
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default GroupStatsTab;