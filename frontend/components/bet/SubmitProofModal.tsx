import React, { useState } from 'react';
import { Text, View, TouchableOpacity, Alert, Image, ActivityIndicator, Linking } from 'react-native';
import { showErrorToast } from '../../utils/toast';
import { MaterialIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { betService } from '../../services/bet/betService';
import { haptic } from '../../utils/haptics';
import AppBottomSheet, { BottomSheetTextInput } from '../common/AppBottomSheet';

interface SubmitProofModalProps {
  visible: boolean;
  onClose: () => void;
  betId: number;
  betTitle: string;
  onSuccess?: () => void;
}

export function SubmitProofModal({
  visible,
  onClose,
  betId,
  betTitle,
  onSuccess
}: SubmitProofModalProps) {
  const [proofPhoto, setProofPhoto] = useState<string | null>(null);
  const [proofDescription, setProofDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const resetForm = () => {
    setProofPhoto(null);
    setProofDescription('');
  };

  const handleClose = () => {
    if (!submitting) {
      resetForm();
      onClose();
    }
  };

  const pickImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Permission Required',
          'To select a proof photo, please enable photo library access in Settings.',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Open Settings', onPress: () => Linking.openSettings() }
          ]
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setProofPhoto(result.assets[0].uri);
        haptic.light();
      }
    } catch (error) {
      console.error('Failed to pick image:', error);
      showErrorToast('Error', 'Failed to select image');
    }
  };

  const submitProof = async () => {
    try {
      setSubmitting(true);

      // Upload photo first if provided
      let uploadedProofUrl: string | undefined = undefined;
      if (proofPhoto) {
        try {
          const fileName = proofPhoto.split('/').pop() || `proof_${Date.now()}.jpg`;
          uploadedProofUrl = await betService.uploadFulfillmentProof(betId, proofPhoto, fileName);
        } catch (uploadError) {
          console.error('Photo upload failed:', uploadError);
          showErrorToast('Upload Error', 'Failed to upload photo. Please try again.');
          return;
        }
      }

      // Submit fulfillment claim with proof URL and description
      try {
        await betService.loserClaimFulfilled(betId, uploadedProofUrl, proofDescription?.trim() || undefined);

        haptic.success();
        resetForm();
        onClose();
        onSuccess?.();
      } catch (submitError) {
        console.error('Fulfillment claim submission failed:', submitError);
        showErrorToast('Submission Error', 'Failed to record fulfillment claim. Please try again.');
      }
    } catch (error) {
      console.error('Unexpected error in submitProof:', error);
      showErrorToast('Error', 'An unexpected error occurred. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const bottomAction = (
    <View style={{ gap: 12 }}>
      <TouchableOpacity
        onPress={() => {
          haptic.medium();
          submitProof();
        }}
        disabled={submitting}
        accessible={true}
        accessibilityRole="button"
        accessibilityLabel={submitting ? 'Submitting fulfillment claim, please wait' : 'Submit Fulfillment Claim'}
        accessibilityState={{
          disabled: submitting,
          busy: submitting,
        }}
        accessibilityHint={submitting ? undefined : 'Double tap to submit your fulfillment claim'}
        style={{
          backgroundColor: '#00D4AA',
          borderRadius: 12,
          padding: 16,
          opacity: submitting ? 0.6 : 1,
        }}
        activeOpacity={0.8}
      >
        {submitting ? (
          <ActivityIndicator size="small" color="#000000" accessible={false} />
        ) : (
          <Text style={{ color: '#000000', fontWeight: '700', textAlign: 'center', fontSize: 16 }} accessible={false}>
            Submit Fulfillment Claim
          </Text>
        )}
      </TouchableOpacity>
    </View>
  );

  return (
    <AppBottomSheet
      visible={visible}
      onClose={handleClose}
      snapPoints={['90%']}
      bottomAction={bottomAction}
    >
      {/* Photo Upload */}
      <View style={{ marginBottom: 20 }}>
        <Text style={{ color: 'rgba(255, 255, 255, 0.9)', fontSize: 14, fontWeight: '600', marginBottom: 10 }}>
          Photo Proof (Optional)
        </Text>
        {proofPhoto ? (
          <View style={{ position: 'relative' }}>
            <Image
              source={{ uri: proofPhoto }}
              style={{ width: '100%', height: 180, borderRadius: 12 }}
              resizeMode="cover"
            />
            <TouchableOpacity
              onPress={() => {
                haptic.selection();
                setProofPhoto(null);
              }}
              accessible={true}
              accessibilityRole="button"
              accessibilityLabel="Remove photo"
              accessibilityHint="Double tap to remove this photo"
              style={{
                position: 'absolute',
                top: 8,
                right: 8,
                width: 32,
                height: 32,
                borderRadius: 16,
                backgroundColor: 'rgba(0, 0, 0, 0.6)',
                alignItems: 'center',
                justifyContent: 'center',
              }}
              activeOpacity={0.7}
            >
              <MaterialIcons name="close" size={20} color="#ffffff" accessible={false} />
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity
            onPress={pickImage}
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel="Add photo proof"
            accessibilityHint="Double tap to select a photo from your library"
            style={{
              backgroundColor: 'rgba(0, 212, 170, 0.1)',
              borderWidth: 2,
              borderStyle: 'dashed',
              borderColor: 'rgba(0, 212, 170, 0.4)',
              borderRadius: 12,
              padding: 24,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <View style={{
              width: 52,
              height: 52,
              borderRadius: 26,
              backgroundColor: 'rgba(0, 212, 170, 0.15)',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 10,
            }} accessible={false}>
              <MaterialIcons name="add-photo-alternate" size={26} color="#00D4AA" accessible={false} />
            </View>
            <Text style={{ color: '#00D4AA', fontWeight: '600', fontSize: 15, marginBottom: 2 }} accessible={false}>Add Photo</Text>
            <Text style={{ color: 'rgba(255, 255, 255, 0.5)', fontSize: 12 }} accessible={false}>Tap to upload proof</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Text Description */}
      <View style={{ marginBottom: 8 }}>
        <Text style={{ color: 'rgba(255, 255, 255, 0.9)', fontSize: 14, fontWeight: '600', marginBottom: 10 }}>
          Description (Optional)
        </Text>
        <BottomSheetTextInput
          value={proofDescription}
          onChangeText={setProofDescription}
          placeholder="Describe how you fulfilled the stake..."
          placeholderTextColor="rgba(255, 255, 255, 0.3)"
          multiline
          numberOfLines={4}
          style={{
            backgroundColor: 'rgba(255, 255, 255, 0.05)',
            borderWidth: 1.5,
            borderColor: 'rgba(255, 255, 255, 0.15)',
            borderRadius: 12,
            padding: 14,
            color: '#ffffff',
            textAlignVertical: 'top',
            minHeight: 100,
            fontSize: 15,
            lineHeight: 20,
          }}
        />
      </View>
    </AppBottomSheet>
  );
}

export default SubmitProofModal;
