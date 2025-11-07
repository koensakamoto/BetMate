import React, { useMemo } from 'react';
import { Text, View, TouchableOpacity } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

import { ItemType, ItemCategory, Rarity } from './storeData';
import { haptic } from '../../utils/haptics';

export interface StoreItemData {
  id: string;
  name: string;
  description: string;
  price: number;
  emoji: string;
  itemType: ItemType;
  category: ItemCategory;
  rarity: Rarity;
  isOwned: boolean;
  isActive?: boolean;
  isFeatured?: boolean;
  isLimitedTime?: boolean;
  availableUntil?: string;
  sortOrder?: number;
}

interface StoreItemProps {
  item: StoreItemData;
  userCredits: number;
  onPurchase: (item: StoreItemData) => void;
}

function StoreItem({ item, userCredits, onPurchase }: StoreItemProps) {
  const canAfford = userCredits >= item.price;

  // Memoize rarity colors to avoid recalculation on every render
  const rarityStyles = useMemo(() => {
    const getRarityColor = (rarity: Rarity) => {
      switch (rarity) {
        case Rarity.COMMON: return '#9CA3AF';      // Gray
        case Rarity.UNCOMMON: return '#10B981';    // Green
        case Rarity.RARE: return '#3B82F6';        // Blue
        case Rarity.EPIC: return '#8B5CF6';        // Purple
        case Rarity.LEGENDARY: return '#F59E0B';   // Orange/Gold
      }
    };

    const getRarityBgColor = (rarity: Rarity) => {
      switch (rarity) {
        case Rarity.COMMON: return 'rgba(156, 163, 175, 0.15)';
        case Rarity.UNCOMMON: return 'rgba(16, 185, 129, 0.15)';
        case Rarity.RARE: return 'rgba(59, 130, 246, 0.15)';
        case Rarity.EPIC: return 'rgba(139, 92, 246, 0.15)';
        case Rarity.LEGENDARY: return 'rgba(245, 158, 11, 0.15)';
      }
    };

    return {
      color: getRarityColor(item.rarity),
      bgColor: getRarityBgColor(item.rarity)
    };
  }, [item.rarity]);

  return (
    <View
      style={{
        backgroundColor: 'rgba(255, 255, 255, 0.02)',
        borderRadius: 20,
        padding: 20,
        marginBottom: 20,
        borderWidth: 1,
        borderColor: rarityStyles.color,
        opacity: item.isOwned ? 0.8 : 1,
        position: 'relative',
        shadowColor: rarityStyles.color,
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
        elevation: 4
      }}
    >

      {/* Rarity Indicator */}
      <View style={{
        position: 'absolute',
        top: 8,
        right: 8,
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: rarityStyles.color,
        shadowColor: rarityStyles.color,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.6,
        shadowRadius: 4,
        elevation: 4,
        zIndex: 1
      }} />

      {/* Item Header */}
      <View style={{
        alignItems: 'center',
        marginBottom: 16
      }}>
        {/* Item Icon */}
        <View style={{
          width: 68,
          height: 68,
          backgroundColor: 'rgba(255, 255, 255, 0.06)',
          borderRadius: 20,
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: 16,
          borderWidth: 1,
          borderColor: 'rgba(255, 255, 255, 0.1)',
          position: 'relative'
        }}>
          <Text style={{ fontSize: 32 }}>
            {item.emoji}
          </Text>
          {/* Subtle rarity accent */}
          <View style={{
            position: 'absolute',
            bottom: -1,
            left: -1,
            right: -1,
            height: 3,
            backgroundColor: rarityStyles.color,
            borderBottomLeftRadius: 20,
            borderBottomRightRadius: 20,
            opacity: 0.8
          }} />
        </View>

        {/* Item Info */}
        <Text style={{
          fontSize: 15,
          fontWeight: '600',
          color: '#ffffff',
          marginBottom: 4,
          textAlign: 'center',
          letterSpacing: 0.2
        }} numberOfLines={1}>
          {item.name}
        </Text>
        
        <Text style={{
          fontSize: 12,
          color: 'rgba(255, 255, 255, 0.6)',
          lineHeight: 16,
          textAlign: 'center',
          paddingHorizontal: 4
        }} numberOfLines={2}>
          {item.description}
        </Text>

      </View>

      {/* Price and Action */}
      <View style={{
        alignItems: 'center',
        gap: 12
      }}>
        {/* Price */}
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <MaterialIcons name="monetization-on" size={16} color="#FFD700" />
          <View style={{ marginLeft: 4 }}>
            {item.discount ? (
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
                <Text style={{
                  fontSize: 12,
                  color: 'rgba(255, 255, 255, 0.5)',
                  textDecorationLine: 'line-through',
                  marginRight: 6
                }}>
                  {item.price}
                </Text>
                <Text style={{
                  fontSize: 18,
                  fontWeight: '700',
                  color: '#FFD700'
                }}>
                  {finalPrice}
                </Text>
              </View>
            ) : (
              <Text style={{
                fontSize: 18,
                fontWeight: '700',
                color: '#FFD700'
              }}>
                {item.price}
              </Text>
            )}
          </View>
        </View>

        {/* Action Button */}
        {item.isOwned ? (
          <View style={{
            backgroundColor: 'rgba(0, 212, 170, 0.15)',
            paddingHorizontal: 16,
            paddingVertical: 8,
            borderRadius: 16,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <MaterialIcons name="check" size={14} color="#00D4AA" />
            <Text style={{
              fontSize: 12,
              fontWeight: '600',
              color: '#00D4AA',
              marginLeft: 4
            }}>
              Owned
            </Text>
          </View>
        ) : (
          <TouchableOpacity
            onPress={(e) => {
              e.stopPropagation();
              haptic.medium();
              onPurchase(item);
            }}
            style={{
              backgroundColor: 'rgba(255, 255, 255, 0.08)',
              paddingHorizontal: 16,
              paddingVertical: 8,
              borderRadius: 16,
              alignItems: 'center',
              borderWidth: 0.5,
              borderColor: 'rgba(255, 255, 255, 0.15)',
              opacity: canAfford ? 1 : 0.4
            }}
            disabled={!canAfford}
            activeOpacity={0.7}
          >
            <Text style={{
              fontSize: 12,
              fontWeight: '600',
              color: canAfford ? '#ffffff' : 'rgba(255, 255, 255, 0.5)'
            }}>
              Buy
            </Text>
          </TouchableOpacity>
        )}
      </View>

    </View>
  );
}

export default React.memo(StoreItem);