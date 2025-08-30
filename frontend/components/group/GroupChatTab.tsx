import React from 'react';
import { Text, View, ScrollView, Image, TouchableOpacity, TextInput } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface GroupChatTabProps {
  groupData: {
    name: string;
    memberCount: number;
    createdDate: string;
    image: any;
  };
}

const GroupChatTab: React.FC<GroupChatTabProps> = ({ groupData }) => {
  const insets = useSafeAreaInsets();

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

  return (
    <View style={{ flex: 1 }}>
      {/* Chat Messages - Scrollable */}
      <ScrollView 
        style={{ flex: 1 }} 
        contentContainerStyle={{ 
          paddingHorizontal: 20,
          paddingBottom: 16,
          paddingTop: 8
        }}
        showsVerticalScrollIndicator={false}
      >
        {recentActivity.map((activity, index) => (
          <View key={activity.id} style={{
            flexDirection: 'row',
            marginBottom: index === recentActivity.length - 1 ? 8 : 16,
            alignItems: 'flex-start'
          }}>
            {/* User Avatar */}
            <View style={{
              width: 36,
              height: 36,
              borderRadius: 18,
              backgroundColor: 'rgba(255, 255, 255, 0.12)',
              justifyContent: 'center',
              alignItems: 'center',
              marginRight: 12
            }}>
              <Text style={{
                fontSize: 15,
                fontWeight: '700',
                color: '#ffffff'
              }}>
                {activity.user.charAt(0)}
              </Text>
            </View>
            
            {/* Message Bubble */}
            <View style={{ flex: 1 }}>
              <View style={{
                backgroundColor: activity.type === 'message' 
                  ? 'rgba(255, 255, 255, 0.08)' 
                  : activity.type === 'bet'
                    ? 'rgba(0, 212, 170, 0.12)'
                    : 'rgba(255, 255, 255, 0.06)',
                paddingHorizontal: 14,
                paddingVertical: 10,
                borderRadius: 16,
                maxWidth: '80%',
                borderWidth: activity.type === 'bet' ? 1 : 0,
                borderColor: activity.type === 'bet' ? 'rgba(0, 212, 170, 0.3)' : 'transparent'
              }}>
                <View style={{
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: 2
                }}>
                  <Text style={{
                    fontSize: 13,
                    fontWeight: '600',
                    color: activity.type === 'bet' ? '#00D4AA' : '#ffffff'
                  }}>
                    {activity.user}
                  </Text>
                  <Text style={{
                    fontSize: 11,
                    color: 'rgba(255, 255, 255, 0.5)'
                  }}>
                    {activity.timestamp}
                  </Text>
                </View>
                <Text style={{
                  fontSize: 15,
                  color: 'rgba(255, 255, 255, 0.95)',
                  lineHeight: 20
                }}>
                  {activity.content}
                </Text>
              </View>
            </View>
          </View>
        ))}
        <View style={{ paddingBottom: insets.bottom + 16 }} />
      </ScrollView>

      {/* Chat Input - Fixed at Bottom */}
      <View style={{
        paddingHorizontal: 20,
        paddingBottom: insets.bottom + 12,
        paddingTop: 12,
        backgroundColor: '#0a0a0f',
        borderTopWidth: 1,
        borderTopColor: 'rgba(255, 255, 255, 0.08)'
      }}>
        <View style={{
          flexDirection: 'row',
          alignItems: 'center',
          backgroundColor: 'rgba(255, 255, 255, 0.05)',
          borderRadius: 12,
          paddingHorizontal: 16,
          paddingVertical: 10,
          borderWidth: 1,
          borderColor: 'rgba(255, 255, 255, 0.1)'
        }}>
          <TextInput
            style={{
              flex: 1,
              fontSize: 16,
              color: '#ffffff',
              paddingVertical: 4
            }}
            placeholder="Type a message..."
            placeholderTextColor="rgba(255, 255, 255, 0.4)"
            multiline={false}
          />
          <TouchableOpacity style={{
            marginLeft: 12,
            paddingHorizontal: 16,
            paddingVertical: 6,
            backgroundColor: '#00D4AA',
            borderRadius: 8
          }}>
            <Text style={{
              color: '#000000',
              fontSize: 15,
              fontWeight: '700'
            }}>
              Send
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

export default GroupChatTab;