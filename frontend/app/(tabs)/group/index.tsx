import { Text, View, TouchableOpacity, ScrollView, Image, StatusBar, TextInput } from "react-native";
import { useState } from "react";
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import GroupCard from "../../../components/group/groupcard";
const icon = require("../../../assets/images/icon.png");


export default function Group() {
  const [activeTab, setActiveTab] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const tabs = ['My Groups', 'Discover'];
  const insets = useSafeAreaInsets();

  return (
     <View style={{ flex: 1, backgroundColor: '#0a0a0f' }}>
      <StatusBar
        barStyle="light-content"
        backgroundColor="#0a0a0f"
        translucent={true}
      />
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingTop: insets.top + 32 }}>
        <View style={{ flex: 1, paddingHorizontal: 20 }}>
        {/* Clean Search */}
        <View style={{
          flexDirection: 'row',
          alignItems: 'center',
          marginBottom: 24,
          paddingBottom: 8,
          borderBottomWidth: 1,
          borderBottomColor: 'rgba(255, 255, 255, 0.1)'
        }}>
          <View style={{
            width: 16,
            height: 16,
            marginRight: 8,
            position: 'relative'
          }}>
            {/* Search circle */}
            <View style={{
              position: 'absolute',
              top: 1,
              left: 1,
              width: 10,
              height: 10,
              borderWidth: 1.5,
              borderColor: 'rgba(255, 255, 255, 0.5)',
              borderRadius: 5,
              backgroundColor: 'transparent'
            }} />
            {/* Search handle */}
            <View style={{
              position: 'absolute',
              bottom: 1,
              right: 1,
              width: 5,
              height: 1.5,
              backgroundColor: 'rgba(255, 255, 255, 0.5)',
              borderRadius: 1,
              transform: [{ rotate: '45deg' }]
            }} />
          </View>
          
          <TextInput
            style={{
              flex: 1,
              fontSize: 16,
              color: '#ffffff',
              paddingVertical: 4
            }}
            placeholder="Search groups..."
            placeholderTextColor="rgba(255, 255, 255, 0.5)"
            value={searchQuery}
            onChangeText={setSearchQuery}
            selectionColor="#ffffff"
          />
          
          {searchQuery.length > 0 && (
            <TouchableOpacity
              onPress={() => setSearchQuery('')}
              style={{ paddingLeft: 8 }}
            >
              <Text style={{
                fontSize: 16,
                color: 'rgba(255, 255, 255, 0.5)'
              }}>×</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Clean Tab Navigation */}
        <View style={{
          flexDirection: 'row',
          marginBottom: 24,
          paddingHorizontal: 0
        }}>
          {tabs.map((tab, index) => {
            const isActive = index === activeTab;
            return (
              <TouchableOpacity
                key={tab}
                onPress={() => setActiveTab(index)}
                style={{
                  marginRight: 32,
                  paddingBottom: 8,
                  borderBottomWidth: isActive ? 2 : 0,
                  borderBottomColor: '#ffffff'
                }}
              >
                <Text style={{
                  fontSize: 16,
                  fontWeight: isActive ? '600' : '400',
                  color: isActive ? '#ffffff' : 'rgba(255, 255, 255, 0.6)'
                }}>
                  {tab}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Search Results Info */}
        {searchQuery.length > 0 && (
          <View style={{ marginBottom: 16 }}>
            <Text style={{
              fontSize: 14,
              color: 'rgba(255, 255, 255, 0.6)'
            }}>Searching for "{searchQuery}"</Text>
          </View>
        )}

        {/* Content based on active tab */}
        {activeTab === 0 ? (
          /* My Groups Section */
          <View>
            {/* Horizontal Create Group Banner */}
            <TouchableOpacity style={{
              flexDirection: 'row',
              alignItems: 'center',
              paddingVertical: 12,
              paddingHorizontal: 0,
              marginBottom: 24,
              borderBottomWidth: 1,
              borderBottomColor: 'rgba(255, 255, 255, 0.1)'
            }}>
              <Text style={{
                fontSize: 20,
                color: 'rgba(255, 255, 255, 0.4)',
                marginRight: 12
              }}>+</Text>
              
              <View style={{ flex: 1 }}>
                <Text style={{
                  fontSize: 16,
                  color: '#ffffff',
                  marginBottom: 2
                }}>Create New Group</Text>
                
                <Text style={{
                  fontSize: 12,
                  color: 'rgba(255, 255, 255, 0.5)'
                }}>Start your own gaming community</Text>
              </View>
            </TouchableOpacity>

            {/* My Groups Grid - 2 Columns */}
            <View style={{
              flexDirection: 'row',
              flexWrap: 'wrap',
              justifyContent: 'space-between'
            }}>
              <View style={{ width: '48%' }}>
                <GroupCard 
                  name="Elite Squad"
                  img={icon}
                  description="Your main gaming crew"
                  memberCount={12}
                  memberAvatars={[icon, icon, icon, icon, icon, icon]}
                  isJoined={true}
                  groupId="1"
                />
              </View>
              
              <View style={{ width: '48%' }}>
                <GroupCard 
                  name="Weekend Warriors"
                  img={icon}
                  description="Casual weekend gaming sessions"
                  memberCount={8}
                  memberAvatars={[icon, icon, icon]}
                  isJoined={true}
                  groupId="2"
                />
              </View>
              
              <View style={{ width: '48%' }}>
                <GroupCard 
                  name="Strategy Masters"
                  img={icon}
                  description="Advanced tactics and competitive play"
                  memberCount={15}
                  memberAvatars={[icon, icon, icon, icon, icon, icon, icon]}
                  isJoined={true}
                  groupId="3"
                />
              </View>
              
              <View style={{ width: '48%' }}>
                <GroupCard 
                  name="Night Owls"
                  img={icon}
                  description="Late night gaming sessions"
                  memberCount={6}
                  memberAvatars={[icon, icon]}
                  isJoined={true}
                  groupId="4"
                />
              </View>
            </View>
          </View>
        ) : (
          /* Discover Section */
          <View>
            {/* Public Groups Grid - 2 Columns */}
            <View style={{
              flexDirection: 'row',
              flexWrap: 'wrap',
              justifyContent: 'space-between'
            }}>
              <View style={{ width: '48%' }}>
                <GroupCard 
                  name="Gaming Legends"
                  img={icon}
                  description="Elite gamers unite for epic battles"
                  memberCount={1247}
                  memberAvatars={[icon, icon, icon, icon, icon]}
                  isJoined={false}
                  groupId="5"
                />
              </View>
              
              <View style={{ width: '48%' }}>
                <GroupCard 
                  name="Casual Players"
                  img={icon}
                  description="Friendly community for casual gaming"
                  memberCount={589}
                  memberAvatars={[icon, icon, icon]}
                  isJoined={false}
                  groupId="6"
                />
              </View>
              
              <View style={{ width: '48%' }}>
                <GroupCard 
                  name="Speedrun Central"
                  img={icon}
                  description="Breaking records and sharing techniques"
                  memberCount={892}
                  memberAvatars={[icon, icon, icon, icon]}
                  isJoined={false}
                  groupId="7"
                />
              </View>
              
              <View style={{ width: '48%' }}>
                <GroupCard 
                  name="Retro Gamers"
                  img={icon}
                  description="Classic games, timeless fun"
                  memberCount={334}
                  memberAvatars={[icon, icon]}
                  isJoined={false}
                  groupId="8"
                />
              </View>
              
              <View style={{ width: '48%' }}>
                <GroupCard 
                  name="Mobile Masters"
                  img={icon}
                  description="Mobile gaming enthusiasts"
                  memberCount={445}
                  memberAvatars={[icon, icon, icon]}
                  isJoined={false}
                  groupId="9"
                />
              </View>
              
              <View style={{ width: '48%' }}>
                <GroupCard 
                  name="Puzzle Pros"
                  img={icon}
                  description="Brain teasers and strategy"
                  memberCount={278}
                  memberAvatars={[icon, icon]}
                  isJoined={false}
                  groupId="10"
                />
              </View>
            </View>
          </View>
        )}

        {/* Additional spacing for scroll */}
        <View style={{ height: 60 }} />
        </View>
      </ScrollView>
    </View>
  );
}