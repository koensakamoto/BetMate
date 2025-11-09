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
  const getCategoryColor = (type: string) => {
    switch(type) {
      case 'daily': return { primary: '#00D4AA', secondary: 'rgba(0, 212, 170, 0.6)', bg: 'rgba(0, 212, 170, 0.08)' };
      case 'action': return { primary: '#3B82F6', secondary: 'rgba(59, 130, 246, 0.6)', bg: 'rgba(59, 130, 246, 0.08)' };
      case 'social': return { primary: '#A78BFA', secondary: 'rgba(167, 139, 250, 0.6)', bg: 'rgba(167, 139, 250, 0.08)' };
      case 'challenge': return { primary: '#F59E0B', secondary: 'rgba(245, 158, 11, 0.6)', bg: 'rgba(245, 158, 11, 0.08)' };
      default: return { primary: '#00D4AA', secondary: 'rgba(0, 212, 170, 0.6)', bg: 'rgba(0, 212, 170, 0.08)' };
    }
  };

  const getCategoryIcon = (type: string) => {
    switch(type) {
      case 'daily': return 'event-repeat';
      case 'action': return 'bolt';
      case 'social': return 'people';
      case 'challenge': return 'emoji-events';
      default: return 'star';
    }
  };

  // Group options by type
  const groupedOptions = earnCreditsOptions.reduce((acc, option) => {
    if (!acc[option.type]) acc[option.type] = [];
    acc[option.type].push(option);
    return acc;
  }, {} as Record<string, EarnCreditsOption[]>);

  const renderEarnOption = (option: EarnCreditsOption) => {
    const colors = getCategoryColor(option.type);
    const isActionable = option.isAvailable && !option.isCompleted;

    return (
      <TouchableOpacity
        key={option.id}
        onPress={() => isActionable ? onEarnCredits(option) : null}
        style={{
          marginBottom: 10,
          overflow: 'hidden',
          borderRadius: 16,
        }}
        activeOpacity={0.7}
        disabled={!isActionable}
      >
        <View style={{
          backgroundColor: option.isCompleted ? 'rgba(255, 255, 255, 0.03)' : 'rgba(255, 255, 255, 0.05)',
          borderRadius: 16,
          padding: 16,
          borderWidth: 1,
          borderColor: option.isCompleted ? 'rgba(255, 255, 255, 0.05)' : `${colors.primary}15`,
          opacity: option.isCompleted ? 0.5 : 1,
        }}>
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
              {/* Icon with colored background */}
              <View style={{
                width: 48,
                height: 48,
                borderRadius: 12,
                marginRight: 12,
                backgroundColor: option.isCompleted ? 'rgba(255, 255, 255, 0.04)' : colors.bg,
                alignItems: 'center',
                justifyContent: 'center',
                borderWidth: 1,
                borderColor: option.isCompleted ? 'rgba(255, 255, 255, 0.06)' : `${colors.primary}30`,
              }}>
                <MaterialIcons
                  name={getCategoryIcon(option.type) as any}
                  size={24}
                  color={option.isCompleted ? 'rgba(255, 255, 255, 0.4)' : colors.primary}
                />
              </View>

              {/* Info */}
              <View style={{ flex: 1, marginRight: 12 }}>
                <View style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: 6
                }}>
                  <Text style={{
                    fontSize: 16,
                    fontWeight: '600',
                    color: '#ffffff',
                    letterSpacing: 0.2,
                    flex: 1
                  }}>
                    {option.title}
                  </Text>
                  {/* Credits badge inline with title */}
                  <View style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    backgroundColor: option.isCompleted ? 'rgba(255, 255, 255, 0.1)' : colors.bg,
                    paddingHorizontal: 8,
                    paddingVertical: 4,
                    borderRadius: 8,
                    marginLeft: 8,
                    borderWidth: 1,
                    borderColor: option.isCompleted ? 'rgba(255, 255, 255, 0.15)' : `${colors.primary}25`
                  }}>
                    <MaterialIcons name="monetization-on" size={14} color={option.isCompleted ? 'rgba(255, 255, 255, 0.6)' : colors.primary} />
                    <Text style={{
                      fontSize: 13,
                      fontWeight: '700',
                      color: option.isCompleted ? 'rgba(255, 255, 255, 0.6)' : colors.primary,
                      marginLeft: 3
                    }}>
                      +{option.credits}
                    </Text>
                  </View>
                </View>

                <Text style={{
                  fontSize: 13,
                  color: 'rgba(255, 255, 255, 0.6)',
                  lineHeight: 18,
                  marginBottom: 8
                }}>
                  {option.description}
                </Text>

                {/* Action button below description */}
                {option.isCompleted ? (
                  <View style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    alignSelf: 'flex-start'
                  }}>
                    <MaterialIcons name="check-circle" size={16} color="#00D4AA" />
                    <Text style={{
                      fontSize: 12,
                      fontWeight: '600',
                      color: '#00D4AA',
                      marginLeft: 4
                    }}>
                      Completed
                    </Text>
                  </View>
                ) : option.isAvailable ? (
                  <View style={{
                    borderRadius: 8,
                    backgroundColor: colors.bg,
                    paddingHorizontal: 12,
                    paddingVertical: 7,
                    borderWidth: 1,
                    borderColor: `${colors.primary}40`,
                    alignSelf: 'flex-start'
                  }}>
                    <Text style={{
                      fontSize: 12,
                      fontWeight: '700',
                      color: colors.primary,
                      letterSpacing: 0.5
                    }}>
                      Claim Reward
                    </Text>
                  </View>
                ) : (
                  <View style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    alignSelf: 'flex-start'
                  }}>
                    <MaterialIcons name="lock" size={14} color="rgba(255, 255, 255, 0.4)" />
                    <Text style={{
                      fontSize: 12,
                      fontWeight: '600',
                      color: 'rgba(255, 255, 255, 0.4)',
                      marginLeft: 4
                    }}>
                      Locked
                    </Text>
                  </View>
                )}
              </View>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const renderSection = (type: string, options: EarnCreditsOption[]) => {
    const colors = getCategoryColor(type);

    return (
      <View key={type} style={{ marginBottom: 32 }}>
        {/* Section header */}
        <View style={{
          flexDirection: 'row',
          alignItems: 'center',
          marginBottom: 12,
          paddingHorizontal: 4
        }}>
          <View style={{
            width: 3,
            height: 14,
            borderRadius: 2,
            backgroundColor: colors.primary,
            marginRight: 8
          }} />
          <Text style={{
            fontSize: 13,
            fontWeight: '700',
            color: colors.primary,
            textTransform: 'uppercase',
            letterSpacing: 1.2,
          }}>
            {type}
          </Text>
        </View>

        {/* Options */}
        {options.map(renderEarnOption)}
      </View>
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
        {/* Enhanced Header */}
        <View style={{
          paddingTop: 60,
          paddingBottom: 24,
          paddingHorizontal: 20,
          borderBottomWidth: 1,
          borderBottomColor: 'rgba(255, 255, 255, 0.08)',
          backgroundColor: '#0a0a0f'
        }}>
            {/* Title and Close Button Row */}
            <View style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: 20
            }}>
              <View>
                <Text style={{
                  fontSize: 32,
                  fontWeight: '800',
                  color: '#ffffff',
                  letterSpacing: 0.5
                }}>
                  Earn Credits
                </Text>
                <Text style={{
                  fontSize: 14,
                  color: 'rgba(255, 255, 255, 0.6)',
                  marginTop: 4
                }}>
                  Complete tasks to unlock rewards
                </Text>
              </View>

              <TouchableOpacity
                onPress={onClose}
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 20,
                  backgroundColor: 'rgba(255, 255, 255, 0.1)',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderWidth: 1,
                  borderColor: 'rgba(255, 255, 255, 0.15)'
                }}
              >
                <MaterialIcons name="close" size={22} color="#ffffff" />
              </TouchableOpacity>
            </View>

        </View>

        {/* Content */}
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ padding: 20, paddingBottom: 40 }}
          showsVerticalScrollIndicator={false}
        >
          {/* Render grouped sections */}
          {Object.entries(groupedOptions).map(([type, options]) =>
            renderSection(type, options)
          )}
        </ScrollView>
      </View>
    </Modal>
  );
}