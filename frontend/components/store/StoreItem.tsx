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
  emoji?: string; // Deprecated, use icon instead
  icon: string; // MaterialIcons name
  itemType: ItemType;
  category: ItemCategory;
  rarity: Rarity;
  isOwned: boolean;
  isActive?: boolean;
  isFeatured?: boolean;
  isLimitedTime?: boolean;
  availableUntil?: string;
  sortOrder?: number;
  usesRemaining?: number;
  activatedAt?: string;
}

interface StoreItemProps {
  item: StoreItemData;
  userCredits: number;
  onPurchase: (item: StoreItemData) => void;
  onPress?: (item: StoreItemData) => void;
}

function StoreItem({ item, userCredits, onPurchase, onPress }: StoreItemProps) {
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
    <TouchableOpacity
      onPress={() => {
        haptic.light();
        onPress?.(item);
      }}
      activeOpacity={0.7}
      style={{
        backgroundColor: 'rgba(255, 255, 255, 0.02)',
        borderRadius: 16,
        padding: 14,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: rarityStyles.color,
        opacity: item.isOwned ? 0.8 : 1,
        position: 'relative',
        shadowColor: rarityStyles.color,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 3,
        height: 240
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

      {/* Item Icon */}
      <View style={{
        alignItems: 'center',
        marginBottom: 16
      }}>
        <View style={{
          width: 72,
          height: 72,
          backgroundColor: 'rgba(255, 255, 255, 0.06)',
          borderRadius: 18,
          alignItems: 'center',
          justifyContent: 'center',
          borderWidth: 1,
          borderColor: 'rgba(255, 255, 255, 0.1)',
          position: 'relative'
        }}>
          <MaterialIcons name={item.icon as any} size={36} color={rarityStyles.color} />
          {/* Rarity accent bar */}
          <View style={{
            position: 'absolute',
            bottom: -1,
            left: -1,
            right: -1,
            height: 3,
            backgroundColor: rarityStyles.color,
            borderBottomLeftRadius: 18,
            borderBottomRightRadius: 18,
            opacity: 0.8
          }} />
        </View>
      </View>

      {/* Item Info */}
      <View style={{
        marginBottom: 16,
        height: 44
      }}>
        {/* Item Name */}
        <Text style={{
          fontSize: 15,
          fontWeight: '700',
          color: '#ffffff',
          textAlign: 'center',
          letterSpacing: 0.2
        }} numberOfLines={2}>
          {item.name}
        </Text>
      </View>

      {/* Price and Action */}
      <View style={{
        alignItems: 'center',
        gap: 8
      }}>
        {/* Price */}
        <View style={{
          flexDirection: 'row',
          alignItems: 'center'
        }}>
          <MaterialIcons name="monetization-on" size={14} color="#FFD700" />
          <Text style={{
            fontSize: 16,
            fontWeight: '700',
            color: '#FFD700',
            marginLeft: 4
          }}>
            {item.price}
          </Text>
        </View>

        {/* Action Button */}
        {item.isOwned ? (
          // Show active status for Daily Bonus Doublers
          item.itemType === ItemType.DAILY_BOOSTER && item.usesRemaining && item.usesRemaining > 0 ? (
            <View style={{
              backgroundColor: 'rgba(0, 212, 170, 0.2)',
              paddingHorizontal: 12,
              paddingVertical: 6,
              borderRadius: 12,
              borderWidth: 1,
              borderColor: '#00D4AA',
              alignItems: 'center',
              shadowColor: '#00D4AA',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.3,
              shadowRadius: 4,
              elevation: 3
            }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 2 }}>
                <MaterialIcons name="flash-on" size={14} color="#00D4AA" />
                <Text style={{
                  fontSize: 11,
                  fontWeight: '700',
                  color: '#00D4AA',
                  marginLeft: 2
                }}>
                  ACTIVE
                </Text>
              </View>
              <Text style={{
                fontSize: 10,
                fontWeight: '500',
                color: 'rgba(0, 212, 170, 0.8)'
              }}>
                {item.usesRemaining} {item.usesRemaining === 1 ? 'day' : 'days'}
              </Text>
            </View>
          ) : (
            // Standard owned badge for other items
            <View style={{
              backgroundColor: 'rgba(0, 212, 170, 0.15)',
              paddingHorizontal: 14,
              paddingVertical: 7,
              borderRadius: 12,
              flexDirection: 'row',
              alignItems: 'center'
            }}>
              <MaterialIcons name="check" size={12} color="#00D4AA" />
              <Text style={{
                fontSize: 11,
                fontWeight: '600',
                color: '#00D4AA',
                marginLeft: 4
              }}>
                Owned
              </Text>
            </View>
          )
        ) : (
          <TouchableOpacity
            onPress={(e) => {
              e.stopPropagation();
              haptic.medium();
              onPurchase(item);
            }}
            style={{
              backgroundColor: canAfford ? '#00D4AA' : 'rgba(255, 255, 255, 0.08)',
              paddingHorizontal: 18,
              paddingVertical: 8,
              borderRadius: 12,
              alignItems: 'center',
              borderWidth: canAfford ? 0 : 0.5,
              borderColor: 'rgba(255, 255, 255, 0.15)',
              minWidth: 70
            }}
            disabled={!canAfford}
            activeOpacity={0.7}
          >
            <Text style={{
              fontSize: 12,
              fontWeight: '700',
              color: canAfford ? '#000000' : 'rgba(255, 255, 255, 0.5)'
            }}>
              Buy
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </TouchableOpacity>
  );
}

export default React.memo(StoreItem);