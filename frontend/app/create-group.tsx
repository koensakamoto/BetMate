import React, { useState } from 'react';
import { Text, View, ScrollView, StatusBar, TouchableOpacity, KeyboardAvoidingView, Platform, TextInput, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { groupService } from '../services/group/groupService';
import { debugLog, errorLog } from '../config/env';

export default function CreateGroup() {
  const insets = useSafeAreaInsets();
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    privacy: 'public' // 'public' or 'private'
  });
  
  const [errors, setErrors] = useState<{[key: string]: string}>({});
  const [isCreating, setIsCreating] = useState(false);

  const updateField = (field: keyof typeof formData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
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

    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
    } else if (formData.description.trim().length < 10) {
      newErrors.description = 'Description must be at least 10 characters';
    } else if (formData.description.length > 200) {
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
        privacy: formData.privacy === 'public' ? 'PUBLIC' : 'PRIVATE'
      });
      
      debugLog('Group created successfully:', newGroup);
      
      Alert.alert(
        'Success',
        'Group created successfully!',
        [
          { 
            text: 'OK', 
            onPress: () => {
              // Navigate back to groups page and the useFocusEffect will refresh the data
              router.back();
            }
          }
        ]
      );
    } catch (err: any) {
      Alert.alert(
        'Error',
        err.message || 'Failed to create group. Please try again.',
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
                paddingVertical: 16
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
                  Only invited members can join
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
    </View>
  );
}