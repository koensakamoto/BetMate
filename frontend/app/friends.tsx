import React, { useState } from 'react';
import { Text, View, TouchableOpacity, ScrollView, StatusBar, Image, TextInput } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';

const icon = require("../assets/images/icon.png");

export default function Friends() {
  const insets = useSafeAreaInsets();
  // Single friends view - no tabs needed
  const [searchQuery, setSearchQuery] = useState('');
  
  const friends = [
    { id: '1', username: 'mikeJohnson', name: 'Mike Johnson', isFriend: true },
    { id: '2', username: 'sarahGamer', name: 'Sarah Chen', isFriend: true },
    { id: '3', username: 'alexBets', name: 'Alex Rodriguez', isFriend: true },
    { id: '4', username: 'emilyWins', name: 'Emily Davis', isFriend: true },
    { id: '5', username: 'chrisPlay', name: 'Chris Wilson', isFriend: true },
    { id: '6', username: 'jessicaLuck', name: 'Jessica Brown', isFriend: true },
    { id: '7', username: 'davidCards', name: 'David Martinez', isFriend: true },
    { id: '8', username: 'lisaWinner', name: 'Lisa Anderson', isFriend: true },
    { id: '9', username: 'gameMaster', name: 'Ryan Garcia', isFriend: true },
    { id: '10', username: 'betQueen', name: 'Amanda White', isFriend: true },
  ];

  const currentList = friends;
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

      {/* Friends Badge */}
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
                Friends
              </Text>
            </View>
          </View>
          
          {/* Friends Count */}
          <View style={{
            marginBottom: 16,
            alignItems: 'center'
          }}>
            <Text style={{
              fontSize: 16,
              fontWeight: '600',
              color: '#ffffff'
            }}>
              {friends.length} friends
            </Text>
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
              placeholder="Search friends"
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