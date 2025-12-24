import React, { useState } from 'react';
import { Text, View, ScrollView, StatusBar, TouchableOpacity, KeyboardAvoidingView, Platform, TextInput, Alert, Image, Linking } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { groupService } from '../../services/group/groupService';
import { debugLog, errorLog } from '../../config/env';
import { getErrorMessage } from '../../utils/errorUtils';
import { GroupCreateSuccessModal } from '../../components/group/GroupCreateSuccessModal';

const defaultIcon = require("../../assets/images/icon.png");

export default function CreateGroup() {
  const insets = useSafeAreaInsets();
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    privacy: 'public' // 'public', 'private', or 'secret'
  });

  const [groupPhoto, setGroupPhoto] = useState<string | null>(null);
  const [errors, setErrors] = useState<{[key: string]: string}>({});
  const [isCreating, setIsCreating] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  const handleSuccessModalClose = () => {
    setShowSuccessModal(false);
    router.dismissAll();
    router.navigate({
      pathname: '/(tabs)/group' as any,
      params: { refresh: Date.now().toString() }
    });
  };

  const updateField = (field: keyof typeof formData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const pickImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (status !== 'granted') {
        Alert.alert(
          'Permission Required',
          'To select a group photo, please enable photo library access in Settings.',
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
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setGroupPhoto(result.assets[0].uri);
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
          'To take a group photo, please enable camera access in Settings.',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Open Settings', onPress: () => Linking.openSettings() }
          ]
        );
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setGroupPhoto(result.assets[0].uri);
      }
    } catch (error) {
      errorLog('Error taking photo:', error);
      Alert.alert('Error', 'Failed to take photo. Please try again.');
    }
  };

  const showImagePicker = () => {
    Alert.alert(
      'Group Photo',
      'How would you like to add a group photo?',
      [
        { text: 'Camera', onPress: takePhoto },
        { text: 'Photo Library', onPress: pickImage },
        { text: 'Cancel', style: 'cancel' }
      ]
    );
  };

  const validateForm = (): boolean => {
    const newErrors: {[key: string]: string} = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Group name is required';
    } else if (formData.name.trim().length < 3) {
      newErrors.name = 'Group name must be at least 3 characters';
    } else if (formData.name.trim().length > 50) {
      newErrors.name = 'Group name must be 50 characters or less';
    }

    if (formData.description.length > 200) {
      newErrors.description = 'Description must be 200 characters or less';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleCreate = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      setIsCreating(true);

      const newGroup = await groupService.createGroup({
        groupName: formData.name.trim(),
        description: formData.description.trim(),
        privacy: formData.privacy === 'public' ? 'PUBLIC' : formData.privacy === 'private' ? 'PRIVATE' : 'SECRET'
      });

      debugLog('Group created successfully:', newGroup);

      // Upload group photo if selected
      if (groupPhoto) {
        try {
          const fileName = groupPhoto.split('/').pop() || `group_${newGroup.id}_${Date.now()}.jpg`;
          await groupService.uploadGroupPicture(newGroup.id, groupPhoto, fileName);
          debugLog('Group photo uploaded successfully');
        } catch (photoErr: any) {
          errorLog('Failed to upload group photo:', photoErr);
          // Don't fail the whole creation if photo upload fails
        }
      }

      setShowSuccessModal(true);
    } catch (err: any) {
      Alert.alert(
        'Error',
        err?.message || 'Failed to create group. Please try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setIsCreating(false);
    }
  };

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
            paddingHorizontal: 20
          }}
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
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
              Create Group
            </Text>
          </View>

          {/* Group Photo */}
          <View style={{
            alignItems: 'center',
            marginBottom: 32
          }}>
            <TouchableOpacity
              onPress={showImagePicker}
              activeOpacity={0.8}
            >
              <View style={{
                width: 100,
                height: 100,
                borderRadius: 50,
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                justifyContent: 'center',
                alignItems: 'center',
                position: 'relative',
                borderWidth: 2,
                borderColor: 'rgba(0, 212, 170, 0.3)'
              }}>
                {groupPhoto ? (
                  <Image
                    source={{ uri: groupPhoto }}
                    style={{
                      width: 100,
                      height: 100,
                      borderRadius: 50
                    }}
                  />
                ) : (
                  <MaterialIcons
                    name="groups"
                    size={40}
                    color="rgba(255, 255, 255, 0.4)"
                  />
                )}

                {/* Camera icon overlay */}
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

            <Text style={{
              fontSize: 14,
              color: 'rgba(255, 255, 255, 0.6)',
              marginTop: 12
            }}>
              Tap to add group photo
            </Text>
          </View>

          {/* Group Name */}
          <View style={{
            marginBottom: 24
          }}>
            <Text style={{
              fontSize: 16,
              color: '#ffffff',
              marginBottom: 8,
              fontWeight: '500'
            }}>
              Group Name
            </Text>
            <TextInput
              value={formData.name}
              onChangeText={(text) => updateField('name', text)}
              placeholder="Enter group name"
              placeholderTextColor="rgba(255, 255, 255, 0.4)"
              style={{
                backgroundColor: 'rgba(255, 255, 255, 0.05)',
                borderWidth: 1,
                borderColor: errors.name ? '#EF4444' : 'rgba(255, 255, 255, 0.1)',
                borderRadius: 12,
                paddingHorizontal: 16,
                paddingVertical: 14,
                fontSize: 16,
                color: '#ffffff'
              }}
              maxLength={50}
            />
            {errors.name && (
              <Text style={{
                color: '#EF4444',
                fontSize: 12,
                marginTop: 4
              }}>
                {errors.name}
              </Text>
            )}
            <Text style={{
              fontSize: 12,
              color: 'rgba(255, 255, 255, 0.4)',
              marginTop: 4,
              textAlign: 'right'
            }}>
              {formData.name.length}/50
            </Text>
          </View>

          {/* Description */}
          <View style={{
            marginBottom: 24
          }}>
            <Text style={{
              fontSize: 16,
              color: '#ffffff',
              marginBottom: 8,
              fontWeight: '500'
            }}>
              Description
            </Text>
            <TextInput
              value={formData.description}
              onChangeText={(text) => updateField('description', text)}
              placeholder="Describe your group's purpose and activities"
              placeholderTextColor="rgba(255, 255, 255, 0.4)"
              multiline={true}
              numberOfLines={4}
              textAlignVertical="top"
              style={{
                backgroundColor: 'rgba(255, 255, 255, 0.05)',
                borderWidth: 1,
                borderColor: errors.description ? '#EF4444' : 'rgba(255, 255, 255, 0.1)',
                borderRadius: 12,
                paddingHorizontal: 16,
                paddingVertical: 14,
                fontSize: 16,
                color: '#ffffff',
                minHeight: 100
              }}
              maxLength={200}
            />
            {errors.description && (
              <Text style={{
                color: '#EF4444',
                fontSize: 12,
                marginTop: 4
              }}>
                {errors.description}
              </Text>
            )}
            <Text style={{
              fontSize: 12,
              color: 'rgba(255, 255, 255, 0.4)',
              marginTop: 4,
              textAlign: 'right'
            }}>
              {formData.description.length}/200
            </Text>
          </View>

          {/* Privacy Settings */}
          <View style={{
            marginBottom: 32
          }}>
            <Text style={{
              fontSize: 16,
              color: '#ffffff',
              marginBottom: 12,
              fontWeight: '500'
            }}>
              Privacy
            </Text>
            
            {/* Public Option */}
            <TouchableOpacity
              onPress={() => updateField('privacy', 'public')}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                backgroundColor: 'rgba(255, 255, 255, 0.05)',
                borderWidth: 1,
                borderColor: formData.privacy === 'public' ? '#00D4AA' : 'rgba(255, 255, 255, 0.1)',
                borderRadius: 12,
                paddingHorizontal: 16,
                paddingVertical: 16,
                marginBottom: 12
              }}
            >
              <View style={{
                width: 20,
                height: 20,
                borderRadius: 10,
                borderWidth: 2,
                borderColor: formData.privacy === 'public' ? '#00D4AA' : 'rgba(255, 255, 255, 0.3)',
                backgroundColor: formData.privacy === 'public' ? '#00D4AA' : 'transparent',
                marginRight: 12,
                justifyContent: 'center',
                alignItems: 'center'
              }}>
                {formData.privacy === 'public' && (
                  <View style={{
                    width: 8,
                    height: 8,
                    borderRadius: 4,
                    backgroundColor: '#000000'
                  }} />
                )}
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{
                  fontSize: 16,
                  color: '#ffffff',
                  marginBottom: 2
                }}>
                  Public Group
                </Text>
                <Text style={{
                  fontSize: 12,
                  color: 'rgba(255, 255, 255, 0.6)'
                }}>
                  Anyone can discover and join this group
                </Text>
              </View>
            </TouchableOpacity>

            {/* Private Option */}
            <TouchableOpacity
              onPress={() => updateField('privacy', 'private')}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                backgroundColor: 'rgba(255, 255, 255, 0.05)',
                borderWidth: 1,
                borderColor: formData.privacy === 'private' ? '#00D4AA' : 'rgba(255, 255, 255, 0.1)',
                borderRadius: 12,
                paddingHorizontal: 16,
                paddingVertical: 16,
                marginBottom: 12
              }}
            >
              <View style={{
                width: 20,
                height: 20,
                borderRadius: 10,
                borderWidth: 2,
                borderColor: formData.privacy === 'private' ? '#00D4AA' : 'rgba(255, 255, 255, 0.3)',
                backgroundColor: formData.privacy === 'private' ? '#00D4AA' : 'transparent',
                marginRight: 12,
                justifyContent: 'center',
                alignItems: 'center'
              }}>
                {formData.privacy === 'private' && (
                  <View style={{
                    width: 8,
                    height: 8,
                    borderRadius: 4,
                    backgroundColor: '#000000'
                  }} />
                )}
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{
                  fontSize: 16,
                  color: '#ffffff',
                  marginBottom: 2
                }}>
                  Private Group
                </Text>
                <Text style={{
                  fontSize: 12,
                  color: 'rgba(255, 255, 255, 0.6)'
                }}>
                  Visible in search, requires approval to join
                </Text>
              </View>
            </TouchableOpacity>

            {/* Invite Only Option */}
            <TouchableOpacity
              onPress={() => updateField('privacy', 'secret')}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                backgroundColor: 'rgba(255, 255, 255, 0.05)',
                borderWidth: 1,
                borderColor: formData.privacy === 'secret' ? '#00D4AA' : 'rgba(255, 255, 255, 0.1)',
                borderRadius: 12,
                paddingHorizontal: 16,
                paddingVertical: 16
              }}
            >
              <View style={{
                width: 20,
                height: 20,
                borderRadius: 10,
                borderWidth: 2,
                borderColor: formData.privacy === 'secret' ? '#00D4AA' : 'rgba(255, 255, 255, 0.3)',
                backgroundColor: formData.privacy === 'secret' ? '#00D4AA' : 'transparent',
                marginRight: 12,
                justifyContent: 'center',
                alignItems: 'center'
              }}>
                {formData.privacy === 'secret' && (
                  <View style={{
                    width: 8,
                    height: 8,
                    borderRadius: 4,
                    backgroundColor: '#000000'
                  }} />
                )}
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{
                  fontSize: 16,
                  color: '#ffffff',
                  marginBottom: 2
                }}>
                  Invite Only
                </Text>
                <Text style={{
                  fontSize: 12,
                  color: 'rgba(255, 255, 255, 0.6)'
                }}>
                  Hidden from discovery, invite only
                </Text>
              </View>
            </TouchableOpacity>
          </View>

          {/* Create Button */}
          <TouchableOpacity
            onPress={handleCreate}
            disabled={isCreating}
            style={{
              backgroundColor: '#00D4AA',
              borderRadius: 12,
              paddingVertical: 14,
              alignItems: 'center',
              opacity: isCreating ? 0.7 : 1
            }}
          >
            <Text style={{
              color: '#000000',
              fontSize: 16,
              fontWeight: '600'
            }}>
              {isCreating ? 'Creating...' : 'Create Group'}
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>

      <GroupCreateSuccessModal
        visible={showSuccessModal}
        onClose={handleSuccessModalClose}
        groupName={formData.name}
      />
    </View>
  );
}