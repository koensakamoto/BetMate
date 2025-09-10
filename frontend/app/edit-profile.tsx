import React, { useState, useEffect } from 'react';
import { Text, View, ScrollView, StatusBar, TouchableOpacity, Alert, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { userService, UserProfileResponse, UserProfileUpdateRequest } from '../services/user/userService';
import AuthInput from '../components/auth/AuthInput';
import AuthButton from '../components/auth/AuthButton';
import { debugLog, errorLog } from '../config/env';

export default function EditProfile() {
  const insets = useSafeAreaInsets();
  const [userProfile, setUserProfile] = useState<UserProfileResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: ''
  });
  const [errors, setErrors] = useState<{[key: string]: string}>({});

  useEffect(() => {
    loadUserProfile();
  }, []);

  const loadUserProfile = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const profile = await userService.getCurrentUserProfile();
      setUserProfile(profile);
      
      // Pre-fill form with current data
      setFormData({
        firstName: profile.firstName || '',
        lastName: profile.lastName || ''
      });
      
      debugLog('User profile loaded for editing:', profile);
    } catch (err: any) {
      errorLog('Failed to load user profile:', err);
      setError(err.message || 'Failed to load profile');
    } finally {
      setIsLoading(false);
    }
  };

  const validateForm = (): boolean => {
    const newErrors: {[key: string]: string} = {};

    if (!formData.firstName.trim()) {
      newErrors.firstName = 'First name is required';
    } else if (formData.firstName.trim().length < 2) {
      newErrors.firstName = 'First name must be at least 2 characters';
    }

    if (!formData.lastName.trim()) {
      newErrors.lastName = 'Last name is required';
    } else if (formData.lastName.trim().length < 2) {
      newErrors.lastName = 'Last name must be at least 2 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) return;

    try {
      setIsSaving(true);
      setError(null);
      
      const updateData: UserProfileUpdateRequest = {
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim()
      };
      
      const updatedProfile = await userService.updateProfile(updateData);
      debugLog('Profile updated successfully:', updatedProfile);
      
      Alert.alert(
        'Success',
        'Profile updated successfully',
        [
          { 
            text: 'OK', 
            onPress: () => router.back() 
          }
        ]
      );
    } catch (err: any) {
      errorLog('Failed to update profile:', err);
      setError(err.message || 'Failed to update profile');
      Alert.alert(
        'Error',
        err.message || 'Failed to update profile. Please try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setIsSaving(false);
    }
  };

  const updateField = (field: keyof typeof formData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
    // Clear general error
    if (error) {
      setError(null);
    }
  };

  if (isLoading) {
    return (
      <View style={{ flex: 1, backgroundColor: '#0a0a0f', justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#00D4AA" />
        <Text style={{ color: '#ffffff', marginTop: 16, fontSize: 16 }}>Loading profile...</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: '#0a0a0f' }}>
      <StatusBar
        barStyle="light-content"
        backgroundColor="#0a0a0f"
        translucent={true}
      />
      
      <KeyboardAvoidingView 
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView 
          style={{ flex: 1 }}
          contentContainerStyle={{ 
            paddingTop: insets.top + 20,
            paddingBottom: insets.bottom + 20,
            paddingHorizontal: 24
          }}
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 32
          }}>
            <TouchableOpacity
              onPress={() => router.back()}
              style={{
                width: 40,
                height: 40,
                borderRadius: 20,
                backgroundColor: 'rgba(255, 255, 255, 0.08)',
                justifyContent: 'center',
                alignItems: 'center'
              }}
            >
              <MaterialIcons name="arrow-back" size={20} color="#ffffff" />
            </TouchableOpacity>
            
            <Text style={{
              fontSize: 20,
              fontWeight: '600',
              color: '#ffffff'
            }}>
              Edit Profile
            </Text>
            
            <View style={{ width: 40 }} />
          </View>

          {/* Profile Info */}
          <View style={{
            backgroundColor: 'rgba(255, 255, 255, 0.03)',
            borderRadius: 16,
            borderWidth: 1,
            borderColor: 'rgba(255, 255, 255, 0.08)',
            padding: 20,
            marginBottom: 24
          }}>
            <Text style={{
              fontSize: 16,
              fontWeight: '600',
              color: '#ffffff',
              marginBottom: 4
            }}>
              {userProfile?.username}
            </Text>
            <Text style={{
              fontSize: 14,
              color: 'rgba(255, 255, 255, 0.6)',
              marginBottom: 16
            }}>
              {userProfile?.email}
            </Text>
            
            <Text style={{
              fontSize: 12,
              color: 'rgba(255, 255, 255, 0.4)',
              lineHeight: 16
            }}>
              You can update your first and last name. Username and email cannot be changed.
            </Text>
          </View>

          {/* Edit Form */}
          <View style={{ marginBottom: 32 }}>
            <AuthInput
              label="First Name"
              value={formData.firstName}
              onChangeText={(text) => updateField('firstName', text)}
              placeholder="Enter your first name"
              autoCapitalize="words"
              error={errors.firstName}
            />

            <AuthInput
              label="Last Name"
              value={formData.lastName}
              onChangeText={(text) => updateField('lastName', text)}
              placeholder="Enter your last name"
              autoCapitalize="words"
              error={errors.lastName}
            />
          </View>

          {/* Error Message */}
          {error && (
            <View style={{
              backgroundColor: 'rgba(239, 68, 68, 0.1)',
              borderWidth: 1,
              borderColor: 'rgba(239, 68, 68, 0.3)',
              borderRadius: 8,
              padding: 12,
              marginBottom: 24
            }}>
              <Text style={{
                color: '#EF4444',
                fontSize: 14,
                textAlign: 'center'
              }}>
                {error}
              </Text>
            </View>
          )}

          {/* Save Button */}
          <AuthButton
            title="Save Changes"
            onPress={handleSave}
            loading={isSaving}
            disabled={isSaving}
            variant="primary"
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}