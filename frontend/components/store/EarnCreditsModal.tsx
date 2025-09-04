import React from 'react';
import { Text, View, TouchableOpacity, ScrollView, Modal } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { earnCreditsOptions, EarnCreditsOption } from './storeData';

interface EarnCreditsModalProps {
  visible: boolean;
  onClose: () => void;
  onEarnCredits: (option: EarnCreditsOption) => void;
}

export default function EarnCreditsModal({ visible, onClose, onEarnCredits }: EarnCreditsModalProps) {
  const renderEarnOption = (option: EarnCreditsOption) => {
    const getStatusColor = () => {
      if (option.isCompleted) return '#00D4AA';
      if (!option.isAvailable) return 'rgba(255, 255, 255, 0.4)';
      return '#FFD700';
    };

    const getStatusText = () => {
      if (option.isCompleted) return 'Completed';
      if (!option.isAvailable) return 'Unavailable';
      return 'Available';
    };

    return (
      <TouchableOpacity
        key={option.id}
        onPress={() => option.isAvailable && !option.isCompleted ? onEarnCredits(option) : null}
        style={{
          backgroundColor: 'rgba(255, 255, 255, 0.03)',
          borderRadius: 16,
          padding: 20,
          marginBottom: 16,
          borderWidth: 0.5,
          borderColor: option.type === 'challenge' ? 'rgba(255, 215, 0, 0.3)' : 'rgba(255, 255, 255, 0.08)',
          opacity: option.isCompleted || !option.isAvailable ? 0.7 : 1
        }}
        activeOpacity={0.8}
        disabled={option.isCompleted || !option.isAvailable}
      >
        <View style={{
          flexDirection: 'row',
          alignItems: 'flex-start',
          justifyContent: 'space-between'
        }}>
          {/* Left side - Icon and info */}
          <View style={{
            flexDirection: 'row',
            alignItems: 'flex-start',
            flex: 1
          }}>
            {/* Icon */}
            <View style={{
              width: 52,
              height: 52,
              backgroundColor: 'rgba(255, 255, 255, 0.06)',
              borderRadius: 16,
              alignItems: 'center',
              justifyContent: 'center',
              marginRight: 16,
              borderWidth: 0.5,
              borderColor: 'rgba(255, 255, 255, 0.1)'
            }}>
              <Text style={{ fontSize: 26 }}>
                {option.emoji}
              </Text>
            </View>

            {/* Info */}
            <View style={{ flex: 1 }}>
              <Text style={{
                fontSize: 16,
                fontWeight: '600',
                color: '#ffffff',
                marginBottom: 4,
                letterSpacing: 0.2
              }}>
                {option.title}
              </Text>
              
              <Text style={{
                fontSize: 13,
                color: 'rgba(255, 255, 255, 0.7)',
                marginBottom: 8,
                lineHeight: 18
              }}>
                {option.description}
              </Text>

              {/* Type badge */}
              <View style={{
                backgroundColor: 'rgba(255, 255, 255, 0.06)',
                paddingHorizontal: 8,
                paddingVertical: 3,
                borderRadius: 10,
                alignSelf: 'flex-start',
                borderWidth: 0.5,
                borderColor: 'rgba(255, 255, 255, 0.1)'
              }}>
                <Text style={{
                  fontSize: 10,
                  color: 'rgba(255, 255, 255, 0.6)',
                  fontWeight: '600',
                  textTransform: 'uppercase',
                  letterSpacing: 0.5
                }}>
                  {option.type}
                </Text>
              </View>
            </View>
          </View>

          {/* Right side - Credits and status */}
          <View style={{ 
            alignItems: 'flex-end',
            marginLeft: 12
          }}>
            {/* Credits */}
            <View style={{
              flexDirection: 'row',
              alignItems: 'center',
              marginBottom: 8,
              backgroundColor: 'rgba(255, 215, 0, 0.1)',
              paddingHorizontal: 8,
              paddingVertical: 4,
              borderRadius: 12
            }}>
              <MaterialIcons name="monetization-on" size={16} color="#FFD700" />
              <Text style={{
                fontSize: 16,
                fontWeight: '700',
                color: '#FFD700',
                marginLeft: 4
              }}>
                +{option.credits}
              </Text>
            </View>

            {/* Status */}
            <View style={{
              backgroundColor: option.isCompleted ? 'rgba(0, 212, 170, 0.15)' : 'rgba(255, 255, 255, 0.08)',
              paddingHorizontal: 10,
              paddingVertical: 4,
              borderRadius: 12,
              borderWidth: 0.5,
              borderColor: option.isCompleted ? 'rgba(0, 212, 170, 0.3)' : 'rgba(255, 255, 255, 0.15)'
            }}>
              <Text style={{
                fontSize: 10,
                fontWeight: '600',
                color: getStatusColor(),
                letterSpacing: 0.3,
                textTransform: 'uppercase'
              }}>
                {getStatusText()}
              </Text>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={{
        flex: 1,
        backgroundColor: '#0a0a0f'
      }}>
        {/* Header */}
        <View style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingHorizontal: 20,
          paddingVertical: 16,
          borderBottomWidth: 1,
          borderBottomColor: 'rgba(255, 255, 255, 0.1)'
        }}>
          <Text style={{
            fontSize: 24,
            fontWeight: '700',
            color: '#ffffff'
          }}>
            Earn Credits
          </Text>
          
          <TouchableOpacity
            onPress={onClose}
            style={{
              width: 32,
              height: 32,
              borderRadius: 16,
              backgroundColor: 'rgba(255, 255, 255, 0.08)',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <MaterialIcons name="close" size={20} color="#ffffff" />
          </TouchableOpacity>
        </View>

        {/* Content */}
        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 20 }}>
          {/* Description */}
          <Text style={{
            fontSize: 16,
            color: 'rgba(255, 255, 255, 0.7)',
            lineHeight: 22,
            marginBottom: 24,
            textAlign: 'center'
          }}>
            Complete these activities to earn credits and unlock premium features
          </Text>

          {/* Earn Options */}
          {earnCreditsOptions.map(renderEarnOption)}

          {/* Footer note */}
          <Text style={{
            fontSize: 14,
            color: 'rgba(255, 255, 255, 0.5)',
            textAlign: 'center',
            marginTop: 20,
            lineHeight: 20
          }}>
            More ways to earn credits coming soon! Stay tuned for special events and bonus opportunities.
          </Text>
        </ScrollView>
      </View>
    </Modal>
  );
}