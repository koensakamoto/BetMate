import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Text, View, ScrollView, StatusBar, FlatList, Alert, Platform, TouchableOpacity, ActivityIndicator, RefreshControl } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import StoreHeader from '../../components/store/StoreHeader';
import StoreCategoryTabs, { StoreCategory } from '../../components/store/StoreCategoryTabs';
import StoreItem, { StoreItemData } from '../../components/store/StoreItem';
import EarnCreditsModal from '../../components/store/EarnCreditsModal';
import TransactionHistoryModal, { Transaction } from '../../components/store/TransactionHistoryModal';
import StoreItemDetailSheet from '../../components/store/StoreItemDetailSheet';
import { EarnCreditsOption, Rarity, ItemType, ItemCategory } from '../../components/store/storeData';
import { userService } from '../../services/user/userService';
import { storeService, StoreItemResponse } from '../../services/store/storeService';
import { transactionService } from '../../services/user/transactionService';
import { dailyRewardService } from '../../services/user/dailyRewardService';
import { useAuth } from '../../contexts/AuthContext';
import { haptic } from '../../utils/haptics';
import LoadingOverlay from '../../components/common/LoadingOverlay';
import { SkeletonStoreItem } from '../../components/common/SkeletonCard';

export default function Store() {
  const insets = useSafeAreaInsets();
  const { user, isAuthenticated, isLoading } = useAuth();
  const [activeCategory, setActiveCategory] = useState<StoreCategory>('featured');
  const [earnCreditsModalVisible, setEarnCreditsModalVisible] = useState(false);
  const [transactionHistoryVisible, setTransactionHistoryVisible] = useState(false);
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [selectedItem, setSelectedItem] = useState<StoreItemData | null>(null);
  const [detailSheetVisible, setDetailSheetVisible] = useState(false);

  // Get user credits - use separate API call since AuthContext might not have latest credits
  const [userCredits, setUserCredits] = useState(0);
  const [fetchingCredits, setFetchingCredits] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Cache management: 5 minute cache
  const lastFetchTime = useRef<number>(0);
  const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  // Store items state
  const [storeItemsData, setStoreItemsData] = useState<Record<StoreCategory, StoreItemData[]>>({
    'featured': [],
    'risk': [],
    'multipliers': [],
    'tools': [],
    'discounts': [],
    'boosters': []
  });
  const [fetchingItems, setFetchingItems] = useState(true);

  const fetchUserCredits = useCallback(async (isRefreshing: boolean = false) => {
    if (!isAuthenticated) {
      setFetchingCredits(false);
      return;
    }

    try {
      if (isRefreshing) {
        setRefreshing(true);
      } else {
        setFetchingCredits(true);
      }

      const userProfile = await userService.getCurrentUserProfile();
      console.log('Store - Fetched user profile:', userProfile);
      setUserCredits(userProfile.totalCredits || 0);

      // Update cache timestamp
      lastFetchTime.current = Date.now();
    } catch (error) {
      console.error('Store - Failed to fetch user credits:', error);
      // Fallback to AuthContext credits if API call fails
      setUserCredits(user?.totalCredits || 0);
    } finally {
      setFetchingCredits(false);
      setRefreshing(false);
    }
  }, [isAuthenticated, user]);

  // Fetch store items from API
  const fetchStoreItems = useCallback(async () => {
    if (!isAuthenticated) {
      setFetchingItems(false);
      return;
    }

    try {
      setFetchingItems(true);
      const items = await storeService.getStoreItems();

      // Convert API response to StoreItemData format and categorize
      const categorizedItems: Record<StoreCategory, StoreItemData[]> = {
        'featured': [],
        'risk': [],
        'multipliers': [],
        'tools': [],
        'discounts': [],
        'boosters': []
      };

      items.forEach((item) => {
        const storeItem: StoreItemData = {
          id: String(item.id),
          name: item.name,
          description: item.description,
          price: item.price,
          icon: item.iconUrl || '',
          itemType: item.itemType as any,
          category: item.category as any,
          rarity: item.rarity as any,
          isOwned: item.userOwns || false,
          isFeatured: item.isFeatured,
          isLimitedTime: item.isLimitedTime,
          availableUntil: item.availableUntil,
          sortOrder: 0
        };

        // Add to featured if it's marked as featured
        if (item.isFeatured) {
          categorizedItems['featured'].push(storeItem);
        }

        // Categorize by category
        const categoryMap: Record<string, StoreCategory> = {
          'RISK_MANAGEMENT': 'risk',
          'MULTIPLIERS': 'multipliers',
          'BETTING_TOOLS': 'tools',
          'DISCOUNTS': 'discounts',
          'BOOSTERS': 'boosters'
        };

        const category = categoryMap[item.category];
        if (category) {
          categorizedItems[category].push(storeItem);
        }
      });

      setStoreItemsData(categorizedItems);
    } catch (error) {
      console.error('Failed to fetch store items:', error);
    } finally {
      setFetchingItems(false);
    }
  }, [isAuthenticated]);

  // Fetch latest user credits, store items, and transactions when component mounts
  useEffect(() => {
    fetchUserCredits(false);
    fetchStoreItems();
    fetchTransactions();
  }, [isAuthenticated, fetchUserCredits, fetchStoreItems, fetchTransactions]);

  // Pull-to-refresh handler
  const onRefresh = useCallback(() => {
    fetchUserCredits(true);
    fetchStoreItems();
    fetchTransactions();
  }, [fetchUserCredits, fetchStoreItems, fetchTransactions]);

  // Transaction data - fetched from API
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [fetchingTransactions, setFetchingTransactions] = useState(false);

  // Fetch transactions from API
  const fetchTransactions = useCallback(async () => {
    if (!isAuthenticated) {
      return;
    }

    try {
      setFetchingTransactions(true);
      const transactionsData = await transactionService.getAllTransactions();
      setTransactions(transactionsData);
    } catch (error) {
      console.error('Failed to fetch transactions:', error);
      // Keep existing transactions on error
    } finally {
      setFetchingTransactions(false);
    }
  }, [isAuthenticated]);

  // Memoize purchase handler to provide stable reference to child components
  const handlePurchase = useCallback((item: StoreItemData) => {
    if (userCredits >= item.price && !item.isOwned) {
      Alert.alert(
        'Confirm Purchase',
        `Purchase ${item.name} for ${item.price} credits?`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Buy',
            onPress: async () => {
              setIsPurchasing(true);
              try {
                // Parse item ID to number (currently stored as string in mock data)
                const itemId = parseInt(item.id, 10);

                // Call the real API
                await storeService.purchaseItem(itemId, item.price);

                // Refresh user credits and store items after successful purchase
                await Promise.all([
                  fetchUserCredits(false),
                  fetchStoreItems()
                ]);

                haptic.success();
                Alert.alert('Purchase Successful!', `You now own ${item.name}`);
              } catch (error: any) {
                console.error('Purchase failed:', error);
                haptic.error();

                // Show user-friendly error message
                const errorMessage = error?.response?.data?.message ||
                                    error?.message ||
                                    'Failed to complete purchase. Please try again.';
                Alert.alert('Purchase Failed', errorMessage);
              } finally {
                setIsPurchasing(false);
              }
            }
          }
        ]
      );
    } else if (item.isOwned) {
      haptic.warning();
      Alert.alert('Already Owned', `You already own ${item.name}`);
    } else {
      haptic.error();
      Alert.alert('Insufficient Credits', `You need ${item.price - userCredits} more credits to purchase this item`);
    }
  }, [userCredits, fetchUserCredits]);

  const handlePreview = useCallback((item: StoreItemData) => {
    Alert.alert(
      'Item Preview',
      `Preview: ${item.name}\n\n${item.description}\n\nThis would show you exactly how this item looks and works before purchasing.`,
      [{ text: 'Close' }]
    );
  }, []);

  const handleEarnCredits = useCallback((option: EarnCreditsOption) => {
    haptic.success();
    Alert.alert(
      'Earn Credits',
      `Complete: ${option.title}\n\nThis would navigate you to complete this action and earn ${option.credits} credits.`,
      [{ text: 'Close' }]
    );
    setEarnCreditsModalVisible(false);
  }, []);

  const handleTransactionHistory = useCallback(() => {
    // Refresh transactions when opening the modal to ensure latest data
    fetchTransactions();
    setTransactionHistoryVisible(true);
  }, [fetchTransactions]);

  const handleItemPress = useCallback((item: StoreItemData) => {
    setSelectedItem(item);
    setDetailSheetVisible(true);
  }, []);

  const handleCloseDetailSheet = useCallback(() => {
    setDetailSheetVisible(false);
    // Delay clearing selected item for smooth animation
    setTimeout(() => setSelectedItem(null), 300);
  }, []);

  const currentItems = storeItemsData[activeCategory] || [];

  // Memoize renderStoreItem to prevent recreation on every render
  const renderStoreItem = useCallback(({ item, index }: { item: StoreItemData; index: number }) => (
    <View style={{
      width: '48%',
      marginLeft: index % 2 === 0 ? 0 : '4%'
    }}>
      <StoreItem
        item={item}
        userCredits={userCredits}
        onPurchase={handlePurchase}
        onPress={handleItemPress}
      />
    </View>
  ), [userCredits, handlePurchase, handleItemPress]);

  // Show loading while authentication is being checked
  if (isLoading) {
    return (
      <View style={{ flex: 1, backgroundColor: '#0a0a0f', justifyContent: 'center', alignItems: 'center' }}>
        <StatusBar
          barStyle="light-content"
          backgroundColor="#0a0a0f"
          translucent={true}
        />
        <ActivityIndicator size="large" color="white" />
      </View>
    );
  }

  // Show login message if user is not authenticated
  if (!isAuthenticated) {
    return (
      <View style={{ flex: 1, backgroundColor: '#0a0a0f', justifyContent: 'center', alignItems: 'center' }}>
        <StatusBar
          barStyle="light-content"
          backgroundColor="#0a0a0f"
          translucent={true}
        />
        <Text style={{ color: 'white', fontSize: 18, textAlign: 'center' }}>
          Please log in to access the store
        </Text>
      </View>
    );
  }

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
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#00D4AA"
            colors={['#00D4AA']}
          />
        }
      >
        {/* Header */}
        <StoreHeader
          credits={userCredits}
          onEarnCredits={() => setEarnCreditsModalVisible(true)}
          onTransactionHistory={handleTransactionHistory}
        />

        {/* Category Tabs */}
        <StoreCategoryTabs
          activeCategory={activeCategory}
          onCategoryChange={(category) => {
            haptic.selection();
            setActiveCategory(category);
          }}
        />

        {/* Items Grid */}
        <View style={{ paddingHorizontal: 20 }}>
          {(fetchingCredits || fetchingItems) ? (
            <View style={{
              flexDirection: 'row',
              flexWrap: 'wrap',
              justifyContent: 'space-between',
              paddingBottom: 24
            }}>
              <SkeletonStoreItem />
              <SkeletonStoreItem />
              <SkeletonStoreItem />
              <SkeletonStoreItem />
            </View>
          ) : (
            <>
              <FlatList
                data={currentItems}
                renderItem={renderStoreItem}
                keyExtractor={(item) => item.id}
                numColumns={2}
                scrollEnabled={false}
                contentContainerStyle={{ paddingBottom: 24 }}
                columnWrapperStyle={{ justifyContent: 'space-between' }}
                // Performance optimizations
                getItemLayout={(data, index) => {
                  const ITEM_HEIGHT = 256; // Fixed height of StoreItem card (240) + marginBottom (16)
                  const ROW_INDEX = Math.floor(index / 2); // 2 columns
                  return {
                    length: ITEM_HEIGHT,
                    offset: ITEM_HEIGHT * ROW_INDEX,
                    index,
                  };
                }}
                initialNumToRender={6}
                maxToRenderPerBatch={4}
                windowSize={5}
                removeClippedSubviews={true}
                updateCellsBatchingPeriod={50}
              />

              {/* Empty State */}
              {currentItems.length === 0 && (
                <View style={{
                  alignItems: 'center',
                  paddingVertical: 60
                }}>
                  <Text style={{
                    fontSize: 18,
                    color: 'rgba(255, 255, 255, 0.6)',
                    textAlign: 'center',
                    fontWeight: '500'
                  }}>
                    No items available in this category
                  </Text>
                  <Text style={{
                    fontSize: 14,
                    color: 'rgba(255, 255, 255, 0.4)',
                    textAlign: 'center',
                    marginTop: 8
                  }}>
                    Check back soon for new items
                  </Text>
                </View>
              )}
            </>
          )}

        </View>
      </ScrollView>

      {/* Earn Credits Modal */}
      <EarnCreditsModal
        visible={earnCreditsModalVisible}
        onClose={() => setEarnCreditsModalVisible(false)}
        onEarnCredits={handleEarnCredits}
      />

      {/* Transaction History Modal */}
      <TransactionHistoryModal
        visible={transactionHistoryVisible}
        onClose={() => setTransactionHistoryVisible(false)}
        transactions={transactions}
      />

      {/* Loading Overlay for Purchases */}
      <LoadingOverlay
        visible={isPurchasing}
        message="Processing purchase..."
      />

      {/* Store Item Detail Sheet */}
      <StoreItemDetailSheet
        visible={detailSheetVisible}
        item={selectedItem}
        userCredits={userCredits}
        onClose={handleCloseDetailSheet}
        onPurchase={handlePurchase}
      />
    </View>
  );
}