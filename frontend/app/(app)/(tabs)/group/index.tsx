import { Text, View, TouchableOpacity, FlatList, StatusBar, TextInput, RefreshControl, ActivityIndicator, StyleSheet } from "react-native";
import { useState, useCallback, useMemo, useEffect } from "react";
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

  // React Query hooks with infinite scroll
  const {
    data: myGroupsData,
    isLoading: isLoadingMyGroups,
    refetch: refetchMyGroups,
    fetchNextPage: fetchNextMyGroups,
    hasNextPage: hasNextMyGroups,
    isFetchingNextPage: isFetchingNextMyGroups,
  } = useMyGroups();

  const {
    data: publicGroupsData,
    isLoading: isLoadingPublicGroups,
    refetch: refetchPublicGroups,
    fetchNextPage: fetchNextPublicGroups,
    hasNextPage: hasNextPublicGroups,
    isFetchingNextPage: isFetchingNextPublicGroups,
  } = usePublicGroups();

  const {
    data: searchData,
    isFetching: isSearching,
    fetchNextPage: fetchNextSearch,
    hasNextPage: hasNextSearch,
    isFetchingNextPage: isFetchingNextSearch,
  } = useSearchGroups(debouncedSearch);

  const { invalidateAll } = useInvalidateGroups();

  // Flatten pages data (filter out any undefined items)
  const myGroups = useMemo(() =>
    myGroupsData?.pages?.flatMap(page => page?.content ?? []).filter(Boolean) ?? [],
    [myGroupsData]
  );
  const publicGroups = useMemo(() =>
    publicGroupsData?.pages?.flatMap(page => page?.content ?? []).filter(Boolean) ?? [],
    [publicGroupsData]
  );
  const searchResults = useMemo(() =>
    searchData?.pages?.flatMap(page => page?.content ?? []).filter(Boolean) ?? [],
    [searchData]
  );

  // Handle refresh param from navigation (after create/delete)
  useEffect(() => {
    if (params.refresh) {
      invalidateAll();
    }
  }, [params.refresh]);

  // Debounced search
  useEffect(() => {
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

  const isSearchActive = debouncedSearch.length > 0;

  // Memoize tab change handler
  const handleTabChange = useCallback((index: number) => {
    haptic.selection();
    setActiveTab(index);
  }, []);

  // Render group item - memoized render function
  const renderGroupItem = useCallback(({ item, index }: { item: GroupSummaryResponse; index: number }) => (
    <View style={{
      width: '50%',
      paddingHorizontal: 10,
      paddingLeft: index % 2 === 0 ? 20 : 5,
      paddingRight: index % 2 === 1 ? 20 : 5,
      marginBottom: 16
    }}>
      <GroupCard
        name={item.groupName}
        imageUrl={item.groupPictureUrl}
        description={item.description || 'No description available'}
        memberCount={item.memberCount}
        memberPreviews={item.memberPreviews}
        isJoined={item.isUserMember}
        groupId={item.id.toString()}
      />
    </View>
  ), []);

  // Render loading skeletons
  const renderSkeletons = useCallback(() => (
    <View style={{
      flexDirection: 'row',
      flexWrap: 'wrap',
      paddingHorizontal: 20
    }}>
      <View style={{ width: '50%', paddingRight: 8, marginBottom: 16 }}>
        <SkeletonGroupCard />
      </View>
      <View style={{ width: '50%', paddingLeft: 8, marginBottom: 16 }}>
        <SkeletonGroupCard />
      </View>
      <View style={{ width: '50%', paddingRight: 8, marginBottom: 16 }}>
        <SkeletonGroupCard />
      </View>
      <View style={{ width: '50%', paddingLeft: 8, marginBottom: 16 }}>
        <SkeletonGroupCard />
      </View>
    </View>
  ), []);

  // Empty component for My Groups
  const renderMyGroupsEmpty = useCallback(() => {
    if (isLoadingMyGroups) {
      return renderSkeletons();
    }
    return (
      <View style={{ paddingHorizontal: 20 }}>
        <Text style={styles.emptyText}>
          You haven't joined any groups yet. Create one or discover groups below!
        </Text>
      </View>
    );
  }, [isLoadingMyGroups, renderSkeletons]);

  // Empty component for Discover
  const renderDiscoverEmpty = useCallback(() => {
    if (isLoadingPublicGroups) {
      return renderSkeletons();
    }
    return (
      <View style={{ paddingHorizontal: 20 }}>
        <Text style={styles.emptyText}>
          No public groups available yet. Be the first to create one!
        </Text>
      </View>
    );
  }, [isLoadingPublicGroups, renderSkeletons]);

  // Empty component for Search
  const renderSearchEmpty = useCallback(() => {
    if (isSearching) {
      return renderSkeletons();
    }
    return (
      <View style={{ paddingHorizontal: 20 }}>
        <Text style={styles.emptyText}>
          No groups found matching your search.
        </Text>
      </View>
    );
  }, [isSearching, renderSkeletons]);

  // Footer components
  const renderMyGroupsFooter = useCallback(() => {
    if (!isFetchingNextMyGroups) return <View style={{ height: 60 }} />;
    return (
      <View style={{ paddingVertical: 20, alignItems: 'center' }}>
        <ActivityIndicator size="small" color="#00D4AA" />
      </View>
    );
  }, [isFetchingNextMyGroups]);

  const renderDiscoverFooter = useCallback(() => {
    if (!isFetchingNextPublicGroups) return <View style={{ height: 60 }} />;
    return (
      <View style={{ paddingVertical: 20, alignItems: 'center' }}>
        <ActivityIndicator size="small" color="#00D4AA" />
      </View>
    );
  }, [isFetchingNextPublicGroups]);

  const renderSearchFooter = useCallback(() => {
    if (!isFetchingNextSearch) return <View style={{ height: 60 }} />;
    return (
      <View style={{ paddingVertical: 20, alignItems: 'center' }}>
        <ActivityIndicator size="small" color="#00D4AA" />
      </View>
    );
  }, [isFetchingNextSearch]);

  // End reached handlers
  const handleMyGroupsEndReached = useCallback(() => {
    if (hasNextMyGroups && !isFetchingNextMyGroups) {
      fetchNextMyGroups();
    }
  }, [hasNextMyGroups, isFetchingNextMyGroups, fetchNextMyGroups]);

  const handleDiscoverEndReached = useCallback(() => {
    if (hasNextPublicGroups && !isFetchingNextPublicGroups) {
      fetchNextPublicGroups();
    }
  }, [hasNextPublicGroups, isFetchingNextPublicGroups, fetchNextPublicGroups]);

  const handleSearchEndReached = useCallback(() => {
    if (hasNextSearch && !isFetchingNextSearch) {
      fetchNextSearch();
    }
  }, [hasNextSearch, isFetchingNextSearch, fetchNextSearch]);

  // Header for My Groups (includes create banner)
  const renderMyGroupsHeader = useCallback(() => (
    <View style={{ paddingHorizontal: 20 }}>
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
    </View>
  ), []);

  // Common refresh control
  const refreshControl = useMemo(() => (
    <RefreshControl
      refreshing={refreshing}
      onRefresh={onRefresh}
      tintColor="#00D4AA"
      colors={['#00D4AA']}
    />
  ), [refreshing, onRefresh]);

  return (
    <View style={{ flex: 1, backgroundColor: '#0a0a0f' }}>
      <StatusBar
        barStyle="light-content"
        backgroundColor="transparent"
        translucent={true}
      />
      {/* Solid background behind status bar */}
      <View style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: insets.top,
        backgroundColor: '#0a0a0f',
        zIndex: 1
      }} />

      {/* Fixed Header */}
      <View style={{ marginTop: insets.top, paddingTop: 20, backgroundColor: '#0a0a0f' }}>
        <View style={{ paddingHorizontal: 20 }}>
          {/* Search */}
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

          {/* Tab Navigation */}
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
        </View>
      </View>

      {/* Tab Content Container - Both lists stay mounted */}
      <View style={{ flex: 1 }}>
        {/* Search Results (shown over tabs when searching) */}
        {isSearchActive && (
          <FlatList
            data={searchResults}
            renderItem={renderGroupItem}
            keyExtractor={(item) => `search-${item.id}`}
            numColumns={2}
            ListEmptyComponent={renderSearchEmpty}
            ListFooterComponent={renderSearchFooter}
            onEndReached={handleSearchEndReached}
            onEndReachedThreshold={0.5}
            refreshControl={refreshControl}
            style={StyleSheet.absoluteFill}
            contentContainerStyle={{ flexGrow: 1 }}
            showsVerticalScrollIndicator={false}
          />
        )}

        {/* My Groups List - Always mounted, visibility controlled */}
        <FlatList
          data={myGroups}
          renderItem={renderGroupItem}
          keyExtractor={(item) => `my-${item.id}`}
          numColumns={2}
          ListHeaderComponent={renderMyGroupsHeader}
          ListEmptyComponent={renderMyGroupsEmpty}
          ListFooterComponent={renderMyGroupsFooter}
          onEndReached={handleMyGroupsEndReached}
          onEndReachedThreshold={0.5}
          refreshControl={refreshControl}
          style={[
            StyleSheet.absoluteFill,
            { opacity: !isSearchActive && activeTab === 0 ? 1 : 0 }
          ]}
          pointerEvents={!isSearchActive && activeTab === 0 ? 'auto' : 'none'}
          contentContainerStyle={{ flexGrow: 1 }}
          showsVerticalScrollIndicator={false}
        />

        {/* Discover List - Always mounted, visibility controlled */}
        <FlatList
          data={publicGroups}
          renderItem={renderGroupItem}
          keyExtractor={(item) => `discover-${item.id}`}
          numColumns={2}
          ListEmptyComponent={renderDiscoverEmpty}
          ListFooterComponent={renderDiscoverFooter}
          onEndReached={handleDiscoverEndReached}
          onEndReachedThreshold={0.5}
          refreshControl={refreshControl}
          style={[
            StyleSheet.absoluteFill,
            { opacity: !isSearchActive && activeTab === 1 ? 1 : 0 }
          ]}
          pointerEvents={!isSearchActive && activeTab === 1 ? 'auto' : 'none'}
          contentContainerStyle={{ flexGrow: 1 }}
          showsVerticalScrollIndicator={false}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  emptyText: {
    color: 'rgba(255, 255, 255, 0.6)',
    textAlign: 'center',
    width: '100%',
    marginTop: 20,
  },
});
