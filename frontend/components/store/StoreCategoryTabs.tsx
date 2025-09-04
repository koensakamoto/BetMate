import React from 'react';
import { Text, View, TouchableOpacity, ScrollView } from 'react-native';

export type StoreCategory = 'featured' | 'social' | 'progression' | 'customization';

interface StoreCategoryTabsProps {
  activeCategory: StoreCategory;
  onCategoryChange: (category: StoreCategory) => void;
}

const categories = [
  { id: 'featured' as StoreCategory, name: 'Featured' },
  { id: 'social' as StoreCategory, name: 'Social' },
  { id: 'progression' as StoreCategory, name: 'Progression' },
  { id: 'customization' as StoreCategory, name: 'Customization' }
];

export default function StoreCategoryTabs({ activeCategory, onCategoryChange }: StoreCategoryTabsProps) {
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