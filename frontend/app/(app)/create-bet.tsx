import React, { useState, useEffect, useRef } from 'react';
import { Text, View, TouchableOpacity, StatusBar, TextInput, Alert, Modal, Animated, Platform, Keyboard, NativeSyntheticEvent, NativeScrollEvent } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { betService, CreateBetRequest } from '../../services/bet/betService';
import { groupService, GroupMemberResponse } from '../../services/group/groupService';
import { haptic } from '../../utils/haptics';
import LoadingButton from '../../components/common/LoadingButton';
import { Avatar } from '../../components/common/Avatar';

// Helper function to round time to nearest minute (for testing - was 15-minute interval)
const roundToNearestMinute = (date: Date): Date => {
  const rounded = new Date(date);
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
  // MVP: Default to SOCIAL, credits disabled for now
  const [stakeType, setStakeType] = useState<'CREDIT' | 'SOCIAL'>('SOCIAL');
  const [stakeAmount, setStakeAmount] = useState('');
  const [socialStakeDescription, setSocialStakeDescription] = useState('');
  const [betEndTime, setBetEndTime] = useState(roundToNearestMinute(new Date(Date.now() + 24 * 60 * 60 * 1000)));
  const [eventResolutionDate, setEventResolutionDate] = useState(roundToNearestMinute(new Date(Date.now() + 48 * 60 * 60 * 1000)));
  const [resolver, setResolver] = useState<'self' | 'specific' | 'multiple' | 'group'>('self');
  const [selectedResolver, setSelectedResolver] = useState<number | null>(null);
  const [selectedResolvers, setSelectedResolvers] = useState<number[]>([]);
  const [showDatePicker, setShowDatePicker] = useState<'start' | 'end' | 'resolution' | null>(null);
  const [multipleChoiceOptions, setMultipleChoiceOptions] = useState(['', '']);
  const [overUnderLine, setOverUnderLine] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [groupMembers, setGroupMembers] = useState<GroupMemberResponse[]>([]);
  const [isLoadingMembers, setIsLoadingMembers] = useState(false);

  // Refs for TextInputs
  const titleRef = useRef<TextInput>(null);
  const descriptionRef = useRef<TextInput>(null);
  const stakeRef = useRef<TextInput>(null);
  const optionRefs = useRef<(TextInput | null)[]>([]);
  const overUnderRef = useRef<TextInput>(null);

  // Progress tracking
  const [completionPercentage, setCompletionPercentage] = useState(0);
  const progressAnim = useRef(new Animated.Value(0)).current;


  const sports = [
    { id: 'sports', name: 'Sports', icon: 'sports-soccer', color: '#4CAF50' },
    { id: 'crypto', name: 'Crypto', icon: 'currency-bitcoin', color: '#FF9500' },
    { id: 'stocks', name: 'Stocks', icon: 'trending-up', color: '#007AFF' },
    { id: 'politics', name: 'Politics', icon: 'how-to-vote', color: '#8B5CF6' },
    { id: 'entertainment', name: 'Entertainment', icon: 'movie', color: '#FF69B4' },
    { id: 'gaming', name: 'Gaming', icon: 'sports-esports', color: '#F59E0B' },
    { id: 'other', name: 'Other', icon: 'casino', color: '#64748B' }
  ];

  // Fetch group members on mount
  useEffect(() => {
    const fetchGroupMembers = async () => {
      if (!groupId) return;

      setIsLoadingMembers(true);
      try {
        const members = await groupService.getGroupMembers(parseInt(groupId as string));
        setGroupMembers(members);
      } catch (error) {
        // Error handled silently
        Alert.alert('Error', 'Failed to load group members');
      } finally {
        setIsLoadingMembers(false);
      }
    };

    fetchGroupMembers();
  }, [groupId]);

  // Calculate completion percentage
  useEffect(() => {
    const hasValidStake = stakeType === 'CREDIT' ? stakeAmount.trim() : socialStakeDescription.trim();

    const fields = [
      betTitle.trim(),
      selectedSport,
      hasValidStake,
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
  }, [betTitle, selectedSport, stakeAmount, socialStakeDescription, stakeType, multipleChoiceOptions, overUnderLine, betType]);

  const handleCreateBet = async () => {
    // Validate stake based on type
    const hasValidStake = stakeType === 'CREDIT' ? stakeAmount.trim() : socialStakeDescription.trim();

    if (!betTitle.trim() || !selectedSport || !hasValidStake) {
      haptic.error();
      Alert.alert('Missing Information', 'Please fill in all required fields.');
      return;
    }

    if (betType === 'MULTIPLE_CHOICE' && multipleChoiceOptions.some(opt => !opt.trim())) {
      haptic.error();
      Alert.alert('Missing Options', 'Please fill in all multiple choice options.');
      return;
    }


    /* COMMENTED OUT - TODO: Implement Over/Under bets later
    if (betType === 'OVER_UNDER' && !overUnderLine) {
      haptic.error();
      Alert.alert('Missing Line', 'Please enter the over/under line.');
      return;
    }
    */

    const confirmMessage = stakeType === 'CREDIT'
      ? `Create "${betTitle}" with $${stakeAmount} entry fee?`
      : `Create "${betTitle}" with social stake: ${socialStakeDescription}?`;

    Alert.alert(
      'Create Bet?',
      confirmMessage,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Create',
          onPress: async () => {
            haptic.medium();
            setIsCreating(true);
            try {
              const betGroupId = groupId ? parseInt(groupId as string) : 1;

              const createBetRequest: CreateBetRequest = {
                groupId: betGroupId,
                title: betTitle,
                description: betDescription || undefined,
                betType: betType,
                resolutionMethod: resolver === 'self' ? 'SELF' :
                                 resolver === 'multiple' ? 'ASSIGNED_RESOLVERS' : 'PARTICIPANT_VOTE',
                bettingDeadline: betEndTime.toISOString(),
                resolveDate: eventResolutionDate.toISOString(),
                stakeType: stakeType, // NEW: Stake type (CREDIT or SOCIAL)
                minimumBet: stakeType === 'CREDIT' ? parseFloat(stakeAmount) : undefined, // DEPRECATED: Only for CREDIT bets
                maximumBet: undefined, // DEPRECATED: For backward compatibility
                fixedStakeAmount: stakeType === 'CREDIT' ? parseFloat(stakeAmount) : undefined, // NEW: Fixed-stake betting (for CREDIT bets)
                socialStakeDescription: stakeType === 'SOCIAL' ? socialStakeDescription : undefined, // NEW: Social stake description
                minimumVotesRequired: resolver === 'multiple' ? selectedResolvers.length : undefined,
                allowCreatorVote: true, // TODO: Add this option to UI if needed
                options: betType === 'MULTIPLE_CHOICE' ? multipleChoiceOptions.filter(opt => opt.trim()) :
                        betType === 'PREDICTION' ? ['Prediction'] : undefined,
                        // COMMENTED OUT - TODO: Implement Over/Under bets later
                        // betType === 'OVER_UNDER' ? [`Over ${overUnderLine}`, `Under ${overUnderLine}`] : undefined
                resolverUserIds: resolver === 'multiple' ? selectedResolvers : undefined
              };

              const response = await betService.createBet(createBetRequest);
              haptic.success();
              Alert.alert('Success!', 'Your bet has been created successfully.', [
                { text: 'OK', onPress: () => {
                  // Navigate back - GroupBetsTab will auto-refresh via useFocusEffect
                  router.back();
                }}
              ]);
            } catch (error) {
              // Error handled silently
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

  const toggleResolverSelection = (memberId: number) => {
    if (resolver === 'specific') {
      setSelectedResolver(memberId);
    } else if (resolver === 'multiple') {
      setSelectedResolvers(prev =>
        prev.includes(memberId)
          ? prev.filter(id => id !== memberId)
          : [...prev, memberId]
      );
    }
  };

  const addMultipleChoiceOption = () => {
    if (multipleChoiceOptions.length < 4) {
      setMultipleChoiceOptions([...multipleChoiceOptions, '']);
    }
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

  const ResolverItem = ({ member, isMultiple = false }: { member: GroupMemberResponse, isMultiple?: boolean }) => {
    const isSelected = isMultiple ? selectedResolvers.includes(member.id) : selectedResolver === member.id;

    return (
      <TouchableOpacity
        onPress={() => toggleResolverSelection(member.id)}
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

        <Avatar
          imageUrl={member.profileImageUrl}
          firstName={member.displayName?.split(' ')[0]}
          lastName={member.displayName?.split(' ').slice(1).join(' ')}
          username={member.username}
          userId={member.id}
          customSize={32}
        />
        <View style={{ width: 12 }} />

        <View style={{ flex: 1 }}>
          <Text style={{
            fontSize: 15,
            fontWeight: '600',
            color: '#ffffff'
          }}>
            {member.username}
          </Text>
          <Text style={{
            fontSize: 13,
            color: 'rgba(255, 255, 255, 0.6)'
          }}>
            {member.displayName || `${member.username}`}
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

      <KeyboardAwareScrollView
        style={{ flex: 1, marginTop: insets.top }}
        contentContainerStyle={{
          paddingTop: 20,
          paddingBottom: insets.bottom + 120,
          paddingHorizontal: 20
        }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        extraScrollHeight={20}
        enableOnAndroid={true}
        enableResetScrollToCoords={false}
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
              description="Participants choose from predefined options. The option with the most votes wins. If there's a tie, the bet ends in a draw."
              icon="ballot"
            />

            <BetTypeCard
              type="PREDICTION"
              title="Prediction"
              description="Participants predict a specific outcome. Resolvers vote on each prediction - majority votes to win, 50% is a draw, less than 50% lose."
              icon="gps-fixed"
            />

            {/* COMMENTED OUT - TODO: Implement Over/Under bets later
            <BetTypeCard
              type="OVER_UNDER"
              title="Over/Under"
              description="Bet whether a value will be over or under a specific line (e.g., total goals > 2.5)"
              icon="balance"
            />
            */}
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
              {multipleChoiceOptions.length < 4 ? (
                <TouchableOpacity
                  onPress={addMultipleChoiceOption}
                  style={{
                    backgroundColor: 'rgba(0, 212, 170, 0.1)',
                    borderRadius: 8,
                    padding: 12,
                    marginBottom: 24,
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <MaterialIcons name="add" size={20} color="#00D4AA" style={{ marginRight: 8 }} />
                  <Text style={{ fontSize: 14, color: '#00D4AA', fontWeight: '600' }}>Add Option</Text>
                </TouchableOpacity>
              ) : (
                <View style={{ marginBottom: 24 }} />
              )}
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

          {/* COMMENTED OUT - TODO: Implement Over/Under bets later
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
          */}

          {/* Betting Parameters */}
          <View style={{
            backgroundColor: 'rgba(255, 255, 255, 0.02)',
            borderRadius: 16,
            padding: 20,
            marginBottom: 20,
            borderWidth: 1,
            borderColor: (stakeType === 'CREDIT' ? stakeAmount.trim() : socialStakeDescription.trim()) ? 'rgba(0, 212, 170, 0.3)' : 'rgba(255, 255, 255, 0.06)'
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
              {(stakeType === 'CREDIT' ? stakeAmount.trim() : socialStakeDescription.trim()) && (
                <MaterialIcons name="check-circle" size={20} color="#00D4AA" />
              )}
            </View>

            {/* MVP: Stake Type Toggle commented out - focusing on social bets first
            <Text style={{
              fontSize: 14,
              fontWeight: '600',
              color: 'rgba(255, 255, 255, 0.9)',
              marginBottom: 8
            }}>
              Stake Type <Text style={{ color: '#FF4757' }}>*</Text>
            </Text>
            <View style={{
              flexDirection: 'row',
              backgroundColor: 'rgba(255, 255, 255, 0.04)',
              borderRadius: 12,
              padding: 4,
              marginBottom: 16
            }}>
              <TouchableOpacity
                onPress={() => setStakeType('CREDIT')}
                style={{
                  flex: 1,
                  paddingVertical: 12,
                  borderRadius: 10,
                  backgroundColor: stakeType === 'CREDIT' ? '#00D4AA' : 'transparent',
                  alignItems: 'center'
                }}
              >
                <Text style={{
                  fontSize: 14,
                  fontWeight: '600',
                  color: stakeType === 'CREDIT' ? '#000000' : 'rgba(255, 255, 255, 0.6)'
                }}>
                  Credits
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setStakeType('SOCIAL')}
                style={{
                  flex: 1,
                  paddingVertical: 12,
                  borderRadius: 10,
                  backgroundColor: stakeType === 'SOCIAL' ? '#00D4AA' : 'transparent',
                  alignItems: 'center'
                }}
              >
                <Text style={{
                  fontSize: 14,
                  fontWeight: '600',
                  color: stakeType === 'SOCIAL' ? '#000000' : 'rgba(255, 255, 255, 0.6)'
                }}>
                  Social
                </Text>
              </TouchableOpacity>
            </View>
            */}

            {/* MVP: Credit stake inputs commented out - focusing on social bets first
            {stakeType === 'CREDIT' ? (
              <>
                <Text style={{
                  fontSize: 14,
                  fontWeight: '600',
                  color: 'rgba(255, 255, 255, 0.9)',
                  marginBottom: 8
                }}>
                  Entry Fee <Text style={{ color: '#FF4757' }}>*</Text>
                </Text>
                <Text style={{
                  fontSize: 12,
                  color: 'rgba(255, 255, 255, 0.6)',
                  marginBottom: 8
                }}>
                  Everyone must bet exactly this amount to join
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
                    placeholder="Fixed amount (everyone pays the same)"
                    placeholderTextColor="rgba(255, 255, 255, 0.4)"
                    keyboardType="decimal-pad"
                    returnKeyType="done"
                  />
                </View>
              </>
            ) : (
            */}
            {/* Social stake input - always shown for MVP */}
            <>
                <Text style={{
                  fontSize: 14,
                  fontWeight: '600',
                  color: 'rgba(255, 255, 255, 0.9)',
                  marginBottom: 8
                }}>
                  Social Stake <Text style={{ color: '#FF4757' }}>*</Text>
                </Text>
                <Text style={{
                  fontSize: 12,
                  color: 'rgba(255, 255, 255, 0.6)',
                  marginBottom: 8
                }}>
                  What's at stake? (e.g., "Loser buys pizza", "Winner picks next movie")
                </Text>
                <View style={{
                  backgroundColor: 'rgba(255, 255, 255, 0.04)',
                  borderRadius: 12,
                  borderWidth: 1,
                  borderColor: socialStakeDescription.trim() ? '#00D4AA' : 'rgba(255, 255, 255, 0.1)',
                  paddingHorizontal: 16,
                  paddingVertical: 14
                }}>
                  <TextInput
                    style={{
                      fontSize: 16,
                      color: '#ffffff',
                      fontWeight: '400',
                      minHeight: 80
                    }}
                    value={socialStakeDescription}
                    onChangeText={setSocialStakeDescription}
                    placeholder="E.g., Loser buys winner coffee"
                    placeholderTextColor="rgba(255, 255, 255, 0.4)"
                    multiline
                    numberOfLines={3}
                    maxLength={500}
                    returnKeyType="done"
                  />
                </View>
                <Text style={{
                  fontSize: 11,
                  color: 'rgba(255, 255, 255, 0.4)',
                  marginTop: 4,
                  textAlign: 'right'
                }}>
                  {socialStakeDescription.length}/500
                </Text>
              </>
            {/* MVP: Closing brace for credit/social conditional commented out - )} */}
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
              { id: 'self', title: 'Self (Bet Creator)', description: 'You alone decide the outcome' },
              { id: 'multiple', title: 'Assigned Resolver(s)', description: 'Selected people vote on the outcome. Majority vote determines the winner.' },
              { id: 'group', title: 'Participant Vote', description: 'All participants vote on the outcome. Majority vote determines the winner.' }
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
          {resolver === 'multiple' && (
            <>
              <Text style={{
                fontSize: 13,
                fontWeight: '500',
                color: 'rgba(255, 255, 255, 0.8)',
                marginBottom: 4
              }}>
                Select Resolver(s)
              </Text>
              <Text style={{
                fontSize: 12,
                color: 'rgba(255, 255, 255, 0.5)',
                marginBottom: 12
              }}>
                Choose one or more people who can resolve this bet
              </Text>

              <View style={{
                backgroundColor: 'rgba(255, 255, 255, 0.03)',
                borderRadius: 12,
                padding: 12,
                marginBottom: 16
              }}>
                {isLoadingMembers ? (
                  <Text style={{
                    fontSize: 14,
                    color: 'rgba(255, 255, 255, 0.6)',
                    textAlign: 'center',
                    paddingVertical: 20
                  }}>
                    Loading members...
                  </Text>
                ) : groupMembers.length === 0 ? (
                  <Text style={{
                    fontSize: 14,
                    color: 'rgba(255, 255, 255, 0.6)',
                    textAlign: 'center',
                    paddingVertical: 20
                  }}>
                    No members found
                  </Text>
                ) : (
                  groupMembers.map((member) => (
                    <ResolverItem
                      key={member.id}
                      member={member}
                      isMultiple={true}
                    />
                  ))
                )}

                {selectedResolvers.length > 0 && (
                  <Text style={{
                    fontSize: 12,
                    color: '#00D4AA',
                    marginTop: 8,
                    textAlign: 'center'
                  }}>
                    {`${selectedResolvers.length} resolver${selectedResolvers.length !== 1 ? 's' : ''} selected`}
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
            disabled={!(betTitle.trim() && selectedSport && (stakeType === 'CREDIT' ? stakeAmount.trim() : socialStakeDescription.trim()))}
            style={{
              marginTop: 32,
              marginBottom: 20,
              shadowColor: (betTitle.trim() && selectedSport && (stakeType === 'CREDIT' ? stakeAmount.trim() : socialStakeDescription.trim()) && !isCreating) ? '#00D4AA' : 'transparent',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.3,
              shadowRadius: 8,
              elevation: 8,
            }}
          />
      </KeyboardAwareScrollView>

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
                  minuteInterval={1}
                  onChange={(event, selectedDate) => {
                    if (selectedDate) {
                      const roundedDate = roundToNearestMinute(selectedDate);
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
    </View>
  );
}