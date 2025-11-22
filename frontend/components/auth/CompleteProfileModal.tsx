import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import AuthInput from './AuthInput';
import { userService } from '../../services/user/userService';

interface CompleteProfileModalProps {
  visible: boolean;
  onComplete: () => void;
  onSkip: () => void;
}

export default function CompleteProfileModal({
  visible,
  onComplete,
  onSkip,
}: CompleteProfileModalProps) {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSave = async () => {
    if (!firstName.trim()) {
      setError('Please enter your first name');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      await userService.updateProfile({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
      });
      onComplete();
    } catch (err: any) {
      setError(err?.message || 'Failed to update profile');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onSkip}
    >
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View
          style={{
            flex: 1,
            backgroundColor: 'rgba(0, 0, 0, 0.85)',
            justifyContent: 'center',
            alignItems: 'center',
            paddingHorizontal: 24,
          }}
        >
          <View
            style={{
              backgroundColor: '#1a1a24',
              borderRadius: 20,
              padding: 24,
              width: '100%',
              maxWidth: 400,
              borderWidth: 1,
              borderColor: 'rgba(255, 255, 255, 0.1)',
            }}
          >
            {/* Header */}
            <View style={{ alignItems: 'center', marginBottom: 24 }}>
              <View
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: 28,
                  backgroundColor: 'rgba(0, 212, 170, 0.15)',
                  justifyContent: 'center',
                  alignItems: 'center',
                  marginBottom: 16,
                }}
              >
                <MaterialIcons name="person" size={28} color="#00D4AA" />
              </View>
              <Text
                style={{
                  fontSize: 22,
                  fontWeight: '700',
                  color: '#ffffff',
                  marginBottom: 8,
                }}
              >
                Complete Your Profile
              </Text>
              <Text
                style={{
                  fontSize: 14,
                  color: 'rgba(255, 255, 255, 0.6)',
                  textAlign: 'center',
                  lineHeight: 20,
                }}
              >
                Add your name so friends can find you
              </Text>
            </View>

            {/* Form */}
            <View style={{ marginBottom: 8 }}>
              <AuthInput
                label="First Name"
                value={firstName}
                onChangeText={(text) => {
                  setFirstName(text);
                  setError('');
                }}
                placeholder="Enter your first name"
                autoCapitalize="words"
                isValid={firstName.trim().length >= 2}
                maxLength={50}
              />

              <AuthInput
                label="Last Name (optional)"
                value={lastName}
                onChangeText={setLastName}
                placeholder="Enter your last name"
                autoCapitalize="words"
                isValid={lastName.trim().length >= 2}
                maxLength={50}
              />
            </View>

            {/* Error */}
            {error ? (
              <Text
                style={{
                  fontSize: 13,
                  color: '#EF4444',
                  textAlign: 'center',
                  marginBottom: 16,
                }}
              >
                {error}
              </Text>
            ) : null}

            {/* Buttons */}
            <TouchableOpacity
              onPress={handleSave}
              disabled={isLoading}
              style={{
                backgroundColor: '#00D4AA',
                borderRadius: 12,
                paddingVertical: 14,
                alignItems: 'center',
                marginBottom: 12,
                opacity: isLoading ? 0.7 : 1,
              }}
            >
              {isLoading ? (
                <ActivityIndicator color="#000000" />
              ) : (
                <Text
                  style={{
                    fontSize: 16,
                    fontWeight: '600',
                    color: '#000000',
                  }}
                >
                  Save
                </Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              onPress={onSkip}
              disabled={isLoading}
              style={{
                paddingVertical: 12,
                alignItems: 'center',
              }}
            >
              <Text
                style={{
                  fontSize: 14,
                  color: 'rgba(255, 255, 255, 0.5)',
                  fontWeight: '500',
                }}
              >
                Skip for now
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
