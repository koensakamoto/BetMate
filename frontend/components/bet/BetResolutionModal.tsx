import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  TextInput,
  ActivityIndicator,
  Alert
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { BetResponse, betService, BetParticipationResponse } from '../../services/bet/betService';

interface BetResolutionModalProps {
  visible: boolean;
  onClose: () => void;
  onResolve: (outcome?: string, winnerUserIds?: number[], reasoning?: string) => Promise<void>;
  bet: BetResponse | null;
  resolutionType: 'resolve' | 'vote'; // Direct resolution or voting
}

export default function BetResolutionModal({
  visible,
  onClose,
  onResolve,
  bet,
  resolutionType
}: BetResolutionModalProps) {
  const [selectedOutcome, setSelectedOutcome] = useState<string | null>(null);
  const [selectedWinnerIds, setSelectedWinnerIds] = useState<number[]>([]);
  const [reasoning, setReasoning] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [participations, setParticipations] = useState<BetParticipationResponse[]>([]);
  const [isLoadingParticipations, setIsLoadingParticipations] = useState(false);

  // Load participations when modal opens
  useEffect(() => {
    const loadParticipations = async () => {
      if (visible && bet) {
        try {
          setIsLoadingParticipations(true);
          const data = await betService.getBetParticipations(bet.id);
          setParticipations(data);
        } catch (error) {
          console.error('Error loading participations:', error);
          Alert.alert('Error', 'Failed to load participant data');
        } finally {
          setIsLoadingParticipations(false);
        }
      }
    };

    loadParticipations();
  }, [visible, bet]);

  // Reset state when modal opens
  useEffect(() => {
    if (visible) {
      setSelectedOutcome(null);
      setSelectedWinnerIds([]);
      setReasoning('');
    }
  }, [visible]);

  if (!bet) return null;

  const handleSubmit = async () => {
    if (!selectedOutcome && selectedWinnerIds.length === 0) {
      Alert.alert('Error', 'Please select an outcome or winners');
      return;
    }


    Alert.alert(
      resolutionType === 'resolve' ? 'Resolve Bet?' : 'Submit Vote?',
      resolutionType === 'resolve'
        ? `Are you sure you want to resolve this bet? This action cannot be undone.`
        : `Submit your vote for the bet resolution?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: resolutionType === 'resolve' ? 'Resolve' : 'Vote',
          onPress: async () => {
            setIsSubmitting(true);
            try {
              // For winner-based resolution (PREDICTION bets)
              if (selectedWinnerIds.length > 0) {
                await onResolve(undefined, selectedWinnerIds, reasoning);
              } else {
                // For option-based resolution (BINARY/MULTIPLE_CHOICE)
                await onResolve(selectedOutcome || '', undefined, reasoning);
              }
              onClose();
            } catch (error) {
              console.error('Resolution error:', error);
              Alert.alert('Error', 'Failed to submit resolution');
            } finally {
              setIsSubmitting(false);
            }
          }
        }
      ]
    );
  };

  const renderMultipleChoiceOptions = () => {
    const options = bet.options || [];

    return (
      <View style={{ marginBottom: 20 }}>
        <Text style={{
          color: '#ffffff',
          fontSize: 16,
          fontWeight: '600',
          marginBottom: 12
        }}>
          Select Winning Option:
        </Text>

        {options.map((option, index) => (
          <TouchableOpacity
            key={index}
            onPress={() => setSelectedOutcome(`OPTION_${index + 1}`)}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              padding: 16,
              backgroundColor: selectedOutcome === `OPTION_${index + 1}`
                ? 'rgba(0, 212, 170, 0.15)'
                : 'rgba(255, 255, 255, 0.04)',
              borderRadius: 12,
              marginBottom: 8,
              borderWidth: 1,
              borderColor: selectedOutcome === `OPTION_${index + 1}`
                ? '#00D4AA'
                : 'rgba(255, 255, 255, 0.08)'
            }}
          >
            <View style={{
              width: 24,
              height: 24,
              borderRadius: 12,
              borderWidth: 2,
              borderColor: selectedOutcome === `OPTION_${index + 1}` ? '#00D4AA' : 'rgba(255, 255, 255, 0.3)',
              alignItems: 'center',
              justifyContent: 'center',
              marginRight: 12
            }}>
              {selectedOutcome === `OPTION_${index + 1}` && (
                <View style={{
                  width: 12,
                  height: 12,
                  borderRadius: 6,
                  backgroundColor: '#00D4AA'
                }} />
              )}
            </View>
            <Text style={{ color: '#ffffff', fontSize: 15, flex: 1 }}>
              {option}
            </Text>

            {/* Show participant count for this option */}
            <View style={{
              backgroundColor: 'rgba(255, 255, 255, 0.08)',
              paddingHorizontal: 8,
              paddingVertical: 4,
              borderRadius: 8
            }}>
              <Text style={{ color: 'rgba(255, 255, 255, 0.6)', fontSize: 12 }}>
                {index === 0 ? bet.participantsForOption1 :
                 index === 1 ? bet.participantsForOption2 : 0} participants
              </Text>
            </View>
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  const renderExactValueOptions = () => {
    if (isLoadingParticipations) {
      return (
        <View style={{ padding: 20, alignItems: 'center' }}>
          <ActivityIndicator color="#00D4AA" />
          <Text style={{ color: 'rgba(255, 255, 255, 0.6)', marginTop: 8 }}>
            Loading participants...
          </Text>
        </View>
      );
    }

    // Group participations by predicted value
    const predictionGroups = participations.reduce((groups, p) => {
      const prediction = p.predictedValue || p.chosenOptionText || 'Unknown';
      if (!groups[prediction]) {
        groups[prediction] = [];
      }
      groups[prediction].push(p);
      return groups;
    }, {} as Record<string, BetParticipationResponse[]>);

    const uniquePredictions = Object.keys(predictionGroups);

    if (uniquePredictions.length === 0) {
      return (
        <View style={{ padding: 20, alignItems: 'center' }}>
          <Text style={{ color: 'rgba(255, 255, 255, 0.6)' }}>
            No participants found
          </Text>
        </View>
      );
    }

    return (
      <View style={{ marginBottom: 20 }}>
        <Text style={{
          color: '#ffffff',
          fontSize: 16,
          fontWeight: '600',
          marginBottom: 12
        }}>
          Select Winning Users/Predictions:
        </Text>

        <Text style={{
          color: 'rgba(255, 255, 255, 0.6)',
          fontSize: 13,
          marginBottom: 12
        }}>
          Multiple users can be selected as winners
        </Text>

        {uniquePredictions.map((prediction) => {
          const participants = predictionGroups[prediction];
          const participantIds = participants.map(p => p.userId);
          const allSelected = participantIds.every(id => selectedWinnerIds.includes(id));
          const someSelected = participantIds.some(id => selectedWinnerIds.includes(id));

          return (
            <TouchableOpacity
              key={prediction}
              onPress={() => {
                if (allSelected) {
                  // Unselect all
                  setSelectedWinnerIds(prev => prev.filter(id => !participantIds.includes(id)));
                } else {
                  // Select all in this group
                  setSelectedWinnerIds(prev => [...new Set([...prev, ...participantIds])]);
                }
              }}
              style={{
                padding: 16,
                backgroundColor: allSelected
                  ? 'rgba(0, 212, 170, 0.15)'
                  : someSelected
                  ? 'rgba(0, 212, 170, 0.08)'
                  : 'rgba(255, 255, 255, 0.04)',
                borderRadius: 12,
                marginBottom: 8,
                borderWidth: 1,
                borderColor: allSelected
                  ? '#00D4AA'
                  : someSelected
                  ? 'rgba(0, 212, 170, 0.5)'
                  : 'rgba(255, 255, 255, 0.08)'
              }}
            >
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
                <Text style={{ color: '#ffffff', fontSize: 16, fontWeight: '600' }}>
                  Prediction: {prediction}
                </Text>
                {allSelected && (
                  <MaterialIcons name="check-circle" size={20} color="#00D4AA" />
                )}
                {someSelected && !allSelected && (
                  <MaterialIcons name="radio-button-checked" size={20} color="rgba(0, 212, 170, 0.5)" />
                )}
              </View>

              <Text style={{ color: 'rgba(255, 255, 255, 0.6)', fontSize: 13 }}>
                {participants.length} participant{participants.length !== 1 ? 's' : ''}: {participants.map(p => p.displayName || p.username).join(', ')}
              </Text>

              <Text style={{ color: 'rgba(255, 255, 255, 0.5)', fontSize: 12, marginTop: 4 }}>
                Total stake: ${participants.reduce((sum, p) => sum + p.betAmount, 0).toFixed(2)}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    );
  };

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
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
          padding: 20,
          maxHeight: '80%'
        }}>
          {/* Header */}
          <View style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 20
          }}>
            <Text style={{
              color: '#ffffff',
              fontSize: 20,
              fontWeight: '700'
            }}>
              {resolutionType === 'resolve' ? 'Resolve Bet' : 'Vote on Resolution'}
            </Text>

            <TouchableOpacity
              onPress={onClose}
              disabled={isSubmitting}
              style={{
                padding: 4,
                backgroundColor: 'rgba(255, 255, 255, 0.08)',
                borderRadius: 20
              }}
            >
              <MaterialIcons name="close" size={24} color="#ffffff" />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            {/* Bet Info */}
            <View style={{
              backgroundColor: 'rgba(255, 255, 255, 0.04)',
              padding: 12,
              borderRadius: 12,
              marginBottom: 20
            }}>
              <Text style={{ color: '#ffffff', fontSize: 16, fontWeight: '600', marginBottom: 4 }}>
                {bet.title}
              </Text>
              {bet.description && (
                <Text style={{ color: 'rgba(255, 255, 255, 0.6)', fontSize: 14 }}>
                  {bet.description}
                </Text>
              )}
            </View>

            {/* Resolution Options */}
            {bet.betType === 'BINARY' || bet.betType === 'MULTIPLE_CHOICE' ?
              renderMultipleChoiceOptions() :
              renderExactValueOptions()
            }

            {/* Reasoning Input */}
            <View style={{ marginBottom: 20 }}>
              <Text style={{
                color: '#ffffff',
                fontSize: 16,
                fontWeight: '600',
                marginBottom: 8
              }}>
                {resolutionType === 'resolve' ? 'Resolution Notes (Optional):' : 'Reasoning (Optional):'}
              </Text>

              <TextInput
                value={reasoning}
                onChangeText={setReasoning}
                placeholder={resolutionType === 'resolve'
                  ? "Add any notes about the resolution..."
                  : "Explain your vote decision..."}
                placeholderTextColor="rgba(255, 255, 255, 0.3)"
                multiline
                numberOfLines={4}
                style={{
                  backgroundColor: 'rgba(255, 255, 255, 0.04)',
                  borderRadius: 12,
                  padding: 12,
                  color: '#ffffff',
                  fontSize: 14,
                  minHeight: 100,
                  textAlignVertical: 'top',
                  borderWidth: 1,
                  borderColor: 'rgba(255, 255, 255, 0.08)'
                }}
              />
            </View>

            {/* Submit Button */}
            <TouchableOpacity
              onPress={handleSubmit}
              disabled={isSubmitting || (!selectedOutcome && selectedWinnerIds.length === 0)}
              style={{
                backgroundColor: (!selectedOutcome && selectedWinnerIds.length === 0) || isSubmitting
                  ? 'rgba(255, 255, 255, 0.1)'
                  : '#00D4AA',
                paddingVertical: 16,
                borderRadius: 12,
                alignItems: 'center',
                marginBottom: 20
              }}
            >
              {isSubmitting ? (
                <ActivityIndicator color="#ffffff" />
              ) : (
                <Text style={{
                  color: (!selectedOutcome && selectedWinnerIds.length === 0) ? 'rgba(255, 255, 255, 0.3)' : '#000000',
                  fontSize: 16,
                  fontWeight: '700'
                }}>
                  {resolutionType === 'resolve' ? 'Resolve Bet' : 'Submit Vote'}
                </Text>
              )}
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}