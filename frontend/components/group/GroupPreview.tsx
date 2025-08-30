import React from 'react';
import { Text, View, ScrollView, Image, TouchableOpacity, StatusBar } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';

interface GroupPreviewProps {
  groupData: {
    id: string | string[];
    name: string;
    description: string;
    memberCount: number;
    createdDate: string;
    image: any;
    totalBets: number;
  };
}

const GroupPreview: React.FC<GroupPreviewProps> = ({ groupData }) => {
  const insets = useSafeAreaInsets();

  return (
    <View style={{ flex: 1, backgroundColor: '#0a0a0f' }}>
      <StatusBar
        barStyle="light-content"
        backgroundColor="#0a0a0f"
        translucent={true}
      />
      
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingTop: insets.top + 16 }}>
        {/* Header */}
        <View style={{
          paddingHorizontal: 20,
          marginBottom: 32
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

          {/* Group Preview */}
          <View style={{
            alignItems: 'center',
            marginBottom: 32
          }}>
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
            
            <Text style={{
              fontSize: 16,
              color: 'rgba(255, 255, 255, 0.7)',
              textAlign: 'center',
              marginBottom: 16,
              paddingHorizontal: 20,
              lineHeight: 22
            }}>
              {groupData.description}
            </Text>
            
            <Text style={{
              fontSize: 14,
              color: 'rgba(255, 255, 255, 0.6)',
              textAlign: 'center'
            }}>
              {groupData.memberCount} members • Created {groupData.createdDate}
            </Text>
          </View>

          {/* Join Button */}
          <TouchableOpacity style={{
            backgroundColor: '#00D4AA',
            paddingVertical: 16,
            borderRadius: 12,
            marginBottom: 24
          }}>
            <Text style={{
              color: '#000000',
              fontSize: 18,
              fontWeight: '700',
              textAlign: 'center'
            }}>
              Join Group
            </Text>
          </TouchableOpacity>

          {/* Group Stats Preview */}
          <View style={{
            backgroundColor: 'rgba(255, 255, 255, 0.03)',
            borderRadius: 16,
            padding: 20,
            borderWidth: 0.5,
            borderColor: 'rgba(255, 255, 255, 0.08)'
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
                  {groupData.memberCount}
                </Text>
                <Text style={{
                  fontSize: 12,
                  color: 'rgba(255, 255, 255, 0.6)',
                  textAlign: 'center'
                }}>
                  Members
                </Text>
              </View>
              
              <View style={{ alignItems: 'center' }}>
                <Text style={{
                  fontSize: 24,
                  fontWeight: '700',
                  color: '#00D4AA',
                  marginBottom: 4
                }}>
                  Active
                </Text>
                <Text style={{
                  fontSize: 12,
                  color: 'rgba(255, 255, 255, 0.6)',
                  textAlign: 'center'
                }}>
                  Status
                </Text>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

export default GroupPreview;