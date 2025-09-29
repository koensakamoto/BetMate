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
import { BetResponse } from '../../services/bet/betService';

interface BetResolutionModalProps {
  visible: boolean;
  onClose: () => void;
  onResolve: (outcome: string, reasoning?: string) => Promise<void>;
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
  const [selectedWinners, setSelectedWinners] = useState<string[]>([]);
  const [reasoning, setReasoning] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Reset state when modal opens
  useEffect(() => {
    if (visible) {
      setSelectedOutcome(null);
      setSelectedWinners([]);
      setReasoning('');
    }
  }, [visible]);

  if (!bet) return null;

  const handleSubmit = async () => {
    if (!selectedOutcome && selectedWinners.length === 0) {
      Alert.alert('Error', 'Please select an outcome or winners');
      return;
    }

    if (resolutionType === 'vote' && !reasoning.trim()) {
      Alert.alert('Error', 'Please provide reasoning for your vote');
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
              // For exact value bets with multiple winners, pass the winners list
              const outcome = selectedWinners.length > 0
                ? JSON.stringify(selectedWinners)
                : selectedOutcome;

              await onResolve(outcome || '', reasoning);
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
    // For prediction/exact value bets, show all unique predictions and allow selecting winners
    // This would need participant prediction data from the backend
    const mockPredictions = [
      { userId: '1', username: 'user1', prediction: '42', amount: 10 },
      { userId: '2', username: 'user2', prediction: '45', amount: 15 },
      { userId: '3', username: 'user3', prediction: '42', amount: 20 },
      { userId: '4', username: 'user4', prediction: '50', amount: 10 }
    ];

    const uniquePredictions = [...new Set(mockPredictions.map(p => p.prediction))];

    return (
      <View style={{ marginBottom: 20 }}>
        <Text style={{
          color: '#ffffff',
          fontSize: 16,
          fontWeight: '600',
          marginBottom: 12
        }}>
          Select Winning Predictions:
        </Text>

        <Text style={{
          color: 'rgba(255, 255, 255, 0.6)',
          fontSize: 13,
          marginBottom: 12
        }}>
          Multiple predictions can be selected as winners
        </Text>

        {uniquePredictions.map((prediction) => {
          const participants = mockPredictions.filter(p => p.prediction === prediction);
          const isSelected = selectedWinners.includes(prediction);

          return (
            <TouchableOpacity
              key={prediction}
              onPress={() => {
                if (isSelected) {
                  setSelectedWinners(prev => prev.filter(w => w !== prediction));
                } else {
                  setSelectedWinners(prev => [...prev, prediction]);
                }
              }}
              style={{
                padding: 16,
                backgroundColor: isSelected
                  ? 'rgba(0, 212, 170, 0.15)'
                  : 'rgba(255, 255, 255, 0.04)',
                borderRadius: 12,
                marginBottom: 8,
                borderWidth: 1,
                borderColor: isSelected
                  ? '#00D4AA'
                  : 'rgba(255, 255, 255, 0.08)'
              }}
            >
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
                <Text style={{ color: '#ffffff', fontSize: 16, fontWeight: '600' }}>
                  Prediction: {prediction}
                </Text>
                {isSelected && (
                  <MaterialIcons name="check-circle" size={20} color="#00D4AA" />
                )}
              </View>

              <Text style={{ color: 'rgba(255, 255, 255, 0.6)', fontSize: 13 }}>
                {participants.length} participant{participants.length !== 1 ? 's' : ''}: {participants.map(p => p.username).join(', ')}
              </Text>

              <Text style={{ color: 'rgba(255, 255, 255, 0.5)', fontSize: 12, marginTop: 4 }}>
                Total stake: ${participants.reduce((sum, p) => sum + p.amount, 0)}
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
                {resolutionType === 'resolve' ? 'Resolution Notes (Optional):' : 'Reasoning (Required):'}
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
              disabled={isSubmitting || (!selectedOutcome && selectedWinners.length === 0)}
              style={{
                backgroundColor: (!selectedOutcome && selectedWinners.length === 0) || isSubmitting
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
                  color: (!selectedOutcome && selectedWinners.length === 0) ? 'rgba(255, 255, 255, 0.3)' : '#000000',
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