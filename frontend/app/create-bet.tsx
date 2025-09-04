import React, { useState } from 'react';
import { Text, View, TouchableOpacity, ScrollView, StatusBar, TextInput, Alert, Image, Modal } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';

const icon = require("../assets/images/icon.png");

export default function CreateBet() {
  const insets = useSafeAreaInsets();
  const [betTitle, setBetTitle] = useState('');
  const [betDescription, setBetDescription] = useState('');
  const [selectedSport, setSelectedSport] = useState<string | null>(null);
  const [betType, setBetType] = useState<'multiple_choice' | 'exact_value' | 'over_under'>('multiple_choice');
  const [stakeAmount, setStakeAmount] = useState('');
  const [betStartTime, setBetStartTime] = useState(new Date());
  const [betEndTime, setBetEndTime] = useState(new Date(Date.now() + 24 * 60 * 60 * 1000));
  const [eventResolutionDate, setEventResolutionDate] = useState(new Date(Date.now() + 48 * 60 * 60 * 1000));
  const [resolver, setResolver] = useState<'self' | 'specific' | 'multiple' | 'group'>('self');
  const [selectedResolver, setSelectedResolver] = useState<string | null>(null);
  const [selectedResolvers, setSelectedResolvers] = useState<string[]>([]);
  const [evidenceRequirements, setEvidenceRequirements] = useState('');
  const [showDatePicker, setShowDatePicker] = useState<'start' | 'end' | 'resolution' | null>(null);
  const [multipleChoiceOptions, setMultipleChoiceOptions] = useState(['', '']);
  const [exactValueTarget, setExactValueTarget] = useState('');
  const [overUnderLine, setOverUnderLine] = useState('');

  const sports = [
    { id: 'nfl', name: 'NFL', icon: '🏈' },
    { id: 'nba', name: 'NBA', icon: '🏀' },
    { id: 'mlb', name: 'MLB', icon: '⚾' },
    { id: 'nhl', name: 'NHL', icon: '🏒' },
    { id: 'soccer', name: 'Soccer', icon: '⚽' },
    { id: 'tennis', name: 'Tennis', icon: '🎾' },
    { id: 'other', name: 'Other', icon: '🎲' }
  ];

  const friends = [
    { id: '1', username: 'mikeJohnson', name: 'Mike Johnson' },
    { id: '2', username: 'sarahGamer', name: 'Sarah Chen' },
    { id: '3', username: 'alexBets', name: 'Alex Rodriguez' },
    { id: '4', username: 'emilyWins', name: 'Emily Davis' },
    { id: '5', username: 'chrisPlay', name: 'Chris Wilson' }
  ];

  const handleCreateBet = () => {
    if (!betTitle.trim() || !selectedSport || !stakeAmount) {
      Alert.alert('Missing Information', 'Please fill in all required fields.');
      return;
    }

    if (betType === 'multiple_choice' && multipleChoiceOptions.some(opt => !opt.trim())) {
      Alert.alert('Missing Options', 'Please fill in all multiple choice options.');
      return;
    }

    if (betType === 'exact_value' && !exactValueTarget) {
      Alert.alert('Missing Target', 'Please enter the exact value target.');
      return;
    }

    if (betType === 'over_under' && !overUnderLine) {
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
          onPress: () => {
            Alert.alert('Bet Created!', 'Your bet has been created successfully.');
            router.back();
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
      onPress={() => setBetType(type as any)}
      style={{
        backgroundColor: betType === type ? 'rgba(0, 212, 170, 0.15)' : 'rgba(255, 255, 255, 0.05)',
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        borderWidth: betType === type ? 1.5 : 0.5,
        borderColor: betType === type ? '#00D4AA' : 'rgba(255, 255, 255, 0.1)'
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
        <Text style={{ fontSize: 20, marginRight: 10 }}>{icon}</Text>
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
      
      <View style={{ flex: 1 }}>
        {/* Header */}
        <View style={{
          paddingTop: insets.top + 20,
          paddingHorizontal: 20,
          paddingBottom: 16,
          borderBottomWidth: 0.5,
          borderBottomColor: 'rgba(255, 255, 255, 0.08)',
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
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
              <MaterialIcons 
                name="close" 
                size={18} 
                color="#ffffff" 
              />
            </TouchableOpacity>
            
            <Text style={{
              fontSize: 24,
              fontWeight: '600',
              color: '#ffffff'
            }}>
              Create Bet
            </Text>
          </View>

          <TouchableOpacity
            onPress={handleCreateBet}
            style={{
              backgroundColor: (betTitle.trim() && selectedSport && stakeAmount) ? '#00D4AA' : 'rgba(255, 255, 255, 0.08)',
              paddingHorizontal: 16,
              paddingVertical: 8,
              borderRadius: 20,
              opacity: (betTitle.trim() && selectedSport && stakeAmount) ? 1 : 0.5
            }}
            disabled={!(betTitle.trim() && selectedSport && stakeAmount)}
          >
            <Text style={{
              fontSize: 14,
              fontWeight: '600',
              color: (betTitle.trim() && selectedSport && stakeAmount) ? '#000000' : 'rgba(255, 255, 255, 0.6)'
            }}>
              Create
            </Text>
          </TouchableOpacity>
        </View>

        <ScrollView 
          style={{ flex: 1 }}
          contentContainerStyle={{ 
            paddingHorizontal: 20,
            paddingVertical: 16
          }}
          showsVerticalScrollIndicator={false}
        >
          {/* Bet Type Selection */}
          <Text style={{
            fontSize: 18,
            fontWeight: '600',
            color: '#ffffff',
            marginBottom: 16
          }}>
            Bet Type
          </Text>
          
          <BetTypeCard 
            type="multiple_choice"
            title="Multiple Choice"
            description="Participants choose from predefined options (e.g., Team A wins, Team B wins, Draw)"
            icon="📝"
          />
          
          <BetTypeCard 
            type="exact_value"
            title="Exact Value"
            description="Predict a specific number or outcome (e.g., final score will be 3-1)"
            icon="🎯"
          />
          
          <BetTypeCard 
            type="over_under"
            title="Over/Under"
            description="Bet whether a value will be over or under a specific line (e.g., total goals > 2.5)"
            icon="⚖️"
          />

          {/* Bet Details */}
          <Text style={{
            fontSize: 18,
            fontWeight: '600',
            color: '#ffffff',
            marginBottom: 16,
            marginTop: 24
          }}>
            Bet Details
          </Text>

          {/* Title */}
          <Text style={{
            fontSize: 13,
            fontWeight: '500',
            color: 'rgba(255, 255, 255, 0.8)',
            marginBottom: 6
          }}>
            Title *
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
              value={betTitle}
              onChangeText={setBetTitle}
              placeholder="What are you betting on?"
              placeholderTextColor="rgba(255, 255, 255, 0.4)"
              maxLength={100}
            />
          </View>

          {/* Description */}
          <Text style={{
            fontSize: 13,
            fontWeight: '500',
            color: 'rgba(255, 255, 255, 0.8)',
            marginBottom: 6
          }}>
            Description (Optional)
          </Text>
          <View style={{
            backgroundColor: 'rgba(255, 255, 255, 0.06)',
            borderRadius: 8,
            borderWidth: 0.5,
            borderColor: 'rgba(255, 255, 255, 0.15)',
            paddingHorizontal: 12,
            paddingVertical: 10,
            marginBottom: 16
          }}>
            <TextInput
              style={{
                fontSize: 15,
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
            />
          </View>

          {/* Sport Selection */}
          <Text style={{
            fontSize: 13,
            fontWeight: '500',
            color: 'rgba(255, 255, 255, 0.8)',
            marginBottom: 12
          }}>
            Category *
          </Text>
          <ScrollView 
            horizontal
            showsHorizontalScrollIndicator={false}
            style={{ marginBottom: 20 }}
            contentContainerStyle={{ paddingRight: 20 }}
          >
            {sports.map((sport) => (
              <TouchableOpacity
                key={sport.id}
                onPress={() => setSelectedSport(sport.id)}
                style={{
                  backgroundColor: selectedSport === sport.id ? '#00D4AA' : 'rgba(255, 255, 255, 0.08)',
                  paddingHorizontal: 16,
                  paddingVertical: 12,
                  borderRadius: 20,
                  marginRight: 12,
                  flexDirection: 'row',
                  alignItems: 'center'
                }}
              >
                <Text style={{ fontSize: 16, marginRight: 6 }}>{sport.icon}</Text>
                <Text style={{
                  fontSize: 14,
                  fontWeight: '600',
                  color: selectedSport === sport.id ? '#000000' : '#ffffff'
                }}>
                  {sport.name}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Bet Type Specific Fields */}
          {betType === 'multiple_choice' && (
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
                <View key={index} style={{
                  backgroundColor: 'rgba(255, 255, 255, 0.06)',
                  borderRadius: 8,
                  borderWidth: 0.5,
                  borderColor: 'rgba(255, 255, 255, 0.15)',
                  paddingHorizontal: 12,
                  paddingVertical: 12,
                  marginBottom: 8,
                  flexDirection: 'row',
                  alignItems: 'center'
                }}>
                  <TextInput
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
                  />
                  {multipleChoiceOptions.length > 2 && (
                    <TouchableOpacity onPress={() => removeMultipleChoiceOption(index)}>
                      <MaterialIcons name="close" size={20} color="rgba(255, 255, 255, 0.5)" />
                    </TouchableOpacity>
                  )}
                </View>
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

          {betType === 'exact_value' && (
            <>
              <Text style={{
                fontSize: 13,
                fontWeight: '500',
                color: 'rgba(255, 255, 255, 0.8)',
                marginBottom: 6
              }}>
                Target Value *
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
                  value={exactValueTarget}
                  onChangeText={setExactValueTarget}
                  placeholder="e.g., 3, 2-1, John Smith"
                  placeholderTextColor="rgba(255, 255, 255, 0.4)"
                />
              </View>
            </>
          )}

          {betType === 'over_under' && (
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
                />
              </View>
            </>
          )}

          {/* Stake Amount */}
          <Text style={{
            fontSize: 13,
            fontWeight: '500',
            color: 'rgba(255, 255, 255, 0.8)',
            marginBottom: 6
          }}>
            Stake Amount *
          </Text>
          <View style={{
            backgroundColor: 'rgba(255, 255, 255, 0.06)',
            borderRadius: 8,
            borderWidth: 0.5,
            borderColor: 'rgba(255, 255, 255, 0.15)',
            paddingHorizontal: 12,
            paddingVertical: 12,
            marginBottom: 16,
            flexDirection: 'row',
            alignItems: 'center'
          }}>
            <Text style={{
              fontSize: 15,
              color: 'rgba(255, 255, 255, 0.6)',
              marginRight: 8
            }}>
              $
            </Text>
            <TextInput
              style={{
                flex: 1,
                fontSize: 15,
                color: '#ffffff',
                fontWeight: '400'
              }}
              value={stakeAmount}
              onChangeText={setStakeAmount}
              placeholder="How much each participant bets"
              placeholderTextColor="rgba(255, 255, 255, 0.4)"
              keyboardType="numeric"
            />
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

          {/* Start Time */}
          <Text style={{
            fontSize: 13,
            fontWeight: '500',
            color: 'rgba(255, 255, 255, 0.8)',
            marginBottom: 6
          }}>
            Bet Start Time
          </Text>
          <TouchableOpacity
            onPress={() => setShowDatePicker('start')}
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
              {formatDateTime(betStartTime)}
            </Text>
            <MaterialIcons name="access-time" size={20} color="rgba(255, 255, 255, 0.5)" />
          </TouchableOpacity>

          {/* End Time */}
          <Text style={{
            fontSize: 13,
            fontWeight: '500',
            color: 'rgba(255, 255, 255, 0.8)',
            marginBottom: 6
          }}>
            Bet End Time *
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
            marginBottom: 6
          }}>
            Event/Resolution Date *
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
            marginBottom: 16,
            marginTop: 24
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
                onPress={() => setResolver(option.id as any)}
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

          {/* Evidence Requirements */}
          <Text style={{
            fontSize: 13,
            fontWeight: '500',
            color: 'rgba(255, 255, 255, 0.8)',
            marginBottom: 6
          }}>
            Evidence Requirements
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
            />
          </View>

          <View style={{ height: insets.bottom + 20 }} />
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
                    {showDatePicker === 'start' ? 'Start Time' : 
                     showDatePicker === 'end' ? 'End Time' : 'Resolution Date'}
                  </Text>
                  <TouchableOpacity onPress={() => setShowDatePicker(null)}>
                    <Text style={{ fontSize: 16, color: '#00D4AA', fontWeight: '600' }}>Done</Text>
                  </TouchableOpacity>
                </View>
                
                <DateTimePicker
                  value={showDatePicker === 'start' ? betStartTime : 
                        showDatePicker === 'end' ? betEndTime : eventResolutionDate}
                  mode="datetime"
                  display="spinner"
                  onChange={(event, selectedDate) => {
                    if (selectedDate) {
                      if (showDatePicker === 'start') {
                        setBetStartTime(selectedDate);
                      } else if (showDatePicker === 'end') {
                        setBetEndTime(selectedDate);
                      } else {
                        setEventResolutionDate(selectedDate);
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
    </View>
  );
}