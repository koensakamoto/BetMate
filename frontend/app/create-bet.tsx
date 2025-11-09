import React, { useState, useEffect, useRef } from 'react';
import { Text, View, TouchableOpacity, ScrollView, StatusBar, TextInput, Alert, Image, Modal, Animated, KeyboardAvoidingView, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { betService, CreateBetRequest } from '../services/bet/betService';
import { haptic } from '../utils/haptics';
import LoadingButton from '../components/common/LoadingButton';

const icon = require("../assets/images/icon.png");

// Helper function to round time to nearest 15-minute interval
const roundToNearest15Minutes = (date: Date): Date => {
  const rounded = new Date(date);
  const minutes = rounded.getMinutes();
  const roundedMinutes = Math.ceil(minutes / 15) * 15;
  rounded.setMinutes(roundedMinutes);
  rounded.setSeconds(0);
  rounded.setMilliseconds(0);
  return rounded;
};

export default function CreateBet() {
  const insets = useSafeAreaInsets();
  const { groupId } = useLocalSearchParams();
  const [betTitle, setBetTitle] = useState('');
  const [betDescription, setBetDescription] = useState('');
  const [selectedSport, setSelectedSport] = useState<string | null>(null);
  const [betType, setBetType] = useState<'MULTIPLE_CHOICE' | 'PREDICTION' | 'OVER_UNDER'>('MULTIPLE_CHOICE');
  const [stakeAmount, setStakeAmount] = useState('');
  const [betEndTime, setBetEndTime] = useState(roundToNearest15Minutes(new Date(Date.now() + 24 * 60 * 60 * 1000)));
  const [eventResolutionDate, setEventResolutionDate] = useState(roundToNearest15Minutes(new Date(Date.now() + 48 * 60 * 60 * 1000)));
  const [resolver, setResolver] = useState<'self' | 'specific' | 'multiple' | 'group'>('self');
  const [selectedResolver, setSelectedResolver] = useState<string | null>(null);
  const [selectedResolvers, setSelectedResolvers] = useState<string[]>([]);
  const [evidenceRequirements, setEvidenceRequirements] = useState('');
  const [showDatePicker, setShowDatePicker] = useState<'start' | 'end' | 'resolution' | null>(null);
  const [multipleChoiceOptions, setMultipleChoiceOptions] = useState(['', '']);
  const [overUnderLine, setOverUnderLine] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  // Refs for TextInputs
  const titleRef = useRef<TextInput>(null);
  const descriptionRef = useRef<TextInput>(null);
  const stakeRef = useRef<TextInput>(null);
  const optionRefs = useRef<(TextInput | null)[]>([]);
  const overUnderRef = useRef<TextInput>(null);

  // Progress tracking
  const [completionPercentage, setCompletionPercentage] = useState(0);
  const progressAnim = new Animated.Value(0);

  const sports = [
    { id: 'sports', name: 'Sports', icon: 'sports-soccer', color: '#4CAF50' },
    { id: 'crypto', name: 'Crypto', icon: 'currency-bitcoin', color: '#FF9500' },
    { id: 'stocks', name: 'Stocks', icon: 'trending-up', color: '#007AFF' },
    { id: 'politics', name: 'Politics', icon: 'how-to-vote', color: '#8B5CF6' },
    { id: 'entertainment', name: 'Entertainment', icon: 'movie', color: '#FF69B4' },
    { id: 'gaming', name: 'Gaming', icon: 'sports-esports', color: '#F59E0B' },
    { id: 'other', name: 'Other', icon: 'casino', color: '#64748B' }
  ];

  // Calculate completion percentage
  useEffect(() => {
    const fields = [
      betTitle.trim(),
      selectedSport,
      stakeAmount.trim(),
      betType === 'MULTIPLE_CHOICE' ? multipleChoiceOptions.some(opt => opt.trim()) :
      betType === 'PREDICTION' ? 'prediction_bet' : overUnderLine.trim()
    ];
    
    const completed = fields.filter(Boolean).length;
    const percentage = (completed / fields.length) * 100;
    setCompletionPercentage(percentage);
    
    Animated.timing(progressAnim, {
      toValue: percentage / 100,
      duration: 300,
      useNativeDriver: false,
    }).start();
  }, [betTitle, selectedSport, stakeAmount, multipleChoiceOptions, overUnderLine, betType]);

  const friends = [
    { id: '1', username: 'mikeJohnson', name: 'Mike Johnson' },
    { id: '2', username: 'sarahGamer', name: 'Sarah Chen' },
    { id: '3', username: 'alexBets', name: 'Alex Rodriguez' },
    { id: '4', username: 'emilyWins', name: 'Emily Davis' },
    { id: '5', username: 'chrisPlay', name: 'Chris Wilson' }
  ];

  const handleCreateBet = async () => {
    if (!betTitle.trim() || !selectedSport || !stakeAmount) {
      haptic.error();
      Alert.alert('Missing Information', 'Please fill in all required fields.');
      return;
    }

    if (betType === 'MULTIPLE_CHOICE' && multipleChoiceOptions.some(opt => !opt.trim())) {
      haptic.error();
      Alert.alert('Missing Options', 'Please fill in all multiple choice options.');
      return;
    }


    if (betType === 'OVER_UNDER' && !overUnderLine) {
      haptic.error();
      Alert.alert('Missing Line', 'Please enter the over/under line.');
      return;
    }

    Alert.alert(
      'Create Bet?',
      `Create "${betTitle}" with $${stakeAmount} stake?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Create',
          onPress: async () => {
            haptic.medium();
            setIsCreating(true);
            try {
              const betGroupId = groupId ? parseInt(groupId as string) : 1;
              console.log(`[CreateBet] Creating bet for groupId: ${betGroupId}`);

              const createBetRequest: CreateBetRequest = {
                groupId: betGroupId,
                title: betTitle,
                description: betDescription || undefined,
                betType: betType,
                resolutionMethod: resolver === 'self' ? 'CREATOR_ONLY' :
                                 resolver === 'specific' ? 'ASSIGNED_RESOLVER' : 'CONSENSUS_VOTING',
                bettingDeadline: betEndTime.toISOString(),
                resolveDate: eventResolutionDate.toISOString(),
                minimumBet: parseFloat(stakeAmount),
                maximumBet: undefined, // TODO: Add max bet option to UI if needed
                minimumVotesRequired: resolver === 'multiple' ? selectedResolvers.length : undefined,
                allowCreatorVote: true, // TODO: Add this option to UI if needed
                options: betType === 'MULTIPLE_CHOICE' ? multipleChoiceOptions.filter(opt => opt.trim()) :
                        betType === 'PREDICTION' ? ['Prediction'] :
                        betType === 'OVER_UNDER' ? [`Over ${overUnderLine}`, `Under ${overUnderLine}`] : undefined
              };

              const response = await betService.createBet(createBetRequest);
              haptic.success();
              Alert.alert('Success!', 'Your bet has been created successfully.', [
                { text: 'OK', onPress: () => {
                  // Navigate back to the group page with Bets tab active (tab=1)
                  // Use dismissAll to clear stack and navigate fresh with proper path
                  router.dismissAll();
                  router.navigate(`/(tabs)/group/${betGroupId}?tab=1&refresh=${Date.now()}`);
                }}
              ]);
            } catch (error) {
              console.error('Failed to create bet:', error);
              haptic.error();
              Alert.alert('Error', 'Failed to create bet. Please try again.');
            } finally {
              setIsCreating(false);
            }
          }
        }
      ]
    );
  };

  const toggleResolverSelection = (friendId: string) => {
    if (resolver === 'specific') {
      setSelectedResolver(friendId);
    } else if (resolver === 'multiple') {
      setSelectedResolvers(prev => 
        prev.includes(friendId) 
          ? prev.filter(id => id !== friendId)
          : [...prev, friendId]
      );
    }
  };

  const addMultipleChoiceOption = () => {
    setMultipleChoiceOptions([...multipleChoiceOptions, '']);
  };

  const removeMultipleChoiceOption = (index: number) => {
    if (multipleChoiceOptions.length > 2) {
      setMultipleChoiceOptions(multipleChoiceOptions.filter((_, i) => i !== index));
    }
  };

  const updateMultipleChoiceOption = (index: number, value: string) => {
    const newOptions = [...multipleChoiceOptions];
    newOptions[index] = value;
    setMultipleChoiceOptions(newOptions);
  };

  const formatDateTime = (date: Date) => {
    return date.toLocaleDateString() + ' at ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const BetTypeCard = ({ type, title, description, icon }: { type: string, title: string, description: string, icon: string }) => (
    <TouchableOpacity
      onPress={() => {
        haptic.light();
        setBetType(type as any);
      }}
      style={{
        backgroundColor: betType === type ? 'rgba(0, 212, 170, 0.15)' : 'rgba(255, 255, 255, 0.05)',
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        borderWidth: betType === type ? 1.5 : 0.5,
        borderColor: betType === type ? '#00D4AA' : 'rgba(255, 255, 255, 0.1)'
      }}
      activeOpacity={0.7}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
        <MaterialIcons
          name={icon as any}
          size={20}
          color={betType === type ? '#00D4AA' : '#ffffff'}
          style={{ marginRight: 10 }}
        />
        <Text style={{
          fontSize: 16,
          fontWeight: '600',
          color: betType === type ? '#00D4AA' : '#ffffff'
        }}>
          {title}
        </Text>
      </View>
      <Text style={{
        fontSize: 14,
        color: 'rgba(255, 255, 255, 0.7)',
        lineHeight: 20
      }}>
        {description}
      </Text>
    </TouchableOpacity>
  );

  const ResolverItem = ({ friend, isMultiple = false }: { friend: any, isMultiple?: boolean }) => {
    const isSelected = isMultiple ? selectedResolvers.includes(friend.id) : selectedResolver === friend.id;
    
    return (
      <TouchableOpacity
        onPress={() => toggleResolverSelection(friend.id)}
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          paddingVertical: 8,
          paddingHorizontal: 12,
          backgroundColor: isSelected ? 'rgba(0, 212, 170, 0.1)' : 'transparent',
          borderRadius: 8,
          marginBottom: 8,
          borderWidth: isSelected ? 1 : 0,
          borderColor: '#00D4AA'
        }}
      >
        <View style={{
          width: 20,
          height: 20,
          borderRadius: isMultiple ? 4 : 10,
          backgroundColor: isSelected ? '#00D4AA' : 'transparent',
          borderWidth: 1.5,
          borderColor: isSelected ? '#00D4AA' : 'rgba(255, 255, 255, 0.3)',
          justifyContent: 'center',
          alignItems: 'center',
          marginRight: 12
        }}>
          {isSelected && (
            <MaterialIcons name="check" size={12} color="#000000" />
          )}
        </View>
        
        <Image 
          source={icon}
          style={{
            width: 32,
            height: 32,
            borderRadius: 16,
            marginRight: 12
          }}
        />
        
        <View style={{ flex: 1 }}>
          <Text style={{
            fontSize: 15,
            fontWeight: '600',
            color: '#ffffff'
          }}>
            {friend.username}
          </Text>
          <Text style={{
            fontSize: 13,
            color: 'rgba(255, 255, 255, 0.6)'
          }}>
            {friend.name}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#0a0a0f' }}>
      <StatusBar
        barStyle="light-content"
        backgroundColor="#0a0a0f"
        translucent={true}
      />

      {/* Solid background behind status bar */}
      <View style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: insets.top,
        backgroundColor: '#0a0a0f',
        zIndex: 1
      }} />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={0}
      >
        <ScrollView
          style={{ flex: 1, marginTop: insets.top }}
          contentContainerStyle={{
            paddingTop: 20,
            paddingBottom: insets.bottom + 120,
            paddingHorizontal: 20
          }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
        >
          {/* Header with Progress */}
          <View style={{
            paddingBottom: 16,
            marginBottom: 16,
            borderBottomWidth: 0.5,
            borderBottomColor: 'rgba(255, 255, 255, 0.08)',
          }}>
            {/* Header Row */}
            <View style={{
              flexDirection: 'row',
              alignItems: 'center',
              marginBottom: 12
            }}>
              <TouchableOpacity
                onPress={() => router.back()}
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 20,
                  backgroundColor: 'rgba(255, 255, 255, 0.08)',
                  justifyContent: 'center',
                  alignItems: 'center',
                  marginRight: 16
                }}
              >
                <MaterialIcons name="close" size={18} color="#ffffff" />
              </TouchableOpacity>

              <View>
                <Text style={{
                  fontSize: 24,
                  fontWeight: '700',
                  color: '#ffffff'
                }}>
                  Create Bet
                </Text>
                <Text style={{
                  fontSize: 13,
                  color: 'rgba(255, 255, 255, 0.6)',
                  marginTop: 2
                }}>
                  {Math.round(completionPercentage)}% complete
                </Text>
              </View>
            </View>

            {/* Progress Bar */}
            <View style={{
              height: 3,
              backgroundColor: 'rgba(255, 255, 255, 0.1)',
              borderRadius: 2,
              overflow: 'hidden'
            }}>
              <Animated.View style={{
                height: '100%',
                backgroundColor: '#00D4AA',
                borderRadius: 2,
                width: progressAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: ['0%', '100%']
                })
              }} />
            </View>
          </View>
          {/* Basic Information Section */}
          <View style={{
            backgroundColor: 'rgba(255, 255, 255, 0.02)',
            borderRadius: 16,
            padding: 20,
            marginBottom: 20,
            borderWidth: 1,
            borderColor: (betTitle.trim() && selectedSport) ? 'rgba(0, 212, 170, 0.3)' : 'rgba(255, 255, 255, 0.06)'
          }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
              <Text style={{
                fontSize: 18,
                fontWeight: '700',
                color: '#ffffff',
                flex: 1
              }}>
                Basic Information
              </Text>
              {(betTitle.trim() && selectedSport) && (
                <MaterialIcons name="check-circle" size={20} color="#00D4AA" />
              )}
            </View>

            {/* Title */}
            <Text style={{
              fontSize: 14,
              fontWeight: '600',
              color: 'rgba(255, 255, 255, 0.9)',
              marginBottom: 8
            }}>
              Bet Title <Text style={{ color: '#FF4757' }}>*</Text>
            </Text>
            <View style={{
              backgroundColor: 'rgba(255, 255, 255, 0.04)',
              borderRadius: 12,
              borderWidth: 1,
              borderColor: betTitle.trim() ? '#00D4AA' : 'rgba(255, 255, 255, 0.1)',
              paddingHorizontal: 16,
              paddingVertical: 14,
              marginBottom: 16,
              flexDirection: 'row',
              alignItems: 'center'
            }}>
              <TextInput
                ref={titleRef}
                style={{
                  flex: 1,
                  fontSize: 16,
                  color: '#ffffff',
                  fontWeight: '400'
                }}
                value={betTitle}
                onChangeText={setBetTitle}
                placeholder="What are you betting on?"
                placeholderTextColor="rgba(255, 255, 255, 0.4)"
                maxLength={100}
                returnKeyType="next"
                blurOnSubmit={false}
                onSubmitEditing={() => descriptionRef.current?.focus()}
              />
              <Text style={{
                fontSize: 12,
                color: 'rgba(255, 255, 255, 0.4)',
                marginLeft: 8
              }}>
                {betTitle.length}/100
              </Text>
            </View>

            {/* Description */}
            <Text style={{
              fontSize: 14,
              fontWeight: '600',
              color: 'rgba(255, 255, 255, 0.9)',
              marginBottom: 8
            }}>
              Description
            </Text>
            <View style={{
              backgroundColor: 'rgba(255, 255, 255, 0.04)',
              borderRadius: 12,
              borderWidth: 1,
              borderColor: betDescription.trim() ? '#00D4AA' : 'rgba(255, 255, 255, 0.1)',
              paddingHorizontal: 16,
              paddingVertical: 14,
              marginBottom: 8
            }}>
              <TextInput
                ref={descriptionRef}
                style={{
                  fontSize: 16,
                  color: '#ffffff',
                  fontWeight: '400',
                  minHeight: 60,
                  textAlignVertical: 'top'
                }}
                value={betDescription}
                onChangeText={setBetDescription}
                placeholder="Add more details about your bet..."
                placeholderTextColor="rgba(255, 255, 255, 0.4)"
                multiline={true}
                maxLength={200}
                returnKeyType="done"
                blurOnSubmit={true}
              />
            </View>
            <Text style={{
              fontSize: 12,
              color: 'rgba(255, 255, 255, 0.4)',
              textAlign: 'right',
              marginBottom: 16
            }}>
              {betDescription.length}/200
            </Text>

            {/* Category Selection */}
            <Text style={{
              fontSize: 14,
              fontWeight: '600',
              color: 'rgba(255, 255, 255, 0.9)',
              marginBottom: 12
            }}>
              Category <Text style={{ color: '#FF4757' }}>*</Text>
            </Text>
            
            <View style={{
              flexDirection: 'row',
              flexWrap: 'wrap',
              marginBottom: 4
            }}>
              {sports.map((sport) => (
                <TouchableOpacity
                  key={sport.id}
                  onPress={() => {
                    haptic.light();
                    setSelectedSport(sport.id);
                  }}
                  style={{
                    backgroundColor: selectedSport === sport.id ? sport.color + '20' : 'rgba(255, 255, 255, 0.05)',
                    borderWidth: selectedSport === sport.id ? 1.5 : 0.5,
                    borderColor: selectedSport === sport.id ? sport.color : 'rgba(255, 255, 255, 0.1)',
                    paddingHorizontal: 12,
                    paddingVertical: 8,
                    borderRadius: 20,
                    marginRight: 8,
                    marginBottom: 8,
                    flexDirection: 'row',
                    alignItems: 'center'
                  }}
                >
                  <MaterialIcons
                    name={sport.icon as any}
                    size={14}
                    color={selectedSport === sport.id ? sport.color : '#ffffff'}
                    style={{ marginRight: 6 }}
                  />
                  <Text style={{
                    fontSize: 13,
                    fontWeight: '600',
                    color: selectedSport === sport.id ? sport.color : '#ffffff'
                  }}>
                    {sport.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Bet Type Selection */}
          <View style={{
            backgroundColor: 'rgba(255, 255, 255, 0.02)',
            borderRadius: 16,
            padding: 20,
            marginBottom: 24,
            marginTop: 4,
            borderWidth: 1,
            borderColor: 'rgba(255, 255, 255, 0.06)'
          }}>
            <Text style={{
              fontSize: 18,
              fontWeight: '700',
              color: '#ffffff',
              marginBottom: 16
            }}>
              Bet Type & Options
            </Text>
            
            <BetTypeCard
              type="MULTIPLE_CHOICE"
              title="Multiple Choice"
              description="Participants choose from predefined options (e.g., Team A wins, Team B wins, Draw)"
              icon="ballot"
            />

            <BetTypeCard
              type="PREDICTION"
              title="Prediction"
              description="Predict a specific number or outcome (e.g., final score will be 3-1)"
              icon="gps-fixed"
            />

            <BetTypeCard
              type="OVER_UNDER"
              title="Over/Under"
              description="Bet whether a value will be over or under a specific line (e.g., total goals > 2.5)"
              icon="balance"
            />
          </View>

          {/* Bet Type Specific Fields */}
          {betType === 'MULTIPLE_CHOICE' && (
            <>
              <Text style={{
                fontSize: 13,
                fontWeight: '500',
                color: 'rgba(255, 255, 255, 0.8)',
                marginBottom: 6
              }}>
                Answer Options *
              </Text>
              {multipleChoiceOptions.map((option, index) => (
                <TouchableOpacity
                  key={index}
                  activeOpacity={1}
                  onPress={() => optionRefs.current[index]?.focus()}
                  style={{
                    backgroundColor: 'rgba(255, 255, 255, 0.06)',
                    borderRadius: 8,
                    borderWidth: 0.5,
                    borderColor: 'rgba(255, 255, 255, 0.15)',
                    paddingHorizontal: 12,
                    paddingVertical: 12,
                    marginBottom: 8,
                    flexDirection: 'row',
                    alignItems: 'center'
                  }}
                >
                  <TextInput
                    ref={(ref) => (optionRefs.current[index] = ref)}
                    style={{
                      flex: 1,
                      fontSize: 15,
                      color: '#ffffff',
                      fontWeight: '400'
                    }}
                    value={option}
                    onChangeText={(text) => updateMultipleChoiceOption(index, text)}
                    placeholder={`Option ${index + 1}`}
                    placeholderTextColor="rgba(255, 255, 255, 0.4)"
                    returnKeyType={index === multipleChoiceOptions.length - 1 ? "done" : "next"}
                    blurOnSubmit={index === multipleChoiceOptions.length - 1}
                    onSubmitEditing={() => {
                      if (index < multipleChoiceOptions.length - 1) {
                        optionRefs.current[index + 1]?.focus();
                      }
                    }}
                  />
                  {multipleChoiceOptions.length > 2 && (
                    <TouchableOpacity onPress={() => removeMultipleChoiceOption(index)}>
                      <MaterialIcons name="close" size={20} color="rgba(255, 255, 255, 0.5)" />
                    </TouchableOpacity>
                  )}
                </TouchableOpacity>
              ))}
              <TouchableOpacity
                onPress={addMultipleChoiceOption}
                style={{
                  backgroundColor: 'rgba(0, 212, 170, 0.1)',
                  borderRadius: 8,
                  padding: 12,
                  marginBottom: 16,
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <MaterialIcons name="add" size={20} color="#00D4AA" style={{ marginRight: 8 }} />
                <Text style={{ fontSize: 14, color: '#00D4AA', fontWeight: '600' }}>Add Option</Text>
              </TouchableOpacity>
            </>
          )}

          {betType === 'PREDICTION' && (
            <>
              <Text style={{
                fontSize: 13,
                fontWeight: '500',
                color: 'rgba(255, 255, 255, 0.8)',
                marginBottom: 6
              }}>
                Prediction Bet
              </Text>
              <Text style={{
                fontSize: 12,
                color: 'rgba(255, 255, 255, 0.6)',
                lineHeight: 18,
                marginBottom: 16
              }}>
                Users will predict the exact outcome when they place their bets. Use the description above to clearly explain what they should predict (e.g., &quot;final score&quot;, &quot;winner&apos;s name&quot;, &quot;exact number&quot;).
              </Text>
            </>
          )}

          {betType === 'OVER_UNDER' && (
            <>
              <Text style={{
                fontSize: 13,
                fontWeight: '500',
                color: 'rgba(255, 255, 255, 0.8)',
                marginBottom: 6
              }}>
                Over/Under Line *
              </Text>
              <View style={{
                backgroundColor: 'rgba(255, 255, 255, 0.06)',
                borderRadius: 8,
                borderWidth: 0.5,
                borderColor: 'rgba(255, 255, 255, 0.15)',
                paddingHorizontal: 12,
                paddingVertical: 12,
                marginBottom: 16
              }}>
                <TextInput
                  style={{
                    fontSize: 15,
                    color: '#ffffff',
                    fontWeight: '400'
                  }}
                  value={overUnderLine}
                  onChangeText={setOverUnderLine}
                  placeholder="e.g., 2.5, 45.5, 200"
                  placeholderTextColor="rgba(255, 255, 255, 0.4)"
                  keyboardType="numeric"
                  returnKeyType="done"
                />
              </View>
            </>
          )}

          {/* Betting Parameters */}
          <View style={{
            backgroundColor: 'rgba(255, 255, 255, 0.02)',
            borderRadius: 16,
            padding: 20,
            marginBottom: 20,
            borderWidth: 1,
            borderColor: stakeAmount.trim() ? 'rgba(0, 212, 170, 0.3)' : 'rgba(255, 255, 255, 0.06)'
          }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
              <Text style={{
                fontSize: 18,
                fontWeight: '700',
                color: '#ffffff',
                flex: 1
              }}>
                Betting Parameters
              </Text>
              {stakeAmount.trim() && (
                <MaterialIcons name="check-circle" size={20} color="#00D4AA" />
              )}
            </View>

            <Text style={{
              fontSize: 14,
              fontWeight: '600',
              color: 'rgba(255, 255, 255, 0.9)',
              marginBottom: 8
            }}>
              Stake Amount <Text style={{ color: '#FF4757' }}>*</Text>
            </Text>
            <View style={{
              backgroundColor: 'rgba(255, 255, 255, 0.04)',
              borderRadius: 12,
              borderWidth: 1,
              borderColor: stakeAmount.trim() ? '#00D4AA' : 'rgba(255, 255, 255, 0.1)',
              paddingHorizontal: 16,
              paddingVertical: 14,
              flexDirection: 'row',
              alignItems: 'center'
            }}>
              <Text style={{
                fontSize: 16,
                color: 'rgba(255, 255, 255, 0.6)',
                marginRight: 8
              }}>
                $
              </Text>
              <TextInput
                ref={stakeRef}
                style={{
                  flex: 1,
                  fontSize: 16,
                  color: '#ffffff',
                  fontWeight: '400'
                }}
                value={stakeAmount}
                onChangeText={(text) => {
                  // Only allow numbers and one decimal point
                  const filtered = text.replace(/[^0-9.]/g, '');
                  // Ensure only one decimal point
                  const parts = filtered.split('.');
                  if (parts.length > 2) {
                    return;
                  }
                  // Limit to 2 decimal places
                  if (parts[1] && parts[1].length > 2) {
                    return;
                  }
                  setStakeAmount(filtered);
                }}
                placeholder="How much each participant bets"
                placeholderTextColor="rgba(255, 255, 255, 0.4)"
                keyboardType="decimal-pad"
                returnKeyType="done"
              />
            </View>
          </View>

          {/* Bet Timing */}
          <Text style={{
            fontSize: 18,
            fontWeight: '600',
            color: '#ffffff',
            marginBottom: 16,
            marginTop: 24
          }}>
            Bet Timing
          </Text>

          {/* Join Deadline */}
          <Text style={{
            fontSize: 13,
            fontWeight: '500',
            color: 'rgba(255, 255, 255, 0.8)',
            marginBottom: 4
          }}>
            Join Deadline <Text style={{ color: '#FF4757' }}>*</Text>
          </Text>
          <Text style={{
            fontSize: 12,
            color: 'rgba(255, 255, 255, 0.5)',
            marginBottom: 6
          }}>
            Last time participants can join this bet
          </Text>
          <TouchableOpacity
            onPress={() => setShowDatePicker('end')}
            style={{
              backgroundColor: 'rgba(255, 255, 255, 0.06)',
              borderRadius: 8,
              borderWidth: 0.5,
              borderColor: 'rgba(255, 255, 255, 0.15)',
              paddingHorizontal: 12,
              paddingVertical: 12,
              marginBottom: 16,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}
          >
            <Text style={{
              fontSize: 15,
              color: '#ffffff',
              fontWeight: '400'
            }}>
              {formatDateTime(betEndTime)}
            </Text>
            <MaterialIcons name="access-time" size={20} color="rgba(255, 255, 255, 0.5)" />
          </TouchableOpacity>

          {/* Resolution Date */}
          <Text style={{
            fontSize: 13,
            fontWeight: '500',
            color: 'rgba(255, 255, 255, 0.8)',
            marginBottom: 4
          }}>
            Event/Resolution Date <Text style={{ color: '#FF4757' }}>*</Text>
          </Text>
          <Text style={{
            fontSize: 12,
            color: 'rgba(255, 255, 255, 0.5)',
            marginBottom: 6
          }}>
            When the bet outcome will be determined
          </Text>
          <TouchableOpacity
            onPress={() => setShowDatePicker('resolution')}
            style={{
              backgroundColor: 'rgba(255, 255, 255, 0.06)',
              borderRadius: 8,
              borderWidth: 0.5,
              borderColor: 'rgba(255, 255, 255, 0.15)',
              paddingHorizontal: 12,
              paddingVertical: 12,
              marginBottom: 16,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}
          >
            <Text style={{
              fontSize: 15,
              color: '#ffffff',
              fontWeight: '400'
            }}>
              {formatDateTime(eventResolutionDate)}
            </Text>
            <MaterialIcons name="event" size={20} color="rgba(255, 255, 255, 0.5)" />
          </TouchableOpacity>

          {/* Evidence Requirements */}
          <Text style={{
            fontSize: 13,
            fontWeight: '500',
            color: 'rgba(255, 255, 255, 0.8)',
            marginBottom: 4,
            marginTop: 24
          }}>
            Evidence Requirements <Text style={{ color: 'rgba(255, 255, 255, 0.5)', fontWeight: '400' }}>(Optional)</Text>
          </Text>
          <Text style={{
            fontSize: 12,
            color: 'rgba(255, 255, 255, 0.5)',
            marginBottom: 6
          }}>
            What proof is needed to resolve this bet
          </Text>
          <View style={{
            backgroundColor: 'rgba(255, 255, 255, 0.06)',
            borderRadius: 8,
            borderWidth: 0.5,
            borderColor: 'rgba(255, 255, 255, 0.15)',
            paddingHorizontal: 12,
            paddingVertical: 10,
            marginBottom: 24
          }}>
            <TextInput
              style={{
                fontSize: 15,
                color: '#ffffff',
                fontWeight: '400',
                minHeight: 60,
                textAlignVertical: 'top'
              }}
              value={evidenceRequirements}
              onChangeText={setEvidenceRequirements}
              placeholder="What proof is needed to resolve this bet? (e.g., official scoreboard, news article, screenshot)"
              placeholderTextColor="rgba(255, 255, 255, 0.4)"
              multiline={true}
              maxLength={300}
              returnKeyType="done"
              blurOnSubmit={true}
            />
          </View>

          {/* Bet Resolver */}
          <Text style={{
            fontSize: 18,
            fontWeight: '600',
            color: '#ffffff',
            marginBottom: 16
          }}>
            Who will resolve this bet? *
          </Text>
          
          <View style={{ marginBottom: 16 }}>
            {[
              { id: 'self', title: 'Self (Bet Creator)', description: 'You will determine the outcome' },
              { id: 'specific', title: 'Specific Person', description: 'Choose one person to resolve' },
              { id: 'multiple', title: 'Multiple Resolvers', description: 'Majority vote from selected resolvers' },
              { id: 'group', title: 'Group Vote', description: 'All participants vote on outcome' }
            ].map((option) => (
              <TouchableOpacity
                key={option.id}
                onPress={() => {
                  haptic.selection();
                  setResolver(option.id as any);
                }}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  paddingVertical: 12,
                  paddingHorizontal: 16,
                  backgroundColor: resolver === option.id ? 'rgba(0, 212, 170, 0.1)' : 'rgba(255, 255, 255, 0.03)',
                  borderRadius: 12,
                  marginBottom: 8,
                  borderWidth: resolver === option.id ? 1 : 0.5,
                  borderColor: resolver === option.id ? '#00D4AA' : 'rgba(255, 255, 255, 0.1)'
                }}
                activeOpacity={0.7}
              >
                <View style={{
                  width: 20,
                  height: 20,
                  borderRadius: 10,
                  backgroundColor: resolver === option.id ? '#00D4AA' : 'transparent',
                  borderWidth: 2,
                  borderColor: resolver === option.id ? '#00D4AA' : 'rgba(255, 255, 255, 0.3)',
                  justifyContent: 'center',
                  alignItems: 'center',
                  marginRight: 12
                }}>
                  {resolver === option.id && (
                    <View style={{
                      width: 8,
                      height: 8,
                      borderRadius: 4,
                      backgroundColor: '#000000'
                    }} />
                  )}
                </View>
                
                <View style={{ flex: 1 }}>
                  <Text style={{
                    fontSize: 15,
                    fontWeight: '600',
                    color: '#ffffff',
                    marginBottom: 2
                  }}>
                    {option.title}
                  </Text>
                  <Text style={{
                    fontSize: 13,
                    color: 'rgba(255, 255, 255, 0.6)'
                  }}>
                    {option.description}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>

          {/* Resolver Selection */}
          {(resolver === 'specific' || resolver === 'multiple') && (
            <>
              <Text style={{
                fontSize: 13,
                fontWeight: '500',
                color: 'rgba(255, 255, 255, 0.8)',
                marginBottom: 12
              }}>
                {resolver === 'specific' ? 'Select Resolver' : 'Select Resolvers'}
              </Text>
              
              <View style={{
                backgroundColor: 'rgba(255, 255, 255, 0.03)',
                borderRadius: 12,
                padding: 16,
                marginBottom: 16
              }}>
                {friends.map((friend) => (
                  <ResolverItem 
                    key={friend.id} 
                    friend={friend} 
                    isMultiple={resolver === 'multiple'}
                  />
                ))}
                
                {((resolver === 'specific' && selectedResolver) || (resolver === 'multiple' && selectedResolvers.length > 0)) && (
                  <Text style={{
                    fontSize: 12,
                    color: '#00D4AA',
                    marginTop: 8,
                    textAlign: 'center'
                  }}>
                    {resolver === 'specific' 
                      ? '1 resolver selected' 
                      : `${selectedResolvers.length} resolver${selectedResolvers.length !== 1 ? 's' : ''} selected`
                    }
                  </Text>
                )}
              </View>
            </>
          )}

          {/* Create Button at Bottom */}
          <LoadingButton
            title="Create Bet"
            onPress={handleCreateBet}
            loading={isCreating}
            disabled={!(betTitle.trim() && selectedSport && stakeAmount)}
            style={{
              marginTop: 32,
              marginBottom: 20,
              shadowColor: (betTitle.trim() && selectedSport && stakeAmount && !isCreating) ? '#00D4AA' : 'transparent',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.3,
              shadowRadius: 8,
              elevation: 8,
            }}
          />
        </ScrollView>

        {/* Date Picker Modal */}
        {showDatePicker && (
          <Modal
            transparent={true}
            animationType="slide"
            visible={!!showDatePicker}
            onRequestClose={() => setShowDatePicker(null)}
          >
            <View style={{
              flex: 1,
              justifyContent: 'flex-end',
              backgroundColor: 'rgba(0, 0, 0, 0.5)'
            }}>
              <View style={{
                backgroundColor: '#1a1a1f',
                borderTopLeftRadius: 20,
                borderTopRightRadius: 20,
                paddingTop: 20,
                paddingBottom: insets.bottom + 20
              }}>
                <View style={{
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  paddingHorizontal: 20,
                  marginBottom: 20
                }}>
                  <TouchableOpacity onPress={() => setShowDatePicker(null)}>
                    <Text style={{ fontSize: 16, color: '#00D4AA', fontWeight: '600' }}>Cancel</Text>
                  </TouchableOpacity>
                  <Text style={{ fontSize: 18, color: '#ffffff', fontWeight: '600' }}>
                    {showDatePicker === 'end' ? 'Join Deadline' : 'Resolution Date'}
                  </Text>
                  <TouchableOpacity onPress={() => setShowDatePicker(null)}>
                    <Text style={{ fontSize: 16, color: '#00D4AA', fontWeight: '600' }}>Done</Text>
                  </TouchableOpacity>
                </View>
                
                <DateTimePicker
                  value={showDatePicker === 'end' ? betEndTime : eventResolutionDate}
                  mode="datetime"
                  display="spinner"
                  minuteInterval={15}
                  onChange={(event, selectedDate) => {
                    if (selectedDate) {
                      const roundedDate = roundToNearest15Minutes(selectedDate);
                      if (showDatePicker === 'end') {
                        setBetEndTime(roundedDate);
                      } else {
                        setEventResolutionDate(roundedDate);
                      }
                    }
                  }}
                  textColor="#ffffff"
                />
              </View>
            </View>
          </Modal>
        )}
      </KeyboardAvoidingView>
    </View>
  );
}