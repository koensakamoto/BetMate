import React, { useState, useEffect } from 'react';
import { Text, View, ScrollView, StatusBar, TouchableOpacity, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { userService } from '../../../services/user/userService';
import { useAuth } from '../../../contexts/AuthContext';
import { errorLog } from '../../../config/env';
import SettingsInput from '../../../components/settings/SettingsInput';
import { showErrorToast } from '../../../utils/toast';

export default function ChangeUsername() {
  const insets = useSafeAreaInsets();
  const { user, isAuthenticated, isLoading: authLoading, refreshUser } = useAuth();

  const currentUsername = user?.username || '';
  const [newUsername, setNewUsername] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isCheckingAvailability, setIsCheckingAvailability] = useState(false);
  const [isAvailable, setIsAvailable] = useState<boolean | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.replace('/auth/login');
    }
  }, [authLoading, isAuthenticated]);

  // Debounced availability check
  useEffect(() => {
    if (!newUsername || newUsername.length < 3) {
      setIsAvailable(null);
      setError(null);
      setIsCheckingAvailability(false);
      return;
    }

    // Validate format
    const usernameRegex = /^[a-zA-Z0-9_]{3,50}$/;
    if (!usernameRegex.test(newUsername)) {
      setError('3-50 characters, letters, numbers, and underscores only');
      setIsAvailable(null);
      setIsCheckingAvailability(false);
      return;
    }

    // Check if same as current
    if (newUsername.toLowerCase() === currentUsername.toLowerCase()) {
      setError('This is your current username');
      setIsAvailable(null);
      setIsCheckingAvailability(false);
      return;
    }

    // Don't clear isAvailable/error here - keep previous state visible during debounce
    const timeoutId = setTimeout(async () => {
      setIsCheckingAvailability(true);
      try {
        const result = await userService.checkUsernameAvailability(newUsername);
        setIsAvailable(result.available);
        setError(result.available ? null : 'Username is already taken');
      } catch (err) {
        setError('Failed to check availability');
        setIsAvailable(null);
      } finally {
        setIsCheckingAvailability(false);
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [newUsername, currentUsername]);

  const handleSave = async () => {
    if (!newUsername || !isAvailable) return;

    try {
      setIsSaving(true);
      setError(null);

      const response = await userService.changeUsername(newUsername);

      if (response.success) {
        // Refresh user context with new username
        await refreshUser();

        router.back();
      } else {
        showErrorToast('Error', response.message);
      }
    } catch (err: any) {
      errorLog('Failed to change username:', err);
      setError(err.response?.data?.message || err.message || 'Failed to change username');
    } finally {
      setIsSaving(false);
    }
  };

  if (authLoading) {
    return (
      <View style={{ flex: 1, backgroundColor: '#0a0a0f', justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#00D4AA" />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: '#0a0a0f' }}>
      <StatusBar barStyle="light-content" backgroundColor="#0a0a0f" translucent={true} />

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
            marginBottom: 32,
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
                marginRight: 16
              }}
              activeOpacity={0.7}
            >
              <MaterialIcons name="arrow-back" size={20} color="rgba(255, 255, 255, 0.9)" />
            </TouchableOpacity>

            <Text style={{ fontSize: 24, fontWeight: '700', color: '#ffffff' }}>
              Change Username
            </Text>
          </View>

          {/* Current Username Display */}
          <View style={{ marginBottom: 24 }}>
            <Text style={{
              fontSize: 14,
              fontWeight: '500',
              color: 'rgba(255, 255, 255, 0.7)',
              marginBottom: 8
            }}>
              Current Username
            </Text>
            <View style={{
              backgroundColor: 'rgba(255, 255, 255, 0.05)',
              borderRadius: 12,
              borderWidth: 1,
              borderColor: 'rgba(255, 255, 255, 0.1)',
              paddingHorizontal: 16,
              height: 52,
              flexDirection: 'row',
              alignItems: 'center'
            }}>
              <View style={{
                width: 36,
                height: 36,
                borderRadius: 18,
                backgroundColor: 'rgba(0, 212, 170, 0.15)',
                justifyContent: 'center',
                alignItems: 'center',
                marginRight: 12
              }}>
                <Text style={{ fontSize: 16, fontWeight: '700', color: '#00D4AA' }}>
                  {currentUsername.charAt(0).toUpperCase()}
                </Text>
              </View>
              <Text style={{ fontSize: 16, color: '#ffffff', fontWeight: '500' }}>
                @{currentUsername}
              </Text>
            </View>
          </View>

          {/* New Username Input */}
          <SettingsInput
            label="New Username"
            value={newUsername}
            onChangeText={(text) => setNewUsername(text.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
            placeholder="username"
            prefix="@"
            autoCapitalize="none"
            error={error || undefined}
            isValid={isAvailable === true}
            isLoading={isCheckingAvailability && isAvailable === null && !error}
            style={{ marginBottom: 8 }}
          />

          {/* Success Message */}
          {isAvailable === true && !error && (
            <Text style={{
              fontSize: 12,
              color: '#00D4AA',
              fontWeight: '400',
              marginBottom: 16
            }}>
              Username is available
            </Text>
          )}

          {/* Guidelines */}
          <View style={{
            marginTop: 16,
            backgroundColor: 'rgba(255, 255, 255, 0.05)',
            borderRadius: 12,
            borderWidth: 1,
            borderColor: 'rgba(255, 255, 255, 0.1)',
            padding: 16,
            marginBottom: 32
          }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 14 }}>
              <MaterialIcons name="lightbulb-outline" size={18} color="rgba(255, 255, 255, 0.5)" />
              <Text style={{
                fontSize: 14,
                fontWeight: '600',
                color: 'rgba(255, 255, 255, 0.8)',
                marginLeft: 8
              }}>
                Username Guidelines
              </Text>
            </View>

            <View style={{ gap: 10 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <View style={{
                  width: 4,
                  height: 4,
                  borderRadius: 2,
                  backgroundColor: 'rgba(255, 255, 255, 0.4)',
                  marginRight: 10
                }} />
                <Text style={{ fontSize: 14, color: 'rgba(255, 255, 255, 0.6)' }}>
                  3-50 characters long
                </Text>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <View style={{
                  width: 4,
                  height: 4,
                  borderRadius: 2,
                  backgroundColor: 'rgba(255, 255, 255, 0.4)',
                  marginRight: 10
                }} />
                <Text style={{ fontSize: 14, color: 'rgba(255, 255, 255, 0.6)' }}>
                  Letters, numbers, and underscores only
                </Text>
              </View>
            </View>
          </View>

          {/* Save Button */}
          <TouchableOpacity
            onPress={handleSave}
            disabled={isSaving || !isAvailable}
            style={{
              backgroundColor: isAvailable ? '#00D4AA' : 'rgba(255, 255, 255, 0.1)',
              borderRadius: 12,
              paddingVertical: 16,
              alignItems: 'center',
              flexDirection: 'row',
              justifyContent: 'center',
              opacity: isSaving ? 0.7 : 1
            }}
            activeOpacity={0.8}
          >
            {isSaving ? (
              <ActivityIndicator size="small" color={isAvailable ? '#000000' : '#ffffff'} />
            ) : (
              <>
                <MaterialIcons
                  name="check"
                  size={20}
                  color={isAvailable ? '#000000' : 'rgba(255, 255, 255, 0.4)'}
                  style={{ marginRight: 8 }}
                />
                <Text style={{
                  fontSize: 16,
                  fontWeight: '600',
                  color: isAvailable ? '#000000' : 'rgba(255, 255, 255, 0.4)'
                }}>
                  Save Username
                </Text>
              </>
            )}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}
