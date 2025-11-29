import React, { useMemo } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { StoreItemData } from './StoreItem';
import { haptic } from '../../utils/haptics';
import { getRarityColors } from '../../utils/rarityUtils';
import AppBottomSheet from '../common/AppBottomSheet';

interface StoreItemDetailSheetProps {
  visible: boolean;
  item: StoreItemData | null;
  userCredits: number;
  onClose: () => void;
  onPurchase: (item: StoreItemData) => void;
}

export default function StoreItemDetailSheet({
  visible,
  item,
  userCredits,
  onClose,
  onPurchase
}: StoreItemDetailSheetProps) {
  const rarityStyles = useMemo(() => {
    if (!item) return { color: '#9CA3AF', bgColor: 'rgba(156, 163, 175, 0.15)' };
    return getRarityColors(item.rarity);
  }, [item?.rarity]);

  if (!item) return null;

  const canAfford = userCredits >= item.price;

  const handlePurchase = () => {
    haptic.medium();
    onPurchase(item);
    onClose();
  };

  const bottomAction = (
    <View style={{ gap: 12 }}>
      {/* Purchase Button */}
      {!item.isOwned && (
        <TouchableOpacity
          onPress={handlePurchase}
          disabled={!canAfford}
          accessible={true}
          accessibilityRole="button"
          accessibilityLabel={canAfford ? `Buy for ${item.price} credits` : 'Insufficient credits'}
          accessibilityState={{ disabled: !canAfford }}
          accessibilityHint={canAfford ? "Double tap to purchase this item" : undefined}
          style={{
            backgroundColor: canAfford ? '#00D4AA' : 'rgba(255, 255, 255, 0.08)',
            borderRadius: 16,
            paddingVertical: 16,
            alignItems: 'center',
            shadowColor: canAfford ? '#00D4AA' : 'transparent',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.3,
            shadowRadius: 8,
            elevation: 8,
            borderWidth: canAfford ? 0 : 1,
            borderColor: 'rgba(255, 255, 255, 0.15)'
          }}
          activeOpacity={0.8}
        >
          <Text style={{
            fontSize: 16,
            fontWeight: '700',
            color: canAfford ? '#000000' : 'rgba(255, 255, 255, 0.5)'
          }} accessible={false}>
            {canAfford ? `Buy for ${item.price} credits` : 'Insufficient credits'}
          </Text>
        </TouchableOpacity>
      )}

      {/* Close Button */}
      <TouchableOpacity
        onPress={onClose}
        accessible={true}
        accessibilityRole="button"
        accessibilityLabel="Close"
        accessibilityHint="Double tap to close this sheet"
        style={{
          backgroundColor: 'rgba(255, 255, 255, 0.08)',
          borderRadius: 16,
          paddingVertical: 14,
          alignItems: 'center',
          borderWidth: 1,
          borderColor: 'rgba(255, 255, 255, 0.15)'
        }}
        activeOpacity={0.8}
      >
        <Text style={{
          fontSize: 15,
          fontWeight: '600',
          color: '#ffffff'
        }} accessible={false}>
          Close
        </Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <AppBottomSheet
      visible={visible}
      onClose={onClose}
      snapPoints={['85%']}
      bottomAction={bottomAction}
    >
      {/* Header with Icon */}
      <View style={{
        alignItems: 'center',
        marginBottom: 24
      }}>
        {/* Large Icon */}
        <View style={{
          width: 100,
          height: 100,
          backgroundColor: 'rgba(255, 255, 255, 0.06)',
          borderRadius: 24,
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: 16,
          borderWidth: 2,
          borderColor: rarityStyles.color,
          position: 'relative',
          shadowColor: rarityStyles.color,
          shadowOffset: { width: 0, height: 8 },
          shadowOpacity: 0.3,
          shadowRadius: 16,
          elevation: 8
        }}>
          <MaterialIcons name={item.icon as any} size={56} color={rarityStyles.color} />
          {/* Glow effect */}
          <View style={{
            position: 'absolute',
            bottom: -1,
            left: -1,
            right: -1,
            height: 4,
            backgroundColor: rarityStyles.color,
            borderBottomLeftRadius: 24,
            borderBottomRightRadius: 24,
            opacity: 0.8
          }} />
        </View>

        {/* Item Name */}
        <Text style={{
          fontSize: 22,
          fontWeight: '700',
          color: '#ffffff',
          textAlign: 'center',
          marginBottom: 8,
          letterSpacing: 0.3
        }}>
          {item.name}
        </Text>

        {/* Rarity Badge */}
        <View style={{
          backgroundColor: rarityStyles.bgColor,
          paddingHorizontal: 12,
          paddingVertical: 5,
          borderRadius: 8,
          borderWidth: 1,
          borderColor: rarityStyles.color
        }}>
          <Text style={{
            fontSize: 11,
            fontWeight: '700',
            color: rarityStyles.color,
            textTransform: 'uppercase',
            letterSpacing: 1
          }}>
            {item.rarity}
          </Text>
        </View>
      </View>

      {/* Description Section */}
      <View style={{
        backgroundColor: 'rgba(255, 255, 255, 0.04)',
        borderRadius: 16,
        padding: 16,
        marginBottom: 20,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.08)'
      }}>
        <Text style={{
          fontSize: 15,
          fontWeight: '600',
          color: '#ffffff',
          marginBottom: 8
        }}>
          Description
        </Text>
        <Text style={{
          fontSize: 14,
          color: 'rgba(255, 255, 255, 0.8)',
          lineHeight: 22
        }}>
          {item.description}
        </Text>
      </View>

      {/* Details Grid */}
      <View style={{
        backgroundColor: 'rgba(255, 255, 255, 0.04)',
        borderRadius: 16,
        padding: 16,
        marginBottom: 20,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.08)'
      }}>
        <Text style={{
          fontSize: 15,
          fontWeight: '600',
          color: '#ffffff',
          marginBottom: 12
        }}>
          Item Details
        </Text>

        {/* Type */}
        <View style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          marginBottom: 10
        }}>
          <Text style={{
            fontSize: 13,
            color: 'rgba(255, 255, 255, 0.6)'
          }}>
            Type
          </Text>
          <Text style={{
            fontSize: 13,
            color: '#ffffff',
            fontWeight: '600'
          }}>
            {item.itemType}
          </Text>
        </View>

        {/* Category */}
        <View style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          marginBottom: 10
        }}>
          <Text style={{
            fontSize: 13,
            color: 'rgba(255, 255, 255, 0.6)'
          }}>
            Category
          </Text>
          <Text style={{
            fontSize: 13,
            color: '#ffffff',
            fontWeight: '600'
          }}>
            {item.category}
          </Text>
        </View>

        {/* Price */}
        <View style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <Text style={{
            fontSize: 13,
            color: 'rgba(255, 255, 255, 0.6)'
          }}>
            Price
          </Text>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <MaterialIcons name="monetization-on" size={16} color="#FFD700" />
            <Text style={{
              fontSize: 16,
              fontWeight: '700',
              color: '#FFD700',
              marginLeft: 4
            }}>
              {item.price}
            </Text>
          </View>
        </View>
      </View>

      {/* Status if owned */}
      {item.isOwned && (
        <View
          style={{
            backgroundColor: 'rgba(0, 212, 170, 0.15)',
            borderRadius: 12,
            padding: 16,
            marginBottom: 20,
            borderWidth: 1,
            borderColor: 'rgba(0, 212, 170, 0.3)',
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center'
          }}
          accessible={true}
          accessibilityRole="text"
          accessibilityLabel="You own this item"
        >
          <MaterialIcons name="check-circle" size={20} color="#00D4AA" accessible={false} />
          <Text style={{
            fontSize: 15,
            fontWeight: '700',
            color: '#00D4AA',
            marginLeft: 8
          }} accessible={false}>
            You own this item
          </Text>
        </View>
      )}
    </AppBottomSheet>
  );
}
