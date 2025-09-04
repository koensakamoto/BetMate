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

          {/* Premium Bundle Section */}
          <View style={{
            backgroundColor: 'rgba(255, 255, 255, 0.02)',
            borderRadius: 24,
            padding: 28,
            marginTop: 40,
            marginBottom: 40,
            borderWidth: 1,
            borderColor: 'rgba(255, 215, 0, 0.15)',
            shadowColor: '#FFD700',
            shadowOffset: { width: 0, height: 8 },
            shadowOpacity: 0.08,
            shadowRadius: 16,
            elevation: 6
          }}>
            {/* Header */}
            <View style={{
              alignItems: 'center',
              marginBottom: 24
            }}>
              <View style={{
                width: 56,
                height: 56,
                borderRadius: 28,
                backgroundColor: 'rgba(255, 215, 0, 0.1)',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 12,
                borderWidth: 1,
                borderColor: 'rgba(255, 215, 0, 0.2)'
              }}>
                <Text style={{ fontSize: 28 }}>🎁</Text>
              </View>
              
              <Text style={{
                fontSize: 22,
                fontWeight: '800',
                color: '#ffffff',
                marginBottom: 8,
                letterSpacing: 0.5
              }}>
                Bundle Deals
              </Text>
              
              <Text style={{
                fontSize: 14,
                color: 'rgba(255, 255, 255, 0.6)',
                textAlign: 'center',
                lineHeight: 20
              }}>
                Exclusive packages with massive savings
              </Text>
            </View>

            {/* Premium Bundle Card */}
            <View style={{
              backgroundColor: 'rgba(255, 215, 0, 0.06)',
              padding: 20,
              borderRadius: 20,
              borderWidth: 1,
              borderColor: 'rgba(255, 215, 0, 0.2)',
              marginBottom: 16
            }}>
              <View style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: 12
              }}>
                <Text style={{
                  fontSize: 18,
                  fontWeight: '700',
                  color: '#FFD700'
                }}>
                  Social Starter Pack
                </Text>
                
                <View style={{
                  backgroundColor: 'rgba(239, 68, 68, 0.9)',
                  paddingHorizontal: 8,
                  paddingVertical: 4,
                  borderRadius: 12
                }}>
                  <Text style={{
                    fontSize: 10,
                    fontWeight: '700',
                    color: '#ffffff',
                    letterSpacing: 0.3
                  }}>
                    -30% OFF
                  </Text>
                </View>
              </View>
              
              <Text style={{
                fontSize: 15,
                color: '#ffffff',
                marginBottom: 8,
                lineHeight: 20
              }}>
                3 Social Items + Premium Roast Pack
              </Text>
              
              <View style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}>
                <Text style={{
                  fontSize: 13,
                  color: 'rgba(255, 255, 255, 0.6)'
                }}>
                  Save 125 credits • Best value for new players
                </Text>
                
                <View style={{
                  flexDirection: 'row',
                  alignItems: 'center'
                }}>
                  <MaterialIcons name="monetization-on" size={16} color="#FFD700" />
                  <Text style={{
                    fontSize: 18,
                    fontWeight: '700',
                    color: '#FFD700',
                    marginLeft: 4
                  }}>
                    300
                  </Text>
                </View>
              </View>
            </View>

            {/* CTA Button */}
            <TouchableOpacity
              style={{
                backgroundColor: '#FFD700',
                paddingVertical: 16,
                borderRadius: 20,
                alignItems: 'center',
                shadowColor: '#FFD700',
                shadowOffset: { width: 0, height: 6 },
                shadowOpacity: 0.2,
                shadowRadius: 12,
                elevation: 6
              }}
            >
              <Text style={{
                fontSize: 16,
                fontWeight: '700',
                color: '#000000',
                letterSpacing: 0.4
              }}>
                Get Bundle Deal
              </Text>
            </TouchableOpacity>
          </View>
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