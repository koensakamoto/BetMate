import { Text, View, TouchableOpacity, ScrollView, Image, StatusBar, TextInput, RefreshControl } from "react-native";
import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { router, useLocalSearchParams } from 'expo-router';
import GroupCard from "../../../../components/group/groupcard";
import { groupService, type GroupSummaryResponse } from '../../../../services/group/groupService';
import { debugLog, errorLog, ENV } from '../../../../config/env';
import { haptic } from '../../../../utils/haptics';
import { SkeletonGroupCard } from '../../../../components/common/SkeletonCard';

// Helper function to convert relative image URL to absolute URL
const getFullImageUrl = (relativePath: string | null | undefined): string | null => {
  if (!relativePath) return null;
  if (relativePath.startsWith('http://') || relativePath.startsWith('https://')) {
    return relativePath;
  }
  return `${ENV.API_BASE_URL}${relativePath}`;
};
const icon = require("../../../../assets/images/icon.png");


export default function Group() {
  const params = useLocalSearchParams<{ refresh?: string }>();
  const [activeTab, setActiveTab] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [myGroups, setMyGroups] = useState<GroupSummaryResponse[]>([]);
  const [publicGroups, setPublicGroups] = useState<GroupSummaryResponse[]>([]);
  const [searchResults, setSearchResults] = useState<GroupSummaryResponse[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [hasInitiallyLoaded, setHasInitiallyLoaded] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const tabs = ['My Groups', 'Discover'];
  const insets = useSafeAreaInsets();

  // Cache management: 5 minute cache
  const lastFetchTime = useRef<number>(0);
  const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  // Track if we've fetched data at least once
  const hasFetchedMyGroups = useRef<boolean>(false);
  const hasFetchedPublicGroups = useRef<boolean>(false);

  const isCacheValid = useCallback(() => {
    return (Date.now() - lastFetchTime.current) < CACHE_DURATION;
  }, []);

  // Refresh both groups lists
  const refreshGroups = useCallback(async (isRefreshing: boolean = false, forceLoading: boolean = false) => {
    if (isRefreshing) {
      setRefreshing(true);
    } else if (forceLoading) {
      setIsLoading(true);
    }

    try {
      // Fetch both groups lists in parallel
      const [myGroupsData, publicGroupsData] = await Promise.all([
        groupService.getMyGroups(),
        groupService.getPublicGroups()
      ]);

      setMyGroups(myGroupsData);
      setPublicGroups(publicGroupsData);

      // Mark that we've fetched both
      hasFetchedMyGroups.current = true;
      hasFetchedPublicGroups.current = true;

      // Update cache timestamp
      lastFetchTime.current = Date.now();
    } catch (error) {
      errorLog('Error refreshing groups:', error);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
      setHasInitiallyLoaded(true);
    }
  }, []);

  // Watch for refresh parameter changes (e.g., after deleting a group)
  useEffect(() => {
    if (params.refresh) {
      debugLog('Refresh parameter detected, forcing groups refresh');
      // Invalidate cache and force refresh
      lastFetchTime.current = 0;
      refreshGroups(false, true);
    }
  }, [params.refresh, refreshGroups]);

  // Smart refresh on focus: only refetch if cache expired
  useFocusEffect(
    useCallback(() => {
      if (!isCacheValid() || myGroups.length === 0) {
        // Only show loading skeleton if we have no data at all
        const shouldShowLoading = myGroups.length === 0 && publicGroups.length === 0;
        refreshGroups(false, shouldShowLoading);
      }
    }, [refreshGroups, isCacheValid, myGroups.length, publicGroups.length])
  );

  // Pull-to-refresh handler
  const onRefresh = useCallback(() => {
    refreshGroups(true);
  }, [refreshGroups]);

  // Fetch data based on active tab (for tab switching only - useFocusEffect handles initial load)
  useEffect(() => {
    const fetchData = async () => {
      let didFetch = false;
      try {
        if (activeTab === 0) {
          // Fetch my groups if not already fetched
          if (!hasFetchedMyGroups.current && myGroups.length === 0) {
            setIsLoading(true);
            didFetch = true;
            const groups = await groupService.getMyGroups();
            setMyGroups(groups);
            hasFetchedMyGroups.current = true;
            debugLog('My groups fetched:', groups);
          }
        } else {
          // Fetch public groups if not already fetched
          if (!hasFetchedPublicGroups.current && publicGroups.length === 0) {
            setIsLoading(true);
            didFetch = true;
            const groups = await groupService.getPublicGroups();
            setPublicGroups(groups);
            hasFetchedPublicGroups.current = true;
            debugLog('Public groups fetched:', groups);
          }
        }
      } catch (error) {
        errorLog('Error fetching groups:', error);
      } finally {
        if (didFetch) {
          setIsLoading(false);
        }
      }
    };

    // Only fetch if we already have some data loaded (to avoid double fetching with useFocusEffect)
    if (myGroups.length > 0 || publicGroups.length > 0) {
      fetchData();
    }
  }, [activeTab, myGroups.length, publicGroups.length]);

  // Handle search
  useEffect(() => {
    // Immediately set isSearching to true when there's a query to avoid showing empty state
    if (searchQuery.trim().length > 0) {
      setIsSearching(true);
      setHasSearched(true);
    } else {
      setIsSearching(false);
      setHasSearched(false);
      setSearchResults([]);
    }

    const handleSearch = async () => {
      if (searchQuery.trim().length > 0) {
        try {
          const results = await groupService.searchGroups(searchQuery.trim());
          setSearchResults(results);
          setIsSearching(false);
          debugLog('Search results:', results);
        } catch (error) {
          errorLog('Error searching groups:', error);
          setSearchResults([]);
          setIsSearching(false);
        }
      }
    };

    const timeoutId = setTimeout(handleSearch, 300); // Debounce search
    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

  // Get groups to display based on current state - memoized to avoid recalculating on every render
  const groupsToDisplay = useMemo((): GroupSummaryResponse[] => {
    if (searchQuery.trim().length > 0) {
      return searchResults;
    }
    const result = activeTab === 0 ? myGroups : publicGroups;
    return result;
  }, [searchQuery, searchResults, activeTab, myGroups, publicGroups]);

  // Memoize tab change handler to provide stable reference
  const handleTabChange = useCallback((index: number) => {
    haptic.selection();
    setActiveTab(index);
  }, []);

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
      <ScrollView
        style={{ flex: 1, marginTop: insets.top }}
        contentContainerStyle={{ paddingTop: 20 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#00D4AA"
            colors={['#00D4AA']}
          />
        }
      >
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
                onPress={() => handleTabChange(index)}
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

        {/* Content based on active tab */}
        {activeTab === 0 ? (
          /* My Groups Section */
          <View>
            {/* Horizontal Create Group Banner - Only show when not searching */}
            {searchQuery.trim().length === 0 && (
              <TouchableOpacity
                onPress={() => router.push('/(app)/create-group')}
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
                  }}>Compete with friends on your picks</Text>
                </View>
              </TouchableOpacity>
            )}

            {/* My Groups Grid - 2 Columns */}
            {(() => {
              if (isSearching) {
                return (
                  /* Searching - show skeletons */
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
                );
              } else if (!hasInitiallyLoaded || (isLoading && myGroups.length === 0)) {
                return (
                  /* First time loading - show skeletons */
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
                );
              } else if (groupsToDisplay.length > 0) {
                return (
                  /* Has results - show groups */
                  <View style={{
                    flexDirection: 'row',
                    flexWrap: 'wrap',
                    justifyContent: 'space-between'
                  }}>
                    {groupsToDisplay.map((group, index) => (
                      <View key={group.id} style={{ width: '48%', marginBottom: 16 }}>
                        <GroupCard
                          name={group.groupName}
                          img={getFullImageUrl(group.groupPictureUrl) ? { uri: getFullImageUrl(group.groupPictureUrl)! } : undefined}
                          description={group.description || 'No description available'}
                          memberCount={group.memberCount}
                          memberPreviews={group.memberPreviews}
                          isJoined={group.isUserMember}
                          groupId={group.id.toString()}
                        />
                      </View>
                    ))}
                  </View>
                );
              } else if (hasSearched && searchQuery.trim().length > 0) {
                return (
                  /* Search completed with no results */
                  <View style={{
                    flexDirection: 'row',
                    flexWrap: 'wrap',
                    justifyContent: 'space-between'
                  }}>
                    <Text style={{
                      color: 'rgba(255, 255, 255, 0.6)',
                      textAlign: 'center',
                      width: '100%',
                      marginTop: 20
                    }}>
                      No groups found matching your search.
                    </Text>
                  </View>
                );
              } else {
                return (
                  /* No search, no groups */
                  <View style={{
                    flexDirection: 'row',
                    flexWrap: 'wrap',
                    justifyContent: 'space-between'
                  }}>
                    <Text style={{
                      color: 'rgba(255, 255, 255, 0.6)',
                      textAlign: 'center',
                      width: '100%',
                      marginTop: 20
                    }}>
                      You haven't joined any groups yet. Create one or discover groups below!
                    </Text>
                  </View>
                );
              }
            })()}
          </View>
        ) : (
          /* Discover Section */
          <View>
            {/* Public Groups Grid - 2 Columns */}
            {isSearching ? (
              /* Searching - show skeletons */
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
            ) : (!hasInitiallyLoaded || (isLoading && publicGroups.length === 0)) ? (
              /* First time loading - show skeletons */
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
            ) : groupsToDisplay.length > 0 ? (
              /* Has results - show groups */
              <View style={{
                flexDirection: 'row',
                flexWrap: 'wrap',
                justifyContent: 'space-between'
              }}>
                {groupsToDisplay.map((group, index) => (
                  <View key={group.id} style={{ width: '48%', marginBottom: 16 }}>
                    <GroupCard
                      name={group.groupName}
                      img={getFullImageUrl(group.groupPictureUrl) ? { uri: getFullImageUrl(group.groupPictureUrl)! } : undefined}
                      description={group.description || 'No description available'}
                      memberCount={group.memberCount}
                      memberPreviews={group.memberPreviews}
                      isJoined={group.isUserMember}
                      groupId={group.id.toString()}
                    />
                  </View>
                ))}
              </View>
            ) : hasSearched && searchQuery.trim().length > 0 ? (
              /* Search completed with no results */
              <View style={{
                flexDirection: 'row',
                flexWrap: 'wrap',
                justifyContent: 'space-between'
              }}>
                <Text style={{
                  color: 'rgba(255, 255, 255, 0.6)',
                  textAlign: 'center',
                  width: '100%',
                  marginTop: 20
                }}>
                  No groups found matching your search.
                </Text>
              </View>
            ) : (
              /* No search, no public groups */
              <View style={{
                flexDirection: 'row',
                flexWrap: 'wrap',
                justifyContent: 'space-between'
              }}>
                <Text style={{
                  color: 'rgba(255, 255, 255, 0.6)',
                  textAlign: 'center',
                  width: '100%',
                  marginTop: 20
                }}>
                  No public groups available yet. Be the first to create one!
                </Text>
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