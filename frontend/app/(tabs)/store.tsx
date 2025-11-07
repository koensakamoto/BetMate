import React, { useState, useEffect } from 'react';
import { Text, View, ScrollView, StatusBar, FlatList, Alert, Platform, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import StoreHeader from '../../components/store/StoreHeader';
import StoreCategoryTabs, { StoreCategory } from '../../components/store/StoreCategoryTabs';
import StoreItem, { StoreItemData } from '../../components/store/StoreItem';
import EarnCreditsModal from '../../components/store/EarnCreditsModal';
import TransactionHistoryModal, { Transaction } from '../../components/store/TransactionHistoryModal';
import { storeItems, EarnCreditsOption } from '../../components/store/storeData';
import { userService } from '../../services/user/userService';
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

  // Get user credits - use separate API call since AuthContext might not have latest credits
  const [userCredits, setUserCredits] = useState(0);
  const [fetchingCredits, setFetchingCredits] = useState(true);

  // Debug logging to check what's in the user object
  console.log('Store - Debug user object:', {
    user: user,
    userCredits: userCredits,
    totalCredits: user?.totalCredits,
    credits: user?.credits
  });

  // Fetch latest user credits when component mounts or user changes
  useEffect(() => {
    const fetchUserCredits = async () => {
      if (!isAuthenticated) {
        setFetchingCredits(false);
        return;
      }

      try {
        setFetchingCredits(true);
        const userProfile = await userService.getCurrentUserProfile();
        console.log('Store - Fetched user profile:', userProfile);
        setUserCredits(userProfile.totalCredits || 0);
      } catch (error) {
        console.error('Store - Failed to fetch user credits:', error);
        // Fallback to AuthContext credits if API call fails
        setUserCredits(user?.totalCredits || 0);
      } finally {
        setFetchingCredits(false);
      }
    };

    fetchUserCredits();
  }, [isAuthenticated, user]);

  // Mock transaction data - in real app this would come from API
  const [transactions] = useState<Transaction[]>([
    {
      id: '1',
      type: 'CREDIT',
      amount: 500,
      reason: 'Welcome bonus',
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(), // 2 hours ago
      balanceBefore: 0,
      balanceAfter: 500,
      correlationId: 'welcome-123'
    },
    {
      id: '2',
      type: 'DEBIT',
      amount: 75,
      reason: 'Premium Avatar Purchase',
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(), // 1 day ago
      balanceBefore: 500,
      balanceAfter: 425,
      correlationId: 'purchase-456'
    },
    {
      id: '3',
      type: 'TRANSFER_IN',
      amount: 100,
      reason: 'Transfer from @johnsmith',
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(), // 2 days ago
      balanceBefore: 325,
      balanceAfter: 425,
      correlationId: 'transfer-789'
    },
    {
      id: '4',
      type: 'CREDIT',
      amount: 25,
      reason: 'Daily login bonus',
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3).toISOString(), // 3 days ago
      balanceBefore: 300,
      balanceAfter: 325,
      correlationId: 'daily-bonus-101'
    },
    {
      id: '5',
      type: 'DEBIT',
      amount: 200,
      reason: 'Bet participation: NFL Chiefs vs Ravens',
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5).toISOString(), // 5 days ago
      balanceBefore: 500,
      balanceAfter: 300,
      correlationId: 'bet-123-456'
    }
  ]);

  const handlePurchase = (item: StoreItemData) => {
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
              // Simulate API call delay
              await new Promise(resolve => setTimeout(resolve, 1000));
              setUserCredits(prev => prev - item.price);
              // In a real app, you'd update the item's owned status here
              setIsPurchasing(false);
              haptic.success();
              Alert.alert('Purchase Successful!', `You now own ${item.name}`);
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
  };

  const handlePreview = (item: StoreItemData) => {
    Alert.alert(
      'Item Preview',
      `Preview: ${item.name}\n\n${item.description}\n\nThis would show you exactly how this item looks and works before purchasing.`,
      [{ text: 'Close' }]
    );
  };

  const handleEarnCredits = (option: EarnCreditsOption) => {
    haptic.success();
    Alert.alert(
      'Earn Credits',
      `Complete: ${option.title}\n\nThis would navigate you to complete this action and earn ${option.credits} credits.`,
      [{ text: 'Close' }]
    );
    setEarnCreditsModalVisible(false);
  };

  const handleTransactionHistory = () => {
    setTransactionHistoryVisible(true);
  };

  const currentItems = storeItems[activeCategory] || [];

  const renderStoreItem = ({ item, index }: { item: StoreItemData; index: number }) => (
    <View style={{ 
      width: '48%',
      marginLeft: index % 2 === 0 ? 0 : '4%'
    }}>
      <StoreItem
        item={item}
        userCredits={userCredits}
        onPurchase={handlePurchase}
      />
    </View>
  );

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
          {fetchingCredits ? (
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
                  const ITEM_HEIGHT = 220; // Estimated height of StoreItem card
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
    </View>
  );
}