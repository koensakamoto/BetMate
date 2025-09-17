import React, { useState } from 'react';
import { Text, View, ScrollView, StatusBar, FlatList, Alert, Platform, TouchableOpacity } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import StoreHeader from '../../components/store/StoreHeader';
import StoreCategoryTabs, { StoreCategory } from '../../components/store/StoreCategoryTabs';
import StoreItem, { StoreItemData } from '../../components/store/StoreItem';
import EarnCreditsModal from '../../components/store/EarnCreditsModal';
import { storeItems, EarnCreditsOption } from '../../components/store/storeData';

export default function Store() {
  // Use platform-specific safe area fallbacks
  const topPadding = Platform.OS === 'ios' ? 50 : 20;
  const [activeCategory, setActiveCategory] = useState<StoreCategory>('featured');
  const [userCredits, setUserCredits] = useState(425); // Mock user credits
  const [earnCreditsModalVisible, setEarnCreditsModalVisible] = useState(false);

  const handlePurchase = (item: StoreItemData) => {
    if (userCredits >= item.price && !item.isOwned) {
      Alert.alert(
        'Confirm Purchase',
        `Purchase ${item.name} for ${item.price} credits?`,
        [
          { text: 'Cancel', style: 'cancel' },
          { 
            text: 'Buy', 
            onPress: () => {
              setUserCredits(prev => prev - item.price);
              // In a real app, you'd update the item's owned status here
              Alert.alert('Purchase Successful!', `You now own ${item.name}`);
            }
          }
        ]
      );
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
    Alert.alert(
      'Earn Credits',
      `Complete: ${option.title}\n\nThis would navigate you to complete this action and earn ${option.credits} credits.`,
      [{ text: 'Close' }]
    );
    setEarnCreditsModalVisible(false);
  };

  const handleTransactionHistory = () => {
    Alert.alert(
      'Transaction History',
      'This would show your purchase and earning history.',
      [{ text: 'Close' }]
    );
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

  return (
    <View style={{ flex: 1, backgroundColor: '#0a0a0f' }}>
      <StatusBar
        barStyle="light-content"
        backgroundColor="#0a0a0f"
        translucent={true}
      />
      
      <ScrollView 
        style={{ flex: 1 }} 
        contentContainerStyle={{ paddingTop: topPadding + 8 }}
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
          onCategoryChange={setActiveCategory}
        />

        {/* Items Grid */}
        <View style={{ paddingHorizontal: 20 }}>
          <FlatList
            data={currentItems}
            renderItem={renderStoreItem}
            keyExtractor={(item) => item.id}
            numColumns={2}
            scrollEnabled={false}
            contentContainerStyle={{ paddingBottom: 24 }}
            columnWrapperStyle={{ justifyContent: 'space-between' }}
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

        </View>
      </ScrollView>

      {/* Earn Credits Modal */}
      <EarnCreditsModal
        visible={earnCreditsModalVisible}
        onClose={() => setEarnCreditsModalVisible(false)}
        onEarnCredits={handleEarnCredits}
      />
    </View>
  );
}