import React from 'react';
import { Text, View, TouchableOpacity, ScrollView, Modal, LinearGradient } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { earnCreditsOptions, EarnCreditsOption } from './storeData';
import { LinearGradient as ExpoLinearGradient } from 'expo-linear-gradient';

interface EarnCreditsModalProps {
  visible: boolean;
  onClose: () => void;
  onEarnCredits: (option: EarnCreditsOption) => void;
}

export default function EarnCreditsModal({ visible, onClose, onEarnCredits }: EarnCreditsModalProps) {
  const getCategoryColor = (type: string) => {
    switch(type) {
      case 'daily': return { primary: '#00D4AA', secondary: '#00A087', gradient: ['#00D4AA', '#00A087'] };
      case 'action': return { primary: '#007AFF', secondary: '#0051D5', gradient: ['#007AFF', '#0051D5'] };
      case 'social': return { primary: '#8B5CF6', secondary: '#6D28D9', gradient: ['#8B5CF6', '#6D28D9'] };
      case 'challenge': return { primary: '#FFD700', secondary: '#FFA500', gradient: ['#FFD700', '#FFA500'] };
      default: return { primary: '#00D4AA', secondary: '#00A087', gradient: ['#00D4AA', '#00A087'] };
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
          marginBottom: 12,
          overflow: 'hidden',
          borderRadius: 20,
        }}
        activeOpacity={0.85}
        disabled={!isActionable}
      >
        <View style={{
          backgroundColor: option.isCompleted ? 'rgba(255, 255, 255, 0.04)' : 'rgba(255, 255, 255, 0.06)',
          borderRadius: 20,
          padding: 18,
          borderWidth: 1,
          borderColor: option.isCompleted ? 'rgba(255, 255, 255, 0.06)' : `${colors.primary}20`,
          opacity: option.isCompleted ? 0.6 : 1,
        }}>
          <View style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            {/* Left side - Icon and info */}
            <View style={{
              flexDirection: 'row',
              alignItems: 'center',
              flex: 1
            }}>
              {/* Icon with gradient background */}
              <View style={{
                width: 60,
                height: 60,
                borderRadius: 18,
                marginRight: 14,
                overflow: 'hidden',
                shadowColor: colors.primary,
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: option.isCompleted ? 0 : 0.3,
                shadowRadius: 8,
                elevation: 5,
              }}>
                <ExpoLinearGradient
                  colors={option.isCompleted ? ['rgba(255,255,255,0.1)', 'rgba(255,255,255,0.05)'] : colors.gradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={{
                    width: '100%',
                    height: '100%',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <Text style={{ fontSize: 30 }}>
                    {option.emoji}
                  </Text>
                </ExpoLinearGradient>
              </View>

              {/* Info */}
              <View style={{ flex: 1, marginRight: 12 }}>
                <Text style={{
                  fontSize: 17,
                  fontWeight: '700',
                  color: '#ffffff',
                  marginBottom: 4,
                  letterSpacing: 0.3
                }}>
                  {option.title}
                </Text>

                <Text style={{
                  fontSize: 13,
                  color: 'rgba(255, 255, 255, 0.65)',
                  marginBottom: 6,
                  lineHeight: 18
                }}>
                  {option.description}
                </Text>

                {/* Credits badge inline */}
                <View style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  backgroundColor: 'rgba(255, 215, 0, 0.12)',
                  paddingHorizontal: 10,
                  paddingVertical: 5,
                  borderRadius: 10,
                  alignSelf: 'flex-start',
                  borderWidth: 1,
                  borderColor: 'rgba(255, 215, 0, 0.25)'
                }}>
                  <MaterialIcons name="monetization-on" size={15} color="#FFD700" />
                  <Text style={{
                    fontSize: 14,
                    fontWeight: '700',
                    color: '#FFD700',
                    marginLeft: 4
                  }}>
                    +{option.credits}
                  </Text>
                </View>
              </View>
            </View>

            {/* Right side - Status/Action */}
            <View style={{ alignItems: 'center' }}>
              {option.isCompleted ? (
                <View style={{
                  width: 48,
                  height: 48,
                  borderRadius: 24,
                  backgroundColor: 'rgba(0, 212, 170, 0.15)',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderWidth: 2,
                  borderColor: 'rgba(0, 212, 170, 0.4)'
                }}>
                  <MaterialIcons name="check-circle" size={28} color="#00D4AA" />
                </View>
              ) : option.isAvailable ? (
                <View style={{
                  borderRadius: 16,
                  overflow: 'hidden',
                  shadowColor: colors.primary,
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.4,
                  shadowRadius: 6,
                  elevation: 4,
                }}>
                  <ExpoLinearGradient
                    colors={colors.gradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={{
                      paddingHorizontal: 16,
                      paddingVertical: 10,
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    <Text style={{
                      fontSize: 13,
                      fontWeight: '700',
                      color: '#000000',
                      letterSpacing: 0.5
                    }}>
                      CLAIM
                    </Text>
                  </ExpoLinearGradient>
                </View>
              ) : (
                <View style={{
                  paddingHorizontal: 12,
                  paddingVertical: 8,
                  borderRadius: 12,
                  backgroundColor: 'rgba(255, 255, 255, 0.05)',
                  borderWidth: 1,
                  borderColor: 'rgba(255, 255, 255, 0.1)'
                }}>
                  <MaterialIcons name="lock" size={20} color="rgba(255, 255, 255, 0.4)" />
                </View>
              )}
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const renderSection = (type: string, options: EarnCreditsOption[]) => {
    const colors = getCategoryColor(type);
    const iconName = getCategoryIcon(type);

    return (
      <View key={type} style={{ marginBottom: 28 }}>
        {/* Section header */}
        <View style={{
          flexDirection: 'row',
          alignItems: 'center',
          marginBottom: 14,
          paddingHorizontal: 4
        }}>
          <View style={{
            width: 32,
            height: 32,
            borderRadius: 10,
            backgroundColor: `${colors.primary}20`,
            alignItems: 'center',
            justifyContent: 'center',
            marginRight: 10,
            borderWidth: 1,
            borderColor: `${colors.primary}40`
          }}>
            <MaterialIcons name={iconName as any} size={18} color={colors.primary} />
          </View>
          <Text style={{
            fontSize: 18,
            fontWeight: '700',
            color: '#ffffff',
            textTransform: 'capitalize',
            letterSpacing: 0.5
          }}>
            {type}
          </Text>
          <View style={{
            marginLeft: 10,
            paddingHorizontal: 8,
            paddingVertical: 3,
            borderRadius: 8,
            backgroundColor: `${colors.primary}15`
          }}>
            <Text style={{
              fontSize: 11,
              fontWeight: '700',
              color: colors.primary
            }}>
              {options.filter(o => !o.isCompleted).length} Available
            </Text>
          </View>
        </View>

        {/* Options */}
        {options.map(renderEarnOption)}
      </View>
    );
  };

  const totalCredits = earnCreditsOptions.reduce((sum, opt) => sum + (opt.isCompleted ? opt.credits : 0), 0);
  const availableCredits = earnCreditsOptions.reduce((sum, opt) => sum + (opt.isAvailable && !opt.isCompleted ? opt.credits : 0), 0);

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
        {/* Enhanced Header with Gradient */}
        <View style={{ overflow: 'hidden' }}>
          <ExpoLinearGradient
            colors={['rgba(0, 212, 170, 0.15)', 'rgba(0, 212, 170, 0.05)', 'transparent']}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
            style={{
              paddingTop: 60,
              paddingBottom: 24,
              paddingHorizontal: 20,
              borderBottomWidth: 1,
              borderBottomColor: 'rgba(255, 255, 255, 0.08)'
            }}
          >
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

            {/* Stats Cards */}
            <View style={{
              flexDirection: 'row',
              gap: 12
            }}>
              {/* Earned Today */}
              <View style={{
                flex: 1,
                backgroundColor: 'rgba(255, 255, 255, 0.06)',
                borderRadius: 16,
                padding: 14,
                borderWidth: 1,
                borderColor: 'rgba(255, 255, 255, 0.1)'
              }}>
                <View style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  marginBottom: 6
                }}>
                  <MaterialIcons name="check-circle" size={18} color="#00D4AA" />
                  <Text style={{
                    fontSize: 12,
                    color: 'rgba(255, 255, 255, 0.6)',
                    marginLeft: 6,
                    fontWeight: '600'
                  }}>
                    Earned
                  </Text>
                </View>
                <Text style={{
                  fontSize: 24,
                  fontWeight: '800',
                  color: '#00D4AA'
                }}>
                  {totalCredits}
                </Text>
              </View>

              {/* Available to Earn */}
              <View style={{
                flex: 1,
                backgroundColor: 'rgba(255, 215, 0, 0.08)',
                borderRadius: 16,
                padding: 14,
                borderWidth: 1,
                borderColor: 'rgba(255, 215, 0, 0.2)'
              }}>
                <View style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  marginBottom: 6
                }}>
                  <MaterialIcons name="monetization-on" size={18} color="#FFD700" />
                  <Text style={{
                    fontSize: 12,
                    color: 'rgba(255, 255, 255, 0.6)',
                    marginLeft: 6,
                    fontWeight: '600'
                  }}>
                    Available
                  </Text>
                </View>
                <Text style={{
                  fontSize: 24,
                  fontWeight: '800',
                  color: '#FFD700'
                }}>
                  {availableCredits}
                </Text>
              </View>
            </View>
          </ExpoLinearGradient>
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

          {/* Footer note */}
          <View style={{
            backgroundColor: 'rgba(139, 92, 246, 0.08)',
            borderRadius: 16,
            padding: 18,
            marginTop: 12,
            borderWidth: 1,
            borderColor: 'rgba(139, 92, 246, 0.2)',
            alignItems: 'center'
          }}>
            <MaterialIcons name="auto-awesome" size={24} color="#8B5CF6" style={{ marginBottom: 8 }} />
            <Text style={{
              fontSize: 15,
              fontWeight: '600',
              color: '#ffffff',
              textAlign: 'center',
              marginBottom: 4
            }}>
              More rewards coming soon!
            </Text>
            <Text style={{
              fontSize: 13,
              color: 'rgba(255, 255, 255, 0.6)',
              textAlign: 'center',
              lineHeight: 18
            }}>
              Stay tuned for special events and bonus opportunities
            </Text>
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
}