import React, { useState, useEffect } from 'react';
import { Text, View, StatusBar, TouchableOpacity, TextInput, Alert, Image, ActivityIndicator, Linking } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { userService, UserProfileResponse, UserProfileUpdateRequest } from '../../../services/user/userService';
import { useAuth } from '../../../contexts/AuthContext';
import { debugLog, errorLog, ENV } from '../../../config/env';
import { getErrorMessage } from '../../../utils/errorUtils';

const defaultIcon = require("../../../assets/images/icon.png");

// Helper function to get full image URL
const getFullImageUrl = (imageUrl: string | null | undefined): string | null => {
  if (!imageUrl) return null;
  // If it's already a full URL, return as-is
  if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
    return imageUrl;
  }
  // If it's a relative URL, prepend the base URL
  return `${ENV.API_BASE_URL}${imageUrl}`;
};

export default function ProfileSettings() {
  const insets = useSafeAreaInsets();
  const { isAuthenticated, isLoading: authLoading } = useAuth();

  // Form state
  const [userProfile, setUserProfile] = useState<UserProfileResponse | null>(null);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading) {
      if (isAuthenticated) {
        loadUserProfile();
      } else {
        router.replace('/auth/login');
      }
    }
  }, [authLoading, isAuthenticated]);

  const loadUserProfile = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const profile = await userService.getCurrentUserProfile();

      setUserProfile(profile);

      // Pre-fill form with current data
      setFirstName(profile.firstName || '');
      setLastName(profile.lastName || '');
      setUsername(profile.username || '');
      setEmail(profile.email || '');
      setProfileImage(profile.profileImageUrl || null);

      debugLog('User profile loaded:', profile);
    } catch (err) {
      errorLog('Failed to load user profile:', err);
      setError(getErrorMessage(err));
      Alert.alert('Error', 'Failed to load profile. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    // Validation
    if (!firstName.trim() || !lastName.trim()) {
      Alert.alert('Error', 'First name and last name are required');
      return;
    }

    const profileChanged =
      firstName.trim() !== userProfile?.firstName ||
      lastName.trim() !== userProfile?.lastName;

    // Check if anything actually changed
    if (!profileChanged) {
      Alert.alert('No Changes', 'No changes were made to your profile.');
      return;
    }

    try {
      setIsSaving(true);
      setError(null);

      const updateData: UserProfileUpdateRequest = {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
      };

      debugLog('Updating profile with data:', updateData);

      const updatedProfile = await userService.updateProfile(updateData);
      setUserProfile(updatedProfile);

      // Update form fields with the returned data
      setFirstName(updatedProfile.firstName || '');
      setLastName(updatedProfile.lastName || '');

      debugLog('Profile updated successfully:', updatedProfile);

      Alert.alert(
        'Success',
        'Profile updated successfully',
        [{ text: 'OK', onPress: () => router.back() }]
      );
    } catch (err) {
      errorLog('Failed to update profile:', err);
      const message = getErrorMessage(err);
      setError(message);
      Alert.alert('Error', message);
    } finally {
      setIsSaving(false);
    }
  };

  const handlePhotoEdit = () => {
    Alert.alert(
      'Change Profile Photo',
      'Choose an option',
      [
        { text: 'Take Photo', onPress: handleTakePhoto },
        { text: 'Choose from Library', onPress: handleChooseFromLibrary },
        { text: 'Cancel', style: 'cancel' }
      ]
    );
  };

  const handleTakePhoto = async () => {
    try {
      // Request camera permissions
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Permission Required',
          'To take a profile picture, please enable camera access in Settings.',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Open Settings', onPress: () => Linking.openSettings() }
          ]
        );
        return;
      }

      // Launch camera
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        await uploadImage(result.assets[0].uri);
      }
    } catch (err) {
      errorLog('Error taking photo:', err);
      Alert.alert('Error', 'Failed to take photo. Please try again.');
    }
  };

  const handleChooseFromLibrary = async () => {
    try {
      // Request media library permissions
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Permission Required',
          'To select a profile picture, please enable photo library access in Settings.',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Open Settings', onPress: () => Linking.openSettings() }
          ]
        );
        return;
      }

      // Launch image picker
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        await uploadImage(result.assets[0].uri);
      }
    } catch (err) {
      errorLog('Error choosing photo:', err);
      Alert.alert('Error', 'Failed to choose photo. Please try again.');
    }
  };

  const uploadImage = async (uri: string) => {
    try {
      setIsSaving(true);

      // Extract filename from URI
      const fileName = uri.split('/').pop() || `profile_${Date.now()}.jpg`;

      // Upload the image
      const updatedProfile = await userService.uploadProfilePicture(uri, fileName);

      // Update local state
      setUserProfile(updatedProfile);
      setProfileImage(updatedProfile.profileImageUrl || null);

      Alert.alert('Success', 'Profile picture updated successfully');
    } catch (err) {
      errorLog('Failed to upload profile picture:', err);
      Alert.alert('Error', getErrorMessage(err));
    } finally {
      setIsSaving(false);
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

      <KeyboardAwareScrollView
        style={{ flex: 1, backgroundColor: '#0a0a0f', marginTop: insets.top }}
        contentContainerStyle={{
          paddingTop: 16,
          paddingBottom: insets.bottom + 40,
          paddingHorizontal: 24
        }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        extraScrollHeight={20}
        enableOnAndroid={true}
      >
        {/* Header */}
        <View style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 32,
          paddingVertical: 8
        }}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
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
              <MaterialIcons 
                name="arrow-back" 
                size={20} 
                color="rgba(255, 255, 255, 0.9)" 
              />
            </TouchableOpacity>
            
            <View>
              <Text style={{
                fontSize: 24,
                fontWeight: '700',
                color: '#ffffff'
              }}>
                Edit Profile
              </Text>
              <Text style={{
                fontSize: 14,
                color: 'rgba(255, 255, 255, 0.5)',
                marginTop: 2
              }}>
                Update your information
              </Text>
            </View>
          </View>

          <TouchableOpacity
            onPress={handleSave}
            disabled={isSaving}
            style={{
              backgroundColor: '#00D4AA',
              paddingHorizontal: 20,
              paddingVertical: 10,
              borderRadius: 20,
              opacity: isSaving ? 0.6 : 1
            }}
            activeOpacity={0.8}
          >
            <Text style={{
              fontSize: 14,
              fontWeight: '600',
              color: '#ffffff'
            }}>
              {isSaving ? 'Saving...' : 'Save'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Profile Photo Section */}
        <View style={{
          alignItems: 'center',
          marginBottom: 32
        }}>
          <TouchableOpacity
            onPress={handlePhotoEdit}
            activeOpacity={0.8}
          >
            <View style={{
              width: 100,
              height: 100,
              borderRadius: 50,
              backgroundColor: 'rgba(255, 255, 255, 0.1)',
              justifyContent: 'center',
              alignItems: 'center',
              position: 'relative'
            }}>
              {getFullImageUrl(profileImage) ? (
                <View style={{
                  width: 100,
                  height: 100,
                  borderRadius: 50,
                  overflow: 'hidden',
                  position: 'absolute'
                }}>
                  <Image
                    source={{ uri: getFullImageUrl(profileImage)! }}
                    style={{
                      width: 100,
                      height: 100
                    }}
                    defaultSource={defaultIcon}
                  />
                </View>
              ) : (
                <Text style={{
                  fontSize: 32,
                  fontWeight: '700',
                  color: 'rgba(255, 255, 255, 0.8)'
                }}>
                  {firstName.charAt(0).toUpperCase()}{lastName.charAt(0).toUpperCase()}
                </Text>
              )}

              {/* Edit overlay */}
              <View style={{
                position: 'absolute',
                bottom: -2,
                right: -2,
                width: 32,
                height: 32,
                borderRadius: 16,
                backgroundColor: '#00D4AA',
                justifyContent: 'center',
                alignItems: 'center',
                borderWidth: 2,
                borderColor: '#0a0a0f'
              }}>
                <MaterialIcons 
                  name="camera-alt" 
                  size={14} 
                  color="#ffffff" 
                />
              </View>
            </View>
          </TouchableOpacity>
        </View>

        {/* Form Fields */}
        <View style={{ gap: 20 }}>
          <View style={{
            flexDirection: 'row',
            gap: 12
          }}>
            <View style={{ flex: 1 }}>
              <Text style={{
                fontSize: 14,
                fontWeight: '500',
                color: 'rgba(255, 255, 255, 0.7)',
                marginBottom: 8
              }}>
                First Name
              </Text>
              <View style={{
                backgroundColor: 'rgba(255, 255, 255, 0.03)',
                borderRadius: 8,
                borderWidth: 1,
                borderColor: 'rgba(255, 255, 255, 0.08)',
                paddingHorizontal: 16,
                paddingVertical: 12
              }}>
                <TextInput
                  value={firstName}
                  onChangeText={setFirstName}
                  placeholder="First name"
                  placeholderTextColor="rgba(255, 255, 255, 0.4)"
                  style={{
                    fontSize: 16,
                    color: '#ffffff'
                  }}
                />
              </View>
            </View>
            
            <View style={{ flex: 1 }}>
              <Text style={{
                fontSize: 14,
                fontWeight: '500',
                color: 'rgba(255, 255, 255, 0.7)',
                marginBottom: 8
              }}>
                Last Name
              </Text>
              <View style={{
                backgroundColor: 'rgba(255, 255, 255, 0.03)',
                borderRadius: 8,
                borderWidth: 1,
                borderColor: 'rgba(255, 255, 255, 0.08)',
                paddingHorizontal: 16,
                paddingVertical: 12
              }}>
                <TextInput
                  value={lastName}
                  onChangeText={setLastName}
                  placeholder="Last name"
                  placeholderTextColor="rgba(255, 255, 255, 0.4)"
                  style={{
                    fontSize: 16,
                    color: '#ffffff'
                  }}
                />
              </View>
            </View>
          </View>

          {/* Username - Tappable to change */}
          <TouchableOpacity
            onPress={() => router.push('/(app)/settings/change-username')}
            activeOpacity={0.7}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
              <Text style={{
                fontSize: 14,
                fontWeight: '500',
                color: 'rgba(255, 255, 255, 0.7)'
              }}>
                Username
              </Text>
            </View>
            <View style={{
              backgroundColor: 'rgba(255, 255, 255, 0.03)',
              borderRadius: 8,
              borderWidth: 1,
              borderColor: 'rgba(255, 255, 255, 0.08)',
              paddingHorizontal: 16,
              paddingVertical: 12,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <Text style={{
                fontSize: 16,
                color: '#ffffff'
              }}>
                @{username}
              </Text>
              <MaterialIcons
                name="chevron-right"
                size={20}
                color="rgba(255, 255, 255, 0.4)"
              />
            </View>
          </TouchableOpacity>

          {/* Email - Tappable to change */}
          <TouchableOpacity
            onPress={() => router.push('/(app)/settings/change-email')}
            activeOpacity={0.7}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
              <Text style={{
                fontSize: 14,
                fontWeight: '500',
                color: 'rgba(255, 255, 255, 0.7)'
              }}>
                Email
              </Text>
            </View>
            <View style={{
              backgroundColor: 'rgba(255, 255, 255, 0.03)',
              borderRadius: 8,
              borderWidth: 1,
              borderColor: 'rgba(255, 255, 255, 0.08)',
              paddingHorizontal: 16,
              paddingVertical: 12,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <Text style={{
                fontSize: 16,
                color: '#ffffff'
              }}>
                {email}
              </Text>
              <MaterialIcons
                name="chevron-right"
                size={20}
                color="rgba(255, 255, 255, 0.4)"
              />
            </View>
          </TouchableOpacity>
        </View>

      </KeyboardAwareScrollView>
    </View>
  );
}