import React, { useState } from 'react';
import { Text, View, TouchableOpacity, ScrollView, StatusBar, TextInput, Alert, Image, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { betService } from '../services/bet/betService';
import { haptic } from '../utils/haptics';

export default function SubmitProof() {
  const insets = useSafeAreaInsets();
  const { betId, betTitle } = useLocalSearchParams();
  const [proofPhoto, setProofPhoto] = useState<string | null>(null);
  const [proofDescription, setProofDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const pickImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Please grant permission to access your photo library');
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
      Alert.alert('Error', 'Failed to select image');
    }
  };

  const submitProof = async () => {
    try {
      setSubmitting(true);

      // Upload photo first if provided
      let uploadedProofUrl: string | undefined = undefined;
      if (proofPhoto) {
        try {
          console.log('Uploading proof photo...');
          const fileName = proofPhoto.split('/').pop() || `proof_${Date.now()}.jpg`;
          uploadedProofUrl = await betService.uploadFulfillmentProof(Number(betId), proofPhoto, fileName);
          console.log('Photo uploaded successfully:', uploadedProofUrl);
        } catch (uploadError) {
          console.error('Photo upload failed:', uploadError);
          Alert.alert('Upload Error', 'Failed to upload photo. Please try again.');
          return;
        }
      }

      // Submit fulfillment claim with proof URL and description
      try {
        console.log('Submitting fulfillment claim...');
        await betService.loserClaimFulfilled(Number(betId), uploadedProofUrl, proofDescription?.trim() || undefined);
        console.log('Fulfillment claim submitted successfully');

        haptic.success();
        Alert.alert('Success', 'Your fulfillment claim has been submitted!', [
          {
            text: 'OK',
            onPress: () => router.back(),
          },
        ]);
      } catch (submitError) {
        console.error('Fulfillment claim submission failed:', submitError);
        Alert.alert('Submission Error', 'Failed to record fulfillment claim. Please try again.');
      }
    } catch (error) {
      console.error('Unexpected error in submitProof:', error);
      Alert.alert('Error', 'An unexpected error occurred. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#0a0a0f' }}>
      <StatusBar barStyle="light-content" />

      {/* Header */}
      <View style={{
        paddingTop: insets.top,
        paddingHorizontal: 20,
        paddingBottom: 16,
        backgroundColor: '#0a0a0f',
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255, 255, 255, 0.1)',
      }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <TouchableOpacity
            onPress={() => {
              haptic.selection();
              router.back();
            }}
            style={{
              width: 40,
              height: 40,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <MaterialIcons name="close" size={28} color="#ffffff" />
          </TouchableOpacity>

          <View style={{ flex: 1, alignItems: 'center', marginHorizontal: 16 }}>
            <Text style={{ fontSize: 18, fontWeight: '600', color: '#ffffff' }}>
              Submit Proof
            </Text>
            {betTitle && (
              <Text style={{ fontSize: 13, color: 'rgba(255, 255, 255, 0.6)', marginTop: 2 }} numberOfLines={1}>
                {betTitle}
              </Text>
            )}
          </View>

          <View style={{ width: 40 }} />
        </View>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
        keyboardVerticalOffset={0}
      >
        <ScrollView
          contentContainerStyle={{
            padding: 20,
            paddingBottom: insets.bottom + 20,
          }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={{ color: 'rgba(255, 255, 255, 0.7)', marginBottom: 24, fontSize: 15, lineHeight: 22 }}>
            Optionally add proof that you've fulfilled the stake. Photos and descriptions help winners confirm completion.
          </Text>

          {/* Photo Upload */}
          <View style={{ marginBottom: 24 }}>
            <Text style={{ color: 'rgba(255, 255, 255, 0.9)', fontSize: 15, fontWeight: '600', marginBottom: 12 }}>
              Photo Proof (Optional)
            </Text>
            {proofPhoto ? (
              <View>
                <Image
                  source={{ uri: proofPhoto }}
                  style={{ width: '100%', height: 240, borderRadius: 12, marginBottom: 12 }}
                  resizeMode="cover"
                />
                <TouchableOpacity
                  onPress={() => {
                    haptic.selection();
                    setProofPhoto(null);
                  }}
                  style={{
                    backgroundColor: 'rgba(239, 68, 68, 0.15)',
                    borderRadius: 12,
                    borderWidth: 1,
                    borderColor: 'rgba(239, 68, 68, 0.3)',
                    padding: 14,
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 8
                  }}
                >
                  <MaterialIcons name="delete" size={20} color="#ef4444" />
                  <Text style={{ color: '#ef4444', fontWeight: '600', letterSpacing: 0.3 }}>Remove Photo</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity
                onPress={pickImage}
                style={{
                  backgroundColor: 'rgba(0, 212, 170, 0.1)',
                  borderWidth: 2,
                  borderStyle: 'dashed',
                  borderColor: 'rgba(0, 212, 170, 0.4)',
                  borderRadius: 12,
                  padding: 32,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <View style={{
                  width: 64,
                  height: 64,
                  borderRadius: 32,
                  backgroundColor: 'rgba(0, 212, 170, 0.15)',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: 12,
                }}>
                  <MaterialIcons name="add-photo-alternate" size={32} color="#00D4AA" />
                </View>
                <Text style={{ color: '#00D4AA', fontWeight: '600', fontSize: 16, marginBottom: 4 }}>Add Photo</Text>
                <Text style={{ color: 'rgba(255, 255, 255, 0.5)', fontSize: 13 }}>Tap to upload proof</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Text Description */}
          <View style={{ marginBottom: 32 }}>
            <Text style={{ color: 'rgba(255, 255, 255, 0.9)', fontSize: 15, fontWeight: '600', marginBottom: 12 }}>
              Description (Optional)
            </Text>
            <TextInput
              value={proofDescription}
              onChangeText={setProofDescription}
              placeholder="Describe how you fulfilled the stake..."
              placeholderTextColor="rgba(255, 255, 255, 0.3)"
              multiline
              numberOfLines={6}
              style={{
                backgroundColor: 'rgba(255, 255, 255, 0.05)',
                borderWidth: 1.5,
                borderColor: 'rgba(255, 255, 255, 0.15)',
                borderRadius: 12,
                padding: 16,
                color: '#ffffff',
                textAlignVertical: 'top',
                minHeight: 140,
                fontSize: 15,
                lineHeight: 22,
              }}
            />
          </View>

          {/* Submit Button */}
          <TouchableOpacity
            onPress={() => {
              haptic.medium();
              submitProof();
            }}
            disabled={submitting}
            style={{
              backgroundColor: '#00D4AA',
              borderRadius: 12,
              padding: 18,
              marginBottom: 12,
              opacity: submitting ? 0.6 : 1,
              shadowColor: '#00D4AA',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.3,
              shadowRadius: 12,
              elevation: 4,
            }}
            activeOpacity={0.8}
          >
            {submitting ? (
              <ActivityIndicator size="small" color="#000000" />
            ) : (
              <Text style={{ color: '#000000', fontWeight: '700', textAlign: 'center', fontSize: 16, letterSpacing: 0.3 }}>
                Submit Fulfillment Claim
              </Text>
            )}
          </TouchableOpacity>

          {/* Cancel Button */}
          <TouchableOpacity
            onPress={() => {
              haptic.selection();
              router.back();
            }}
            disabled={submitting}
            style={{
              backgroundColor: 'rgba(255, 255, 255, 0.05)',
              borderRadius: 12,
              padding: 18,
              borderWidth: 1,
              borderColor: 'rgba(255, 255, 255, 0.1)',
            }}
            activeOpacity={0.8}
          >
            <Text style={{ color: 'rgba(255, 255, 255, 0.7)', fontWeight: '600', textAlign: 'center', fontSize: 16, letterSpacing: 0.3 }}>
              Cancel
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}
