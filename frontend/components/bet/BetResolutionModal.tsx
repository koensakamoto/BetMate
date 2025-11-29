import React, { useState, useCallback, useMemo, forwardRef, useImperativeHandle, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Keyboard,
  Platform
} from 'react-native';
import { showErrorToast } from '../../utils/toast';
import {
  BottomSheetModal,
  BottomSheetScrollView,
  BottomSheetTextInput,
  BottomSheetBackdrop
} from '@gorhom/bottom-sheet';
import { MaterialIcons } from '@expo/vector-icons';
import { BetResponse, BetParticipationResponse } from '../../services/bet/betService';

export interface BetResolutionModalRef {
  present: () => void;
  dismiss: () => void;
}

interface BetResolutionModalProps {
  onClose: () => void;
  onResolve: (outcome?: string, winnerUserIds?: number[], reasoning?: string) => Promise<void>;
  bet: BetResponse | null;
  participations: BetParticipationResponse[];
  resolutionType: 'resolve' | 'vote';
}

const BetResolutionModal = forwardRef<BetResolutionModalRef, BetResolutionModalProps>(({
  onClose,
  onResolve,
  bet,
  participations,
  resolutionType
}, ref) => {
  const [selectedOutcome, setSelectedOutcome] = useState<string | null>(null);
  const [selectedWinnerIds, setSelectedWinnerIds] = useState<number[]>([]);
  const [reasoning, setReasoning] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  const bottomSheetRef = React.useRef<BottomSheetModal>(null);

  // Snap points for the bottom sheet
  const snapPoints = useMemo(() => ['80%'], []);

  // Listen for keyboard events
  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

    const showSubscription = Keyboard.addListener(showEvent, (e) => {
      setKeyboardHeight(e.endCoordinates.height);
    });
    const hideSubscription = Keyboard.addListener(hideEvent, () => {
      setKeyboardHeight(0);
    });

    return () => {
      showSubscription.remove();
      hideSubscription.remove();
    };
  }, []);

  // Expose present/dismiss methods to parent
  useImperativeHandle(ref, () => ({
    present: () => {
      // Reset state when presenting
      setSelectedOutcome(null);
      setSelectedWinnerIds([]);
      setReasoning('');
      bottomSheetRef.current?.present();
    },
    dismiss: () => {
      bottomSheetRef.current?.dismiss();
    }
  }));

  const handleSheetChanges = useCallback((index: number) => {
    if (index === -1) {
      Keyboard.dismiss();
      onClose();
    }
  }, [onClose]);


  const renderBackdrop = useCallback(
    (props: any) => (
      <BottomSheetBackdrop
        {...props}
        disappearsOnIndex={-1}
        appearsOnIndex={0}
        opacity={0.5}
      />
    ),
    []
  );

  if (!bet) return null;

  const handleSubmit = async () => {
    if (!selectedOutcome && selectedWinnerIds.length === 0) {
      showErrorToast('Selection Required', 'Please select an outcome or winners');
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
              if (selectedWinnerIds.length > 0) {
                await onResolve(undefined, selectedWinnerIds, reasoning);
              } else {
                await onResolve(selectedOutcome || '', undefined, reasoning);
              }
              bottomSheetRef.current?.dismiss();
            } catch (error) {
              console.error('Resolution error:', error);
              showErrorToast('Error', 'Failed to submit resolution. Please try again.');
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

        {options.map((option, index) => {
          const isSelected = selectedOutcome === `OPTION_${index + 1}`;
          return (
            <TouchableOpacity
              key={index}
              onPress={() => setSelectedOutcome(`OPTION_${index + 1}`)}
              accessible={true}
              accessibilityRole="radio"
              accessibilityLabel={option}
              accessibilityState={{ selected: isSelected }}
              accessibilityHint={isSelected ? 'Selected' : 'Double tap to select this option'}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
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
              <View style={{
                width: 24,
                height: 24,
                borderRadius: 12,
                borderWidth: 2,
                borderColor: isSelected ? '#00D4AA' : 'rgba(255, 255, 255, 0.3)',
                alignItems: 'center',
                justifyContent: 'center',
                marginRight: 12
              }} accessible={false}>
                {isSelected && (
                  <View style={{
                    width: 12,
                    height: 12,
                    borderRadius: 6,
                    backgroundColor: '#00D4AA'
                  }} />
                )}
              </View>
              <Text style={{ color: '#ffffff', fontSize: 15, flex: 1 }} accessible={false}>
                {option}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    );
  };

  const renderExactValueOptions = () => {
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
                  setSelectedWinnerIds(prev => prev.filter(id => !participantIds.includes(id)));
                } else {
                  setSelectedWinnerIds(prev => [...new Set([...prev, ...participantIds])]);
                }
              }}
              accessible={true}
              accessibilityRole="checkbox"
              accessibilityLabel={`${prediction}, ${participants.length} ${participants.length === 1 ? 'participant' : 'participants'}`}
              accessibilityState={{ checked: allSelected ? true : someSelected ? 'mixed' : false }}
              accessibilityHint={allSelected ? 'Double tap to deselect' : 'Double tap to select as winner'}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
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
              <Text style={{ color: '#ffffff', fontSize: 16, fontWeight: '600' }} accessible={false}>
                {prediction}
              </Text>
              {allSelected && (
                <MaterialIcons name="check-circle" size={20} color="#00D4AA" accessible={false} />
              )}
              {someSelected && !allSelected && (
                <MaterialIcons name="radio-button-checked" size={20} color="rgba(0, 212, 170, 0.5)" accessible={false} />
              )}
            </TouchableOpacity>
          );
        })}
      </View>
    );
  };

  return (
    <BottomSheetModal
      ref={bottomSheetRef}
      snapPoints={snapPoints}
      onChange={handleSheetChanges}
      backdropComponent={renderBackdrop}
      backgroundStyle={{
        backgroundColor: '#1a1a1f',
      }}
      handleIndicatorStyle={{
        backgroundColor: 'rgba(255, 255, 255, 0.3)',
        width: 40,
      }}
      android_keyboardInputMode="adjustResize"
    >
      <View style={{ padding: 20, flex: 1 }}>
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
            onPress={() => bottomSheetRef.current?.dismiss()}
            disabled={isSubmitting}
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel="Close"
            accessibilityHint="Double tap to close this modal"
            style={{
              padding: 4,
              backgroundColor: 'rgba(255, 255, 255, 0.08)',
              borderRadius: 20
            }}
          >
            <MaterialIcons name="close" size={24} color="#ffffff" accessible={false} />
          </TouchableOpacity>
        </View>

        <BottomSheetScrollView
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Resolution Options */}
          {bet.betType === 'MULTIPLE_CHOICE' ?
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

            <BottomSheetTextInput
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
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel={isSubmitting ? `${resolutionType === 'resolve' ? 'Resolving' : 'Submitting vote'}, please wait` : resolutionType === 'resolve' ? 'Resolve Bet' : 'Submit Vote'}
            accessibilityState={{
              disabled: isSubmitting || (!selectedOutcome && selectedWinnerIds.length === 0),
              busy: isSubmitting,
            }}
            accessibilityHint={(!selectedOutcome && selectedWinnerIds.length === 0) ? 'Select an option first' : 'Double tap to submit'}
            style={{
              backgroundColor: (!selectedOutcome && selectedWinnerIds.length === 0) || isSubmitting
                ? 'rgba(255, 255, 255, 0.1)'
                : '#00D4AA',
              paddingVertical: 16,
              borderRadius: 12,
              alignItems: 'center',
              marginBottom: keyboardHeight > 0 ? keyboardHeight : 40
            }}
          >
            {isSubmitting ? (
              <ActivityIndicator color="#ffffff" accessible={false} />
            ) : (
              <Text style={{
                color: (!selectedOutcome && selectedWinnerIds.length === 0) ? 'rgba(255, 255, 255, 0.3)' : '#000000',
                fontSize: 16,
                fontWeight: '700'
              }} accessible={false}>
                {resolutionType === 'resolve' ? 'Resolve Bet' : 'Submit Vote'}
              </Text>
            )}
          </TouchableOpacity>
        </BottomSheetScrollView>
      </View>
    </BottomSheetModal>
  );
});

BetResolutionModal.displayName = 'BetResolutionModal';

export default BetResolutionModal;
