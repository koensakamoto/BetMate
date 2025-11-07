import React, { useState, useEffect } from 'react';
import { Text, View, ScrollView, StatusBar, TouchableOpacity, Alert, ActivityIndicator, KeyboardAvoidingView, Platform, Image } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { userService, UserProfileResponse, UserProfileUpdateRequest } from '../services/user/userService';
import AuthInput from '../components/auth/AuthInput';
import AuthButton from '../components/auth/AuthButton';
import { useAuth } from '../contexts/AuthContext';
import { debugLog, errorLog } from '../config/env';

const defaultIcon = require("../assets/images/icon.png");

export default function EditProfile() {
  const insets = useSafeAreaInsets();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [userProfile, setUserProfile] = useState<UserProfileResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    bio: ''
  });
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [errors, setErrors] = useState<{[key: string]: string}>({});

  useEffect(() => {
    if (!authLoading) {
      if (isAuthenticated) {
        loadUserProfile();
      } else {
        // User is not authenticated, redirect to login
        router.replace('/auth/login');
      }
    }
  }, [authLoading, isAuthenticated]);

  const loadUserProfile = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const profile = await userService.getCurrentUserProfile();
      console.log('=== EDIT PROFILE DEBUG ===');
      console.log('Profile loaded:', profile);
      console.log('Profile.bio:', profile.bio);
      console.log('=== END DEBUG ===');
      setUserProfile(profile);
      
      // Pre-fill form with current data
      setFormData({
        firstName: profile.firstName || '',
        lastName: profile.lastName || '',
        bio: profile.bio || ''
      });
      setProfileImage(profile.profileImageUrl || null);
      
      debugLog('User profile loaded for editing:', profile);
    } catch (err: any) {
      errorLog('Failed to load user profile:', err);
      setError(err.message || 'Failed to load profile');
    } finally {
      setIsLoading(false);
    }
  };

  const pickImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert(
          'Permission Required',
          'Sorry, we need camera roll permissions to change your profile picture.',
          [{ text: 'OK' }]
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setProfileImage(result.assets[0].uri);
      }
    } catch (error) {
      errorLog('Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image. Please try again.');
    }
  };

  const takePhoto = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert(
          'Permission Required',
          'Sorry, we need camera permissions to take a photo.',
          [{ text: 'OK' }]
        );
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setProfileImage(result.assets[0].uri);
      }
    } catch (error) {
      errorLog('Error taking photo:', error);
      Alert.alert('Error', 'Failed to take photo. Please try again.');
    }
  };

  const showImagePicker = () => {
    Alert.alert(
      'Change Profile Picture',
      'How would you like to update your profile picture?',
      [
        { text: 'Camera', onPress: takePhoto },
        { text: 'Photo Library', onPress: pickImage },
        { text: 'Cancel', style: 'cancel' }
      ]
    );
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

    if (formData.bio.length > 150) {
      newErrors.bio = 'Bio must be 150 characters or less';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    console.log('=== SAVE BUTTON CLICKED ===');
    console.log('Form validation result:', validateForm());
    
    if (!validateForm()) {
      console.log('Form validation failed, not saving');
      return;
    }

    try {
      setIsSaving(true);
      setError(null);
      
      const updateData: UserProfileUpdateRequest = {
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        bio: formData.bio.trim()
      };
      
      console.log('=== FRONTEND DEBUG START ===');
      console.log('Sending update request:', updateData);
      console.log('Current form data:', formData);
      
      const updatedProfile = await userService.updateProfile(updateData);
      console.log('Received updated profile:', updatedProfile);
      console.log('=== FRONTEND DEBUG END ===');
      debugLog('Profile updated successfully:', updatedProfile);
      
      // Update local state with the new profile data
      setUserProfile(updatedProfile);
      
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
    // Limit bio length
    if (field === 'bio' && value.length > 150) {
      return;
    }
    
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

  // Show loading while checking authentication or loading profile data
  if (authLoading || isLoading) {
    return (
      <View style={{ flex: 1, backgroundColor: '#0a0a0f', justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#00D4AA" />
        <Text style={{ color: '#ffffff', marginTop: 16, fontSize: 16 }}>
          {authLoading ? 'Checking authentication...' : 'Loading profile...'}
        </Text>
      </View>
    );
  }

  // If not authenticated, don't render anything (will redirect)
  if (!isAuthenticated) {
    return null;
  }

  console.log('=== RENDER DEBUG ===');
  console.log('formData.bio at render:', formData.bio);
  console.log('formData:', formData);
  console.log('=== END RENDER DEBUG ===');

  return (
    <View style={{ flex: 1, backgroundColor: '#0a0a0f' }}>
      <StatusBar
        barStyle="light-content"
        backgroundColor="#0a0a0f"
        translucent={true}
      />

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
            paddingTop: 20,
            paddingBottom: insets.bottom + 20,
            paddingHorizontal: 20
          }}
          showsVerticalScrollIndicator={false}
        >
          {/* Clean Header - Same as Settings */}
          <View style={{
            flexDirection: 'row',
            alignItems: 'center',
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
                alignItems: 'center',
                marginRight: 16
              }}
            >
              <MaterialIcons 
                name="arrow-back" 
                size={18} 
                color="#ffffff" 
              />
            </TouchableOpacity>
            
            <Text style={{
              fontSize: 24,
              fontWeight: '700',
              color: '#ffffff'
            }}>
              Edit Profile
            </Text>
          </View>

          {/* Profile Picture */}
          <TouchableOpacity
            onPress={showImagePicker}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              paddingVertical: 16,
              borderBottomWidth: 0.5,
              borderBottomColor: 'rgba(255, 255, 255, 0.1)',
              marginBottom: 8
            }}
          >
            <View style={{ position: 'relative', marginRight: 16 }}>
              <Image
                source={profileImage ? { uri: profileImage } : defaultIcon}
                style={{ 
                  width: 60, 
                  height: 60, 
                  borderRadius: 30,
                  backgroundColor: 'rgba(255, 255, 255, 0.05)'
                }}
                resizeMode="cover"
              />
              <View style={{
                position: 'absolute',
                bottom: -2,
                right: -2,
                width: 20,
                height: 20,
                borderRadius: 10,
                backgroundColor: '#00D4AA',
                justifyContent: 'center',
                alignItems: 'center',
                borderWidth: 2,
                borderColor: '#0a0a0f'
              }}>
                <MaterialIcons name="camera-alt" size={10} color="#000000" />
              </View>
            </View>
            
            <View style={{ flex: 1 }}>
              <Text style={{
                fontSize: 16,
                color: '#ffffff',
                marginBottom: 2
              }}>
                Profile Photo
              </Text>
              <Text style={{
                fontSize: 14,
                color: 'rgba(255, 255, 255, 0.6)'
              }}>
                Tap to change
              </Text>
            </View>
            
            <MaterialIcons 
              name="chevron-right" 
              size={20} 
              color="rgba(255, 255, 255, 0.4)" 
            />
          </TouchableOpacity>

          {/* First Name */}
          <View style={{
            paddingVertical: 8,
            borderBottomWidth: 0.5,
            borderBottomColor: 'rgba(255, 255, 255, 0.1)'
          }}>
            <Text style={{
              fontSize: 14,
              color: 'rgba(255, 255, 255, 0.6)',
              marginBottom: 4
            }}>
              First Name
            </Text>
            <AuthInput
              value={formData.firstName}
              onChangeText={(text) => updateField('firstName', text)}
              placeholder="Enter your first name"
              autoCapitalize="words"
              error={errors.firstName}
              style={{
                backgroundColor: 'transparent',
                borderWidth: 0,
                paddingHorizontal: 0,
                paddingVertical: 0,
                marginVertical: 0,
                fontSize: 16,
                color: '#ffffff',
                height: 24
              }}
            />
          </View>

          {/* Last Name */}
          <View style={{
            paddingVertical: 8,
            borderBottomWidth: 0.5,
            borderBottomColor: 'rgba(255, 255, 255, 0.1)'
          }}>
            <Text style={{
              fontSize: 14,
              color: 'rgba(255, 255, 255, 0.6)',
              marginBottom: 4
            }}>
              Last Name
            </Text>
            <AuthInput
              value={formData.lastName}
              onChangeText={(text) => updateField('lastName', text)}
              placeholder="Enter your last name"
              autoCapitalize="words"
              error={errors.lastName}
              style={{
                backgroundColor: 'transparent',
                borderWidth: 0,
                paddingHorizontal: 0,
                paddingVertical: 0,
                marginVertical: 0,
                fontSize: 16,
                color: '#ffffff',
                height: 24
              }}
            />
          </View>

          {/* Bio */}
          <View style={{
            paddingVertical: 8,
            borderBottomWidth: 0.5,
            borderBottomColor: 'rgba(255, 255, 255, 0.1)',
            marginBottom: 20
          }}>
            <View style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: 4
            }}>
              <Text style={{
                fontSize: 14,
                color: 'rgba(255, 255, 255, 0.6)'
              }}>
                Bio
              </Text>
              <Text style={{
                fontSize: 12,
                color: 'rgba(255, 255, 255, 0.4)'
              }}>
                {formData.bio.length}/150
              </Text>
            </View>
            <AuthInput
              value={formData.bio}
              onChangeText={(text) => updateField('bio', text)}
              placeholder="Edit bio"
              multiline={true}
              numberOfLines={2}
              style={{
                backgroundColor: 'transparent',
                borderWidth: 0,
                paddingHorizontal: 0,
                paddingVertical: 0,
                marginVertical: 0,
                fontSize: 16,
                color: '#ffffff',
                minHeight: 40,
                maxHeight: 60,
                textAlignVertical: 'top'
              }}
              error={errors.bio}
            />
          </View>


          {/* Error Message */}
          {error && (
            <View style={{
              backgroundColor: 'rgba(239, 68, 68, 0.1)',
              borderWidth: 0.5,
              borderColor: 'rgba(239, 68, 68, 0.3)',
              borderRadius: 16,
              padding: 16,
              marginBottom: 16
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
          <TouchableOpacity
            onPress={handleSave}
            disabled={isSaving}
            style={{
              backgroundColor: '#00D4AA',
              borderRadius: 12,
              paddingVertical: 14,
              alignItems: 'center',
              opacity: isSaving ? 0.7 : 1
            }}
          >
            {isSaving ? (
              <ActivityIndicator size="small" color="#000000" />
            ) : (
              <Text style={{
                color: '#000000',
                fontSize: 16,
                fontWeight: '600'
              }}>
                Save
              </Text>
            )}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}