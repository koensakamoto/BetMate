import { Text, View, TouchableOpacity, ScrollView, Image, StatusBar, TextInput } from "react-native";
import { useState, useEffect, useCallback } from "react";
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { router } from 'expo-router';
import GroupCard from "../../../components/group/groupcard";
import { groupService, type GroupSummaryResponse } from '../../../services/group/groupService';
import { debugLog, errorLog } from '../../../config/env';
import { haptic } from '../../../utils/haptics';
import { SkeletonGroupCard } from '../../../components/common/SkeletonCard';
const icon = require("../../../assets/images/icon.png");


export default function Group() {
  const [activeTab, setActiveTab] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [myGroups, setMyGroups] = useState<GroupSummaryResponse[]>([]);
  const [publicGroups, setPublicGroups] = useState<GroupSummaryResponse[]>([]);
  const [searchResults, setSearchResults] = useState<GroupSummaryResponse[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const tabs = ['My Groups', 'Discover'];
  const insets = useSafeAreaInsets();

  // Refresh both groups lists
  const refreshGroups = useCallback(async () => {
    setIsLoading(true);
    try {
      // Fetch both groups lists in parallel
      const [myGroupsData, publicGroupsData] = await Promise.all([
        groupService.getMyGroups(),
        groupService.getPublicGroups()
      ]);
      
      setMyGroups(myGroupsData);
      setPublicGroups(publicGroupsData);
      debugLog('Groups refreshed - My groups:', myGroupsData, 'Public groups:', publicGroupsData);
    } catch (error) {
      errorLog('Error refreshing groups:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Refresh groups when page gains focus (e.g., returning from create-group)
  useFocusEffect(
    useCallback(() => {
      refreshGroups();
    }, [refreshGroups])
  );

  // Fetch data based on active tab (for tab switching only - useFocusEffect handles initial load)
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        if (activeTab === 0) {
          // Fetch my groups if not already loaded
          if (myGroups.length === 0) {
            const groups = await groupService.getMyGroups();
            setMyGroups(groups);
            debugLog('My groups fetched:', groups);
          }
        } else {
          // Fetch public groups if not already loaded
          if (publicGroups.length === 0) {
            const groups = await groupService.getPublicGroups();
            setPublicGroups(groups);
            debugLog('Public groups fetched:', groups);
          }
        }
      } catch (error) {
        errorLog('Error fetching groups:', error);
      } finally {
        setIsLoading(false);
      }
    };

    // Only fetch if we already have some data loaded (to avoid double fetching with useFocusEffect)
    if (myGroups.length > 0 || publicGroups.length > 0) {
      fetchData();
    }
  }, [activeTab, myGroups.length, publicGroups.length]);

  // Handle search
  useEffect(() => {
    const handleSearch = async () => {
      if (searchQuery.trim().length > 0) {
        try {
          const results = await groupService.searchGroups(searchQuery.trim());
          setSearchResults(results);
          debugLog('Search results:', results);
        } catch (error) {
          errorLog('Error searching groups:', error);
          setSearchResults([]);
        }
      } else {
        setSearchResults([]);
      }
    };

    const timeoutId = setTimeout(handleSearch, 300); // Debounce search
    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

  // Get groups to display based on current state
  const getGroupsToDisplay = (): GroupSummaryResponse[] => {
    if (searchQuery.trim().length > 0) {
      return searchResults;
    }
    return activeTab === 0 ? myGroups : publicGroups;
  };

  return (
     <View style={{ flex: 1, backgroundColor: '#0a0a0f' }}>
      <StatusBar
        barStyle="light-content"
        backgroundColor="transparent"
        translucent={true}
      />
      {/* Solid background behind status bar - Instagram style */}
      <View style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: insets.top,
        backgroundColor: '#0a0a0f',
        zIndex: 1
      }} />
      <ScrollView style={{ flex: 1, marginTop: insets.top }} contentContainerStyle={{ paddingTop: 20 }}>
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
                onPress={() => {
                  haptic.selection();
                  setActiveTab(index);
                }}
                style={{
                  marginRight: 32,
                  paddingBottom: 8,
                  borderBottomWidth: isActive ? 2 : 0,
                  borderBottomColor: '#ffffff'
                }}
                activeOpacity={0.7}
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
            }}>Searching for &quot;{searchQuery}&quot;</Text>
          </View>
        )}

        {/* Content based on active tab */}
        {activeTab === 0 ? (
          /* My Groups Section */
          <View>
            {/* Horizontal Create Group Banner */}
            <TouchableOpacity
              onPress={() => router.push('/create-group')}
              style={{
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
            {isLoading ? (
              <View style={{
                flexDirection: 'row',
                flexWrap: 'wrap',
                justifyContent: 'space-between'
              }}>
                <SkeletonGroupCard />
                <SkeletonGroupCard />
                <SkeletonGroupCard />
                <SkeletonGroupCard />
              </View>
            ) : (
              <View style={{
                flexDirection: 'row',
                flexWrap: 'wrap',
                justifyContent: 'space-between'
              }}>
                {getGroupsToDisplay().length === 0 ? (
                  <Text style={{ 
                    color: 'rgba(255, 255, 255, 0.6)', 
                    textAlign: 'center', 
                    width: '100%',
                    marginTop: 20 
                  }}>
                    {searchQuery.trim().length > 0 ? 'No groups found matching your search.' : 'You haven\'t joined any groups yet. Create one or discover groups below!'}
                  </Text>
                ) : (
                  getGroupsToDisplay().map((group, index) => (
                    <View key={group.id} style={{ width: '48%', marginBottom: 16 }}>
                      <GroupCard 
                        name={group.groupName}
                        img={group.groupPictureUrl ? { uri: group.groupPictureUrl } : icon}
                        description={group.description || 'No description available'}
                        memberCount={group.memberCount}
                        memberAvatars={[icon, icon, icon]} // TODO: Replace with actual member avatars when available
                        isJoined={group.isUserMember}
                        groupId={group.id.toString()}
                      />
                    </View>
                  ))
                )}
              </View>
            )}
          </View>
        ) : (
          /* Discover Section */
          <View>
            {/* Public Groups Grid - 2 Columns */}
            {isLoading ? (
              <View style={{
                flexDirection: 'row',
                flexWrap: 'wrap',
                justifyContent: 'space-between'
              }}>
                <SkeletonGroupCard />
                <SkeletonGroupCard />
                <SkeletonGroupCard />
                <SkeletonGroupCard />
              </View>
            ) : (
              <View style={{
                flexDirection: 'row',
                flexWrap: 'wrap',
                justifyContent: 'space-between'
              }}>
                {getGroupsToDisplay().length === 0 ? (
                  <Text style={{ 
                    color: 'rgba(255, 255, 255, 0.6)', 
                    textAlign: 'center', 
                    width: '100%',
                    marginTop: 20 
                  }}>
                    {searchQuery.trim().length > 0 ? 'No groups found matching your search.' : 'No public groups available yet. Be the first to create one!'}
                  </Text>
                ) : (
                  getGroupsToDisplay().map((group, index) => (
                    <View key={group.id} style={{ width: '48%', marginBottom: 16 }}>
                      <GroupCard 
                        name={group.groupName}
                        img={group.groupPictureUrl ? { uri: group.groupPictureUrl } : icon}
                        description={group.description || 'No description available'}
                        memberCount={group.memberCount}
                        memberAvatars={[icon, icon, icon]} // TODO: Replace with actual member avatars when available
                        isJoined={group.isUserMember}
                        groupId={group.id.toString()}
                      />
                    </View>
                  ))
                )}
              </View>
            )}
          </View>
        )}

        {/* Additional spacing for scroll */}
        <View style={{ height: 60 }} />
        </View>
      </ScrollView>
    </View>
  );
}