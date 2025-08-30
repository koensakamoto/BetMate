import React, { useState } from 'react';
import { Text, View, ScrollView, Image, TouchableOpacity, StatusBar } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import GroupChatTab from './GroupChatTab';
import GroupBetsTab from './GroupBetsTab';
import GroupStatsTab from './GroupStatsTab';
import GroupMembersTab from './GroupMembersTab';
import GroupSettingsTab from './GroupSettingsTab';

interface GroupMemberViewProps {
  groupData: {
    id: string | string[];
    name: string;
    description: string;
    memberCount: number;
    createdDate: string;
    image: any;
    totalBets: number;
    userPosition: number;
    groupAchievements: number;
  };
}

const GroupMemberView: React.FC<GroupMemberViewProps> = ({ groupData }) => {
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState(0);
  const tabs = ['Chat', 'Bets', 'Stats', 'People', 'Config'];

  return (
    <View style={{ flex: 1, backgroundColor: '#0a0a0f' }}>
      <StatusBar
        barStyle="light-content"
        backgroundColor="#0a0a0f"
        translucent={true}
      />
      
      {activeTab === 0 ? (
        /* Chat Tab - Full Screen Layout */
        <View style={{ flex: 1 }}>
          {/* Chat Header */}
          <View style={{ paddingTop: insets.top + 16 }}>
            {/* Header with Group Image */}
            <View style={{
              paddingHorizontal: 20,
              marginBottom: 24
            }}>
              {/* Back Button */}
              <TouchableOpacity 
                onPress={() => router.push('/(tabs)/group')}
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

              {/* Group Info with Image */}
              <View style={{
                flexDirection: 'row',
                alignItems: 'center'
              }}>
                <Image 
                  source={groupData.image} 
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: 12,
                    marginRight: 16
                  }}
                />
                
                <View style={{ flex: 1 }}>
                  <Text style={{
                    fontSize: 20,
                    fontWeight: '700',
                    color: '#ffffff',
                    marginBottom: 4
                  }}>
                    {groupData.name}
                  </Text>
                  
                  <Text style={{
                    fontSize: 14,
                    color: 'rgba(255, 255, 255, 0.6)'
                  }}>
                    {groupData.memberCount} members • {groupData.createdDate}
                  </Text>
                </View>

                {/* Invite Button */}
                <TouchableOpacity style={{
                  backgroundColor: 'rgba(255, 255, 255, 0.08)',
                  paddingHorizontal: 12,
                  paddingVertical: 8,
                  borderRadius: 8,
                  borderWidth: 0.5,
                  borderColor: 'rgba(255, 255, 255, 0.15)'
                }}>
                  <Text style={{
                    color: '#ffffff',
                    fontSize: 13,
                    fontWeight: '600'
                  }}>
                    Invite
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Clean Tab Navigation */}
            <View style={{
              flexDirection: 'row',
              marginBottom: 16,
              paddingLeft: 4,
              paddingRight: 12
            }}>
              {tabs.map((tab, index) => {
                const isActive = index === activeTab;
                return (
                  <TouchableOpacity
                    key={tab}
                    onPress={() => setActiveTab(index)}
                    style={{
                      paddingBottom: 8,
                      borderBottomWidth: isActive ? 2 : 0,
                      borderBottomColor: '#ffffff',
                      flex: 1,
                      alignItems: 'center'
                    }}
                  >
                    <Text style={{
                      fontSize: 14,
                      fontWeight: isActive ? '600' : '400',
                      color: isActive ? '#ffffff' : 'rgba(255, 255, 255, 0.6)'
                    }} numberOfLines={1}>
                      {tab}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Chat Tab Content */}
          <GroupChatTab groupData={groupData} />
        </View>
      ) : (
        /* Other Tabs - Original ScrollView Layout */
        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingTop: insets.top + 16 }}>
          {/* Header with Group Image */}
          <View style={{
            paddingHorizontal: 20,
            marginBottom: 24
          }}>
            {/* Back Button */}
            <TouchableOpacity 
              onPress={() => router.push('/(tabs)/group')}
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

            {/* Group Info with Image */}
            <View style={{
              flexDirection: 'row',
              alignItems: 'center'
            }}>
              <Image 
                source={groupData.image} 
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 12,
                  marginRight: 16
                }}
              />
              
              <View style={{ flex: 1 }}>
                <Text style={{
                  fontSize: 20,
                  fontWeight: '700',
                  color: '#ffffff',
                  marginBottom: 4
                }}>
                  {groupData.name}
                </Text>
                
                <Text style={{
                  fontSize: 14,
                  color: 'rgba(255, 255, 255, 0.6)'
                }}>
                  {groupData.memberCount} members • {groupData.createdDate}
                </Text>
              </View>

              {/* Invite Button */}
              <TouchableOpacity style={{
                backgroundColor: 'rgba(255, 255, 255, 0.08)',
                paddingHorizontal: 12,
                paddingVertical: 8,
                borderRadius: 8,
                borderWidth: 0.5,
                borderColor: 'rgba(255, 255, 255, 0.15)'
              }}>
                <Text style={{
                  color: '#ffffff',
                  fontSize: 13,
                  fontWeight: '600'
                }}>
                  Invite
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Clean Tab Navigation */}
          <View style={{
            flexDirection: 'row',
            marginBottom: 24,
            paddingLeft: 4,
            paddingRight: 12
          }}>
            {tabs.map((tab, index) => {
              const isActive = index === activeTab;
              return (
                <TouchableOpacity
                  key={tab}
                  onPress={() => setActiveTab(index)}
                  style={{
                    paddingBottom: 8,
                    borderBottomWidth: isActive ? 2 : 0,
                    borderBottomColor: '#ffffff',
                    flex: 1,
                    alignItems: 'center'
                  }}
                >
                  <Text style={{
                    fontSize: 14,
                    fontWeight: isActive ? '600' : '400',
                    color: isActive ? '#ffffff' : 'rgba(255, 255, 255, 0.6)'
                  }} numberOfLines={1}>
                    {tab}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <View style={{ paddingHorizontal: 20 }}>
            {/* Tab Content */}
            {activeTab === 1 && <GroupBetsTab groupData={groupData} />}
            {activeTab === 2 && <GroupStatsTab groupData={groupData} />}
            {activeTab === 3 && <GroupMembersTab groupData={groupData} />}
            {activeTab === 4 && <GroupSettingsTab groupData={groupData} />}

            {/* Additional spacing for scroll */}
            <View style={{ height: 60 }} />
          </View>
        </ScrollView>
      )}
    </View>
  );
};

export default GroupMemberView;