import React, { useState } from 'react';
import { Text, View, ScrollView, TouchableOpacity } from 'react-native';

interface GroupBetsTabProps {
  groupData: {
    id: string | string[];
  };
}

const GroupBetsTab: React.FC<GroupBetsTabProps> = ({ groupData }) => {
  const [activeBetFilter, setActiveBetFilter] = useState('All');
  const betFilters = ['All', 'Open', 'In Progress', 'Closed', 'Won', 'Lost'];

  const allBets = [
    {
      id: 1,
      title: "Team Alpha vs Team Beta",
      description: "Championship finals match",
      participants: 8,
      endTime: "2 hours left",
      userParticipated: false,
      status: "Open"
    },
    {
      id: 2,
      title: "Weekend Tournament Winner",
      description: "Who will take the crown?",
      participants: 12,
      endTime: "1 day left",
      userParticipated: true,
      status: "In Progress"
    },
    {
      id: 3,
      title: "Friday Night Match",
      description: "Epic showdown between rivals",
      participants: 15,
      endTime: "Ended",
      userParticipated: true,
      status: "Won"
    },
    {
      id: 4,
      title: "League Championship",
      description: "Final round of the season",
      participants: 6,
      endTime: "Ended",
      userParticipated: true,
      status: "Lost"
    },
    {
      id: 5,
      title: "Mid-week Challenge",
      description: "Quick betting round",
      participants: 20,
      endTime: "Ended",
      userParticipated: false,
      status: "Closed"
    }
  ];

  const getFilteredBets = () => {
    if (activeBetFilter === 'All') return allBets;
    return allBets.filter(bet => bet.status === activeBetFilter);
  };

  return (
    <View>
      {/* Bet Filters */}
      <View style={{
        marginBottom: 20
      }}>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{
            paddingHorizontal: 0
          }}
        >
          <View style={{ 
            flexDirection: 'row',
            gap: 8
          }}>
            {betFilters.map((filter) => {
              const isActive = filter === activeBetFilter;
              return (
                <TouchableOpacity
                  key={filter}
                  onPress={() => setActiveBetFilter(filter)}
                  style={{
                    backgroundColor: isActive ? '#00D4AA' : 'rgba(255, 255, 255, 0.08)',
                    paddingHorizontal: 16,
                    paddingVertical: 8,
                    borderRadius: 20,
                    borderWidth: isActive ? 0 : 0.5,
                    borderColor: 'rgba(255, 255, 255, 0.15)',
                    minWidth: 60,
                    alignItems: 'center'
                  }}
                >
                  <Text style={{
                    color: isActive ? '#000000' : '#ffffff',
                    fontSize: 13,
                    fontWeight: '600'
                  }}>
                    {filter}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </ScrollView>
      </View>

      {getFilteredBets().map((bet) => (
        <View key={bet.id} style={{
          backgroundColor: 'rgba(255, 255, 255, 0.02)',
          borderWidth: 0.5,
          borderColor: 'rgba(255, 255, 255, 0.08)',
          borderRadius: 12,
          padding: 16,
          marginBottom: 12
        }}>
          {/* Bet Header */}
          <View style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            marginBottom: 12
          }}>
            <View style={{ flex: 1 }}>
              <Text style={{
                fontSize: 16,
                fontWeight: '600',
                color: '#ffffff',
                marginBottom: 4
              }}>
                {bet.title}
              </Text>
              <Text style={{
                fontSize: 13,
                color: 'rgba(255, 255, 255, 0.6)',
                lineHeight: 16
              }}>
                {bet.description}
              </Text>
            </View>
            
            {/* Status Badge */}
            <View style={{
              backgroundColor: 
                bet.status === 'Open' ? 'rgba(255, 255, 255, 0.08)' :
                bet.status === 'In Progress' ? 'rgba(0, 212, 170, 0.2)' :
                bet.status === 'Won' ? 'rgba(34, 197, 94, 0.2)' :
                bet.status === 'Lost' ? 'rgba(239, 68, 68, 0.2)' :
                'rgba(156, 163, 175, 0.2)',
              paddingHorizontal: 8,
              paddingVertical: 4,
              borderRadius: 8,
              marginLeft: 12
            }}>
              <Text style={{
                fontSize: 11,
                fontWeight: '600',
                color: 
                  bet.status === 'Open' ? 'rgba(255, 255, 255, 0.7)' :
                  bet.status === 'In Progress' ? '#00D4AA' :
                  bet.status === 'Won' ? '#22C55E' :
                  bet.status === 'Lost' ? '#EF4444' :
                  '#9CA3AF'
              }}>
                {bet.status.toUpperCase()}
              </Text>
            </View>
          </View>

          {/* Bet Stats */}
          <View style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginTop: 12
          }}>
            <Text style={{
              fontSize: 13,
              color: 'rgba(255, 255, 255, 0.6)'
            }}>
              {bet.participants} players • {bet.endTime}
            </Text>
            
            <TouchableOpacity style={{
              backgroundColor: 
                bet.status === 'Open' && !bet.userParticipated ? 'rgba(0, 212, 170, 0.15)' :
                'rgba(255, 255, 255, 0.08)',
              paddingHorizontal: 12,
              paddingVertical: 6,
              borderRadius: 8
            }}>
              <Text style={{
                fontSize: 12,
                fontWeight: '600',
                color: bet.status === 'Open' && !bet.userParticipated ? '#00D4AA' : '#ffffff'
              }}>
                {bet.status === 'Open' && !bet.userParticipated ? 'Join' :
                 bet.status === 'Open' && bet.userParticipated ? 'Joined' :
                 'View'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      ))}
    </View>
  );
};

export default GroupBetsTab;