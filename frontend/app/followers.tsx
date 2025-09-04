import React, { useState } from 'react';
import { Text, View, TouchableOpacity, ScrollView, StatusBar, Image, TextInput } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';

const icon = require("../assets/images/icon.png");

export default function Followers() {
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams();
const initialTab = params.tab === 'following' ? 'following' : 'followers';
  const [activeTab, setActiveTab] = useState<'followers' | 'following'>(initialTab);
  const [searchQuery, setSearchQuery] = useState('');
  
  const followers = [
    { id: '1', username: 'mikeJohnson', name: 'Mike Johnson', followers: '2.1K', isFollowing: false, followsYou: true },
    { id: '2', username: 'sarahGamer', name: 'Sarah Chen', followers: '892', isFollowing: true, followsYou: true },
    { id: '3', username: 'alexBets', name: 'Alex Rodriguez', followers: '1.5K', isFollowing: false, followsYou: true },
    { id: '4', username: 'emilyWins', name: 'Emily Davis', followers: '645', isFollowing: true, followsYou: true },
    { id: '5', username: 'chrisPlay', name: 'Chris Wilson', followers: '3.2K', isFollowing: false, followsYou: true },
    { id: '6', username: 'jessicaLuck', name: 'Jessica Brown', followers: '1.1K', isFollowing: true, followsYou: true },
    { id: '7', username: 'davidCards', name: 'David Martinez', followers: '789', isFollowing: false, followsYou: true },
    { id: '8', username: 'lisaWinner', name: 'Lisa Anderson', followers: '2.8K', isFollowing: true, followsYou: true },
    { id: '9', username: 'gameMaster', name: 'Ryan Garcia', followers: '1.8K', isFollowing: false, followsYou: true },
    { id: '10', username: 'betQueen', name: 'Amanda White', followers: '967', isFollowing: true, followsYou: true },
  ];

  const following = [
    { id: '1', username: 'proGamer2024', name: 'Tyler Adams', followers: '15K', isFollowing: true, followsYou: false },
    { id: '2', username: 'betMaster', name: 'Jordan Smith', followers: '8.5K', isFollowing: true, followsYou: true },
    { id: '3', username: 'luckyStreak', name: 'Morgan Taylor', followers: '4.2K', isFollowing: true, followsYou: false },
    { id: '4', username: 'winnerCircle', name: 'Casey Johnson', followers: '12K', isFollowing: true, followsYou: true },
    { id: '5', username: 'elitePlayer', name: 'Riley Chen', followers: '6.7K', isFollowing: true, followsYou: false },
    { id: '6', username: 'masterBetter', name: 'Sam Wilson', followers: '9.1K', isFollowing: true, followsYou: true },
    { id: '7', username: 'cardShark', name: 'Alex Thompson', followers: '3.8K', isFollowing: true, followsYou: false },
    { id: '8', username: 'bigWinner', name: 'Taylor Davis', followers: '11K', isFollowing: true, followsYou: true },
  ];

  const currentList = activeTab === 'followers' ? followers : following;
  const filteredList = currentList.filter(user => 
    user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.username.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const UserItem = ({ user }: { user: any }) => (
    <TouchableOpacity 
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 20,
        backgroundColor: 'rgba(255, 255, 255, 0.02)'
      }}
      activeOpacity={0.7}
    >
      {/* Avatar */}
      <View style={{ position: 'relative', marginRight: 12 }}>
        <Image 
          source={icon}
          style={{
            width: 44,
            height: 44,
            borderRadius: 22
          }}
        />
      </View>

      {/* User Info */}
      <View style={{ flex: 1, marginRight: 12 }}>
        <Text style={{
          fontSize: 15,
          fontWeight: '600',
          color: '#ffffff',
          marginBottom: 2
        }}>
          {user.username}
        </Text>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Text style={{
            fontSize: 14,
            color: 'rgba(255, 255, 255, 0.6)',
            marginRight: 8
          }}>
            {user.name}
          </Text>
        </View>
      </View>

      {/* Action Button / Status Badge */}
      {activeTab === 'followers' ? (
        // Followers tab: Follow Back button or Friends badge
        user.isFollowing ? (
          <View style={{ 
            alignItems: 'flex-end',
            justifyContent: 'center',
            minWidth: 100
          }}>
            <View style={{
              backgroundColor: 'rgba(255, 255, 255, 0.06)',
              paddingHorizontal: 10,
              paddingVertical: 6,
              borderRadius: 16,
              borderWidth: 0.5,
              borderColor: 'rgba(255, 255, 255, 0.15)'
            }}>
              <Text style={{
                fontSize: 12,
                color: 'rgba(255, 255, 255, 0.6)',
                fontWeight: '600',
                textAlign: 'center'
              }}>
                Friends
              </Text>
            </View>
          </View>
        ) : (
          <TouchableOpacity
            style={{
              backgroundColor: '#00D4AA',
              paddingVertical: 6,
              paddingHorizontal: 12,
              borderRadius: 16,
              minWidth: 80,
              alignItems: 'center'
            }}
          >
            <Text style={{
              fontSize: 12,
              fontWeight: '600',
              color: '#000000'
            }}>
              Follow Back
            </Text>
          </TouchableOpacity>
        )
      ) : (
        // Following tab: Friends or Following badge (both gray)
        <View style={{ 
          alignItems: 'flex-end',
          justifyContent: 'center',
          minWidth: 100
        }}>
          <View style={{
            backgroundColor: 'rgba(255, 255, 255, 0.06)',
            paddingHorizontal: 10,
            paddingVertical: 6,
            borderRadius: 16,
            borderWidth: 0.5,
            borderColor: 'rgba(255, 255, 255, 0.15)'
          }}>
            <Text style={{
              fontSize: 12,
              color: 'rgba(255, 255, 255, 0.6)',
              fontWeight: '600',
              textAlign: 'center'
            }}>
              {user.followsYou ? 'Friends' : 'Following'}
            </Text>
          </View>
        </View>
      )}
    </TouchableOpacity>
  );

  return (
    <View style={{ flex: 1, backgroundColor: '#0a0a0f' }}>
      <StatusBar
        barStyle="light-content"
        backgroundColor="#0a0a0f"
        translucent={true}
      />
      
      <View style={{ flex: 1 }}>
        {/* Header */}
        <View style={{
          paddingTop: insets.top + 20,
          paddingHorizontal: 20,
          paddingBottom: 16,
          borderBottomWidth: 0.5,
          borderBottomColor: 'rgba(255, 255, 255, 0.08)'
        }}>
          <View style={{
            flexDirection: 'row',
            alignItems: 'center',
            marginBottom: 20
          }}>
            <TouchableOpacity 
              onPress={() => router.back()}
              style={{
                width: 40,
                height: 40,
                borderRadius: 20,
                backgroundColor: 'rgba(255, 255, 255, 0.08)',
                justifyContent: 'center',
                alignItems: 'center',
                marginRight: 16
              }}
            >
              <MaterialIcons 
                name="arrow-back" 
                size={18} 
                color="#ffffff" 
              />
            </TouchableOpacity>
            
            <View>
              <Text style={{
                fontSize: 24,
                fontWeight: '600',
                color: '#ffffff'
              }}>
                John Doe
              </Text>
            </View>
          </View>
          
          {/* Tab Navigation */}
          <View style={{
            flexDirection: 'row',
            marginBottom: 16
          }}>
            <TouchableOpacity
              onPress={() => setActiveTab('followers')}
              style={{
                paddingBottom: 12,
                borderBottomWidth: activeTab === 'followers' ? 2 : 0,
                borderBottomColor: '#ffffff',
                flex: 1,
                alignItems: 'center'
              }}
            >
              <Text style={{
                fontSize: 16,
                fontWeight: activeTab === 'followers' ? '600' : '400',
                color: activeTab === 'followers' ? '#ffffff' : 'rgba(255, 255, 255, 0.5)'
              }}>
                1.2K followers
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              onPress={() => setActiveTab('following')}
              style={{
                paddingBottom: 12,
                borderBottomWidth: activeTab === 'following' ? 2 : 0,
                borderBottomColor: '#ffffff',
                flex: 1,
                alignItems: 'center'
              }}
            >
              <Text style={{
                fontSize: 16,
                fontWeight: activeTab === 'following' ? '600' : '400',
                color: activeTab === 'following' ? '#ffffff' : 'rgba(255, 255, 255, 0.5)'
              }}>
                120 following
              </Text>
            </TouchableOpacity>
          </View>

          {/* Search Bar */}
          <View style={{
            backgroundColor: 'rgba(255, 255, 255, 0.08)',
            borderRadius: 12,
            paddingHorizontal: 16,
            paddingVertical: 12,
            flexDirection: 'row',
            alignItems: 'center',
            marginBottom: 8
          }}>
            <MaterialIcons 
              name="search" 
              size={20} 
              color="rgba(255, 255, 255, 0.5)" 
              style={{ marginRight: 12 }}
            />
            <TextInput
              style={{
                flex: 1,
                fontSize: 16,
                color: '#ffffff',
                fontWeight: '400'
              }}
              placeholder={`Search ${activeTab}`}
              placeholderTextColor="rgba(255, 255, 255, 0.5)"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <MaterialIcons 
                  name="close" 
                  size={20} 
                  color="rgba(255, 255, 255, 0.5)" 
                />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Users List */}
        <ScrollView 
          style={{ flex: 1 }}
          showsVerticalScrollIndicator={false}
          contentInsetAdjustmentBehavior="automatic"
        >
          {filteredList.length > 0 ? (
            filteredList.map((user, index) => (
              <View key={user.id}>
                <UserItem user={user} />
                {index < filteredList.length - 1 && (
                  <View style={{
                    height: 0.5,
                    backgroundColor: 'rgba(255, 255, 255, 0.06)',
                    marginLeft: 76
                  }} />
                )}
              </View>
            ))
          ) : (
            <View style={{
              flex: 1,
              justifyContent: 'center',
              alignItems: 'center',
              paddingVertical: 60
            }}>
              <MaterialIcons 
                name="search-off" 
                size={48} 
                color="rgba(255, 255, 255, 0.3)"
                style={{ marginBottom: 16 }}
              />
              <Text style={{
                fontSize: 16,
                color: 'rgba(255, 255, 255, 0.4)',
                textAlign: 'center'
              }}>
                No users found
              </Text>
            </View>
          )}
          
          <View style={{ height: insets.bottom + 20 }} />
        </ScrollView>
      </View>
    </View>
  );
}