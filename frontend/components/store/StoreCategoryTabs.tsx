import React from 'react';
import { Text, View, TouchableOpacity, ScrollView } from 'react-native';

export type StoreCategory = 'risk' | 'multipliers' | 'tools' | 'discounts' | 'boosters';

interface StoreCategoryTabsProps {
  activeCategory: StoreCategory;
  onCategoryChange: (category: StoreCategory) => void;
}

const categories = [
  { id: 'risk' as StoreCategory, name: 'Risk Management' },
  { id: 'multipliers' as StoreCategory, name: 'Multipliers' },
  { id: 'tools' as StoreCategory, name: 'Betting Tools' },
  { id: 'discounts' as StoreCategory, name: 'Discounts' },
  { id: 'boosters' as StoreCategory, name: 'Boosters' }
];

function StoreCategoryTabs({ activeCategory, onCategoryChange }: StoreCategoryTabsProps) {
  return (
    <View style={{ marginBottom: 20 }}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{
          paddingHorizontal: 20
        }}
      >
        <View style={{
          flexDirection: 'row',
          gap: 8
        }}>
          {categories.map((category) => {
            const isActive = activeCategory === category.id;

            return (
              <TouchableOpacity
                key={category.id}
                onPress={() => onCategoryChange(category.id)}
                style={{
                  backgroundColor: isActive ? '#00D4AA' : 'rgba(255, 255, 255, 0.08)',
                  paddingHorizontal: 16,
                  paddingVertical: 8,
                  borderRadius: 20,
                  borderWidth: isActive ? 0 : 0.5,
                  borderColor: 'rgba(255, 255, 255, 0.15)',
                  minWidth: 80,
                  alignItems: 'center'
                }}
              >
                <Text style={{
                  color: isActive ? '#000000' : '#ffffff',
                  fontSize: 13,
                  fontWeight: '600'
                }}>
                  {category.name}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>
    </View>
  );
}

export default React.memo(StoreCategoryTabs);