import React, { useMemo } from 'react';
import { View, Text, Modal, TouchableOpacity, ScrollView, Dimensions } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { InventoryItemResponse } from '../../services/store/storeService';
import { haptic } from '../../utils/haptics';

interface InventoryItemDetailSheetProps {
  visible: boolean;
  item: InventoryItemResponse | null;
  onClose: () => void;
  onEquip: (item: InventoryItemResponse) => void;
  onUnequip: (item: InventoryItemResponse) => void;
}

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

export default function InventoryItemDetailSheet({
  visible,
  item,
  onClose,
  onEquip,
  onUnequip
}: InventoryItemDetailSheetProps) {
  const insets = useSafeAreaInsets();

  const rarityStyles = useMemo(() => {
    if (!item) return { color: '#9CA3AF', bgColor: 'rgba(156, 163, 175, 0.15)' };

    const getRarityColor = (rarity: string) => {
      switch (rarity) {
        case 'COMMON': return '#9CA3AF';
        case 'UNCOMMON': return '#10B981';
        case 'RARE': return '#3B82F6';
        case 'EPIC': return '#8B5CF6';
        case 'LEGENDARY': return '#F59E0B';
        default: return '#9CA3AF';
      }
    };

    const getRarityBgColor = (rarity: string) => {
      switch (rarity) {
        case 'COMMON': return 'rgba(156, 163, 175, 0.15)';
        case 'UNCOMMON': return 'rgba(16, 185, 129, 0.15)';
        case 'RARE': return 'rgba(59, 130, 246, 0.15)';
        case 'EPIC': return 'rgba(139, 92, 246, 0.15)';
        case 'LEGENDARY': return 'rgba(245, 158, 11, 0.15)';
        default: return 'rgba(156, 163, 175, 0.15)';
      }
    };

    return {
      color: getRarityColor(item.rarity),
      bgColor: getRarityBgColor(item.rarity)
    };
  }, [item?.rarity]);

  if (!item) return null;

  const handleToggleEquip = () => {
    haptic.medium();

    // For insurance items and other bet-applicable items, navigate to bet selection
    if (item.itemType.includes('INSURANCE')) {
      router.push(`/inventory/${item.id}/apply-to-bet`);
      onClose();
      return;
    }

    // For cosmetic items, handle equip/unequip
    if (item.isEquipped) {
      onUnequip(item);
    } else {
      onEquip(item);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={{
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        justifyContent: 'flex-end'
      }}>
        {/* Backdrop - tap to close */}
        <TouchableOpacity
          style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
          activeOpacity={1}
          onPress={onClose}
        />

        {/* Bottom Sheet */}
        <View style={{
          backgroundColor: '#1a1a1f',
          borderTopLeftRadius: 24,
          borderTopRightRadius: 24,
          maxHeight: SCREEN_HEIGHT * 0.85
        }}>
          {/* Drag Handle */}
          <View style={{
            alignItems: 'center',
            paddingTop: 12,
            paddingBottom: 8
          }}>
            <View style={{
              width: 40,
              height: 4,
              borderRadius: 2,
              backgroundColor: 'rgba(255, 255, 255, 0.3)'
            }} />
          </View>

          <ScrollView
            style={{ maxHeight: SCREEN_HEIGHT * 0.85 - 180 }}
            contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 8, paddingBottom: 16 }}
            showsVerticalScrollIndicator={false}
            bounces={true}
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
                <MaterialIcons name={(item.iconUrl || 'stars') as any} size={56} color={rarityStyles.color} />
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
                {item.itemName}
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
                  fontWeight: '600',
                  textTransform: 'capitalize'
                }}>
                  {item.itemType.toLowerCase().replace('_', ' ')}
                </Text>
              </View>

              {/* Purchased Date */}
              <View style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                marginBottom: 10
              }}>
                <Text style={{
                  fontSize: 13,
                  color: 'rgba(255, 255, 255, 0.6)'
                }}>
                  Purchased
                </Text>
                <Text style={{
                  fontSize: 13,
                  color: '#ffffff',
                  fontWeight: '600'
                }}>
                  {formatDate(item.purchasedAt)}
                </Text>
              </View>

              {/* Purchase Price */}
              <View style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <Text style={{
                  fontSize: 13,
                  color: 'rgba(255, 255, 255, 0.6)'
                }}>
                  Purchase Price
                </Text>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <MaterialIcons name="monetization-on" size={16} color="#FFD700" />
                  <Text style={{
                    fontSize: 16,
                    fontWeight: '700',
                    color: '#FFD700',
                    marginLeft: 4
                  }}>
                    {item.purchasePrice}
                  </Text>
                </View>
              </View>
            </View>

            {/* Status if equipped */}
            {item.isEquipped && item.equippedAt && (
              <View style={{
                backgroundColor: 'rgba(0, 212, 170, 0.15)',
                borderRadius: 12,
                padding: 16,
                marginBottom: 20,
                borderWidth: 1,
                borderColor: 'rgba(0, 212, 170, 0.3)',
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <MaterialIcons name="check-circle" size={20} color="#00D4AA" />
                <Text style={{
                  fontSize: 15,
                  fontWeight: '700',
                  color: '#00D4AA',
                  marginLeft: 8
                }}>
                  Currently Active
                </Text>
              </View>
            )}
          </ScrollView>

          {/* Bottom Action Bar */}
          <View style={{
            paddingHorizontal: 24,
            paddingTop: 16,
            paddingBottom: Math.max(insets.bottom, 16),
            borderTopWidth: 1,
            borderTopColor: 'rgba(255, 255, 255, 0.1)',
            gap: 12,
            backgroundColor: '#1a1a1f'
          }}>
            {/* Equip/Unequip Button - hidden for booster items */}
            {!item.itemType.endsWith('_BOOSTER') ? (
              <TouchableOpacity
                onPress={handleToggleEquip}
                style={{
                  backgroundColor: item.isEquipped ? 'rgba(239, 68, 68, 0.15)' : '#00D4AA',
                  borderRadius: 16,
                  paddingVertical: 16,
                  alignItems: 'center',
                  shadowColor: item.isEquipped ? 'transparent' : '#00D4AA',
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.3,
                  shadowRadius: 8,
                  elevation: 8,
                  borderWidth: item.isEquipped ? 1 : 0,
                  borderColor: item.isEquipped ? 'rgba(239, 68, 68, 0.4)' : 'transparent'
                }}
                activeOpacity={0.8}
              >
                <Text style={{
                  fontSize: 16,
                  fontWeight: '700',
                  color: item.isEquipped ? '#EF4444' : '#000000'
                }}>
                  {item.itemType.includes('INSURANCE')
                    ? 'Apply to Bet'
                    : item.isEquipped ? 'Unequip Item' : 'Activate Item'}
                </Text>
              </TouchableOpacity>
            ) : (
              <View style={{
                backgroundColor: 'rgba(255, 255, 255, 0.04)',
                borderRadius: 16,
                paddingVertical: 16,
                alignItems: 'center',
                borderWidth: 1,
                borderColor: 'rgba(255, 255, 255, 0.08)'
              }}>
                <Text style={{
                  fontSize: 14,
                  fontWeight: '600',
                  color: 'rgba(255, 255, 255, 0.6)'
                }}>
                  This item activates automatically upon purchase
                </Text>
              </View>
            )}

            {/* Close Button */}
            <TouchableOpacity
              onPress={onClose}
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
              }}>
                Close
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}
