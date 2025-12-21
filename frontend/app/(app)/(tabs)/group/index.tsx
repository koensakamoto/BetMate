import { Text, View, TouchableOpacity, ScrollView, StatusBar, TextInput, RefreshControl } from "react-native";
import { useState, useCallback, useMemo } from "react";
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import GroupCard from "../../../../components/group/groupcard";
import { type GroupSummaryResponse } from '../../../../services/group/groupService';
import { haptic } from '../../../../utils/haptics';
import { SkeletonGroupCard } from '../../../../components/common/SkeletonCard';
import { useMyGroups, usePublicGroups, useSearchGroups, useInvalidateGroups } from '../../../../hooks/useGroupQueries';

export default function Group() {
  const params = useLocalSearchParams<{ refresh?: string }>();
  const [activeTab, setActiveTab] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const tabs = ['My Groups', 'Discover'];
  const insets = useSafeAreaInsets();

  // React Query hooks
  const { data: myGroups = [], isLoading: isLoadingMyGroups, refetch: refetchMyGroups } = useMyGroups();
  const { data: publicGroups = [], isLoading: isLoadingPublicGroups, refetch: refetchPublicGroups } = usePublicGroups();
  const { data: searchResults = [], isFetching: isSearching } = useSearchGroups(debouncedSearch);
  const { invalidateAll } = useInvalidateGroups();

  // Handle refresh param from navigation (after create/delete)
  useMemo(() => {
    if (params.refresh) {
      invalidateAll();
    }
  }, [params.refresh, invalidateAll]);

  // Debounced search
  useMemo(() => {
    const timeoutId = setTimeout(() => {
      setDebouncedSearch(searchQuery.trim());
    }, 300);
    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

  // Pull-to-refresh handler
  const [refreshing, setRefreshing] = useState(false);
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([refetchMyGroups(), refetchPublicGroups()]);
    setRefreshing(false);
  }, [refetchMyGroups, refetchPublicGroups]);

  // Get groups to display based on current state
  const groupsToDisplay = useMemo((): GroupSummaryResponse[] => {
    if (debouncedSearch.length > 0) {
      return searchResults;
    }
    return activeTab === 0 ? myGroups : publicGroups;
  }, [debouncedSearch, searchResults, activeTab, myGroups, publicGroups]);

  // Loading state
  const isLoading = activeTab === 0 ? isLoadingMyGroups : isLoadingPublicGroups;
  const hasSearched = debouncedSearch.length > 0;

  // Memoize tab change handler
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
              } else if (isLoading) {
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
                    {groupsToDisplay.map((group) => (
                      <View key={group.id} style={{ width: '48%', marginBottom: 16 }}>
                        <GroupCard
                          name={group.groupName}
                          imageUrl={group.groupPictureUrl}
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
              } else if (hasSearched) {
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
                      You haven&apos;t joined any groups yet. Create one or discover groups below!
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
            ) : isLoading ? (
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
                {groupsToDisplay.map((group) => (
                  <View key={group.id} style={{ width: '48%', marginBottom: 16 }}>
                    <GroupCard
                      name={group.groupName}
                      imageUrl={group.groupPictureUrl}
                      description={group.description || 'No description available'}
                      memberCount={group.memberCount}
                      memberPreviews={group.memberPreviews}
                      isJoined={group.isUserMember}
                      groupId={group.id.toString()}
                    />
                  </View>
                ))}
              </View>
            ) : hasSearched ? (
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
