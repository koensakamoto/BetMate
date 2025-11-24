import React, { useState, useEffect } from 'react';
import { Text, View, ScrollView, StatusBar, TouchableOpacity, Alert, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { userService } from '../services/user/userService';
import AuthInput from '../components/auth/AuthInput';
import { useAuth } from '../contexts/AuthContext';
import { debugLog, errorLog } from '../config/env';

export default function ChangeEmail() {
  const insets = useSafeAreaInsets();
  const { isAuthenticated, isLoading: authLoading } = useAuth();

  const [currentEmail, setCurrentEmail] = useState<string>('');
  const [newEmail, setNewEmail] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      loadCurrentEmail();
    } else if (!authLoading && !isAuthenticated) {
      router.replace('/auth/login');
    }
  }, [authLoading, isAuthenticated]);

  const loadCurrentEmail = async () => {
    try {
      const profile = await userService.getCurrentUserProfile();
      setCurrentEmail(profile.email);
    } catch (err) {
      errorLog('Failed to load profile:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleSubmit = async () => {
    // Validation
    if (!newEmail.trim()) {
      setError('Please enter a new email address');
      return;
    }

    if (!validateEmail(newEmail)) {
      setError('Please enter a valid email address');
      return;
    }

    if (newEmail.toLowerCase() === currentEmail.toLowerCase()) {
      setError('New email is the same as your current email');
      return;
    }

    if (!currentPassword) {
      setError('Please enter your current password');
      return;
    }

    try {
      setIsSaving(true);
      setError(null);

      const response = await userService.requestEmailChange(newEmail, currentPassword);

      if (response.success) {
        Alert.alert(
          'Verification Email Sent',
          `We've sent a verification link to ${newEmail}. Please check your inbox and click the link to confirm your new email address.\n\nThe link will expire in 24 hours.`,
          [{ text: 'OK', onPress: () => router.back() }]
        );
      } else {
        setError(response.message);
      }
    } catch (err: any) {
      errorLog('Failed to request email change:', err);
      const errorMessage = err.response?.data?.message || err.message || 'Failed to request email change';
      setError(errorMessage);
    } finally {
      setIsSaving(false);
    }
  };

  if (authLoading || isLoading) {
    return (
      <View style={{ flex: 1, backgroundColor: '#0a0a0f', justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#00D4AA" />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: '#0a0a0f' }}>
      <StatusBar barStyle="light-content" backgroundColor="#0a0a0f" translucent={true} />

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
      >
        <ScrollView
          style={{ flex: 1, marginTop: insets.top }}
          contentContainerStyle={{
            paddingTop: 16,
            paddingBottom: insets.bottom + 40,
            paddingHorizontal: 24
          }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header */}
          <View style={{
            flexDirection: 'row',
            alignItems: 'center',
            marginBottom: 40,
            paddingVertical: 8
          }}>
            <TouchableOpacity
              onPress={() => router.back()}
              style={{
                width: 40,
                height: 40,
                borderRadius: 20,
                backgroundColor: 'rgba(255, 255, 255, 0.06)',
                justifyContent: 'center',
                alignItems: 'center',
                marginRight: 20
              }}
              activeOpacity={0.7}
            >
              <MaterialIcons name="arrow-back" size={20} color="rgba(255, 255, 255, 0.9)" />
            </TouchableOpacity>

            <View>
              <Text style={{ fontSize: 24, fontWeight: '700', color: '#ffffff' }}>
                Change Email
              </Text>
              <Text style={{ fontSize: 14, color: 'rgba(255, 255, 255, 0.5)', marginTop: 4 }}>
                Update your email address
              </Text>
            </View>
          </View>

          {/* Current Email */}
          <View style={{
            backgroundColor: 'rgba(255, 255, 255, 0.03)',
            borderRadius: 12,
            padding: 16,
            marginBottom: 24,
            borderWidth: 0.5,
            borderColor: 'rgba(255, 255, 255, 0.08)'
          }}>
            <Text style={{ fontSize: 13, color: 'rgba(255, 255, 255, 0.5)', marginBottom: 4 }}>
              Current Email
            </Text>
            <Text style={{ fontSize: 16, color: '#ffffff', fontWeight: '500' }}>
              {currentEmail}
            </Text>
          </View>

          {/* New Email Input */}
          <View style={{ marginBottom: 16 }}>
            <Text style={{ fontSize: 14, color: 'rgba(255, 255, 255, 0.7)', marginBottom: 8 }}>
              New Email Address
            </Text>
            <AuthInput
              value={newEmail}
              onChangeText={(text) => {
                setNewEmail(text);
                if (error) setError(null);
              }}
              placeholder="Enter new email address"
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              style={{
                backgroundColor: 'rgba(255, 255, 255, 0.05)',
                borderRadius: 12,
                borderWidth: 1,
                borderColor: 'rgba(255, 255, 255, 0.1)',
                paddingHorizontal: 16,
                paddingVertical: 14,
                fontSize: 16,
                color: '#ffffff'
              }}
            />
          </View>

          {/* Password Input */}
          <View style={{ marginBottom: 16 }}>
            <Text style={{ fontSize: 14, color: 'rgba(255, 255, 255, 0.7)', marginBottom: 8 }}>
              Current Password
            </Text>
            <AuthInput
              value={currentPassword}
              onChangeText={(text) => {
                setCurrentPassword(text);
                if (error) setError(null);
              }}
              placeholder="Enter your current password"
              secureTextEntry
              style={{
                backgroundColor: 'rgba(255, 255, 255, 0.05)',
                borderRadius: 12,
                borderWidth: 1,
                borderColor: 'rgba(255, 255, 255, 0.1)',
                paddingHorizontal: 16,
                paddingVertical: 14,
                fontSize: 16,
                color: '#ffffff'
              }}
            />
          </View>

          {/* Error */}
          {error && (
            <View style={{
              backgroundColor: 'rgba(239, 68, 68, 0.1)',
              borderRadius: 12,
              padding: 14,
              marginBottom: 16,
              borderWidth: 0.5,
              borderColor: 'rgba(239, 68, 68, 0.3)'
            }}>
              <Text style={{ fontSize: 14, color: '#EF4444', textAlign: 'center' }}>
                {error}
              </Text>
            </View>
          )}

          {/* Info */}
          <View style={{
            backgroundColor: 'rgba(0, 212, 170, 0.1)',
            borderRadius: 12,
            padding: 16,
            marginBottom: 32,
            borderWidth: 0.5,
            borderColor: 'rgba(0, 212, 170, 0.2)'
          }}>
            <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
              <MaterialIcons name="info" size={18} color="#00D4AA" style={{ marginRight: 12, marginTop: 2 }} />
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 14, color: '#00D4AA', fontWeight: '600', marginBottom: 4 }}>
                  How it works
                </Text>
                <Text style={{ fontSize: 13, color: 'rgba(255, 255, 255, 0.7)', lineHeight: 20 }}>
                  • We'll send a verification link to your new email{'\n'}
                  • Click the link within 24 hours to confirm{'\n'}
                  • Your current email will be notified of this change
                </Text>
              </View>
            </View>
          </View>

          {/* Submit Button */}
          <TouchableOpacity
            onPress={handleSubmit}
            disabled={isSaving || !newEmail.trim() || !currentPassword}
            style={{
              backgroundColor: '#00D4AA',
              borderRadius: 12,
              paddingVertical: 16,
              alignItems: 'center',
              opacity: (isSaving || !newEmail.trim() || !currentPassword) ? 0.5 : 1
            }}
            activeOpacity={0.8}
          >
            {isSaving ? (
              <ActivityIndicator size="small" color="#000000" />
            ) : (
              <Text style={{ fontSize: 16, fontWeight: '600', color: '#000000' }}>
                Send Verification Email
              </Text>
            )}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}
