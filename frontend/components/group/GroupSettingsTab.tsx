import React, { useState, useCallback, useEffect } from 'react';
import { Text, View, TouchableOpacity, Switch, Alert, TextInput, Modal, Image, Keyboard, TouchableWithoutFeedback, ScrollView } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { MaterialIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { groupService } from '../../services/group/groupService';

interface GroupSettingsTabProps {
  groupData: {
    id: number;
    name: string;
    description: string;
    memberCount: number;
    privacy?: 'PUBLIC' | 'PRIVATE' | 'INVITE_ONLY';
    autoApproveMembers?: boolean;
  };
  onGroupUpdated?: (updatedGroup: any) => void;
}

// Shared SettingItem component
const SettingItem = React.memo(({
  title,
  description,
  onPress,
  showSwitch = false,
  switchValue = false,
  onSwitchChange,
  switchDisabled = false,
  materialIcon,
  iconColor = 'rgba(255, 255, 255, 0.8)'
}: {
  title: string;
  description: string;
  onPress?: () => void;
  showSwitch?: boolean;
  switchValue?: boolean;
  onSwitchChange?: (value: boolean) => void;
  switchDisabled?: boolean;
  materialIcon?: string;
  iconColor?: string;
}) => (
  <TouchableOpacity
    onPress={onPress}
    disabled={showSwitch}
    style={{
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: 12,
      borderBottomWidth: 0.5,
      borderBottomColor: 'rgba(255, 255, 255, 0.1)',
      marginBottom: 8
    }}
  >
    <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
      {materialIcon && (
        <View style={{
          width: 24,
          height: 24,
          justifyContent: 'center',
          alignItems: 'center',
          marginRight: 12
        }}>
          <MaterialIcons
            name={materialIcon as any}
            size={18}
            color={iconColor}
          />
        </View>
      )}
      <View style={{ flex: 1 }}>
        <Text style={{
          fontSize: 15,
          color: '#ffffff',
          marginBottom: 2
        }}>
          {title}
        </Text>
        <Text style={{
          fontSize: 13,
          color: 'rgba(255, 255, 255, 0.6)'
        }}>
          {description}
        </Text>
      </View>
    </View>

    {showSwitch ? (
      <Switch
        value={switchValue}
        onValueChange={onSwitchChange}
        disabled={switchDisabled}
        trackColor={{ false: 'rgba(255, 255, 255, 0.2)', true: '#00D4AA' }}
        thumbColor={switchValue ? '#ffffff' : '#ffffff'}
        ios_backgroundColor="rgba(255, 255, 255, 0.2)"
      />
    ) : (
      <MaterialIcons
        name="chevron-right"
        size={20}
        color="rgba(255, 255, 255, 0.4)"
      />
    )}
  </TouchableOpacity>
));

// Button Group Component for binary choices
const ButtonGroup = React.memo(({
  title,
  description,
  leftLabel,
  rightLabel,
  leftSelected,
  onLeftPress,
  onRightPress,
  disabled = false,
  materialIcon
}: {
  title: string;
  description?: string;
  leftLabel: string;
  rightLabel: string;
  leftSelected: boolean;
  onLeftPress: () => void;
  onRightPress: () => void;
  disabled?: boolean;
  materialIcon?: string;
}) => (
  <View style={{
    paddingVertical: 12,
    borderBottomWidth: 0.5,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
    marginBottom: 8
  }}>
    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
      {materialIcon && (
        <View style={{
          width: 24,
          height: 24,
          justifyContent: 'center',
          alignItems: 'center',
          marginRight: 12
        }}>
          <MaterialIcons
            name={materialIcon as any}
            size={18}
            color="rgba(255, 255, 255, 0.8)"
          />
        </View>
      )}
      <Text style={{
        fontSize: 15,
        color: '#ffffff',
        fontWeight: '500'
      }}>
        {title}
      </Text>
    </View>

    {description && (
      <Text style={{
        fontSize: 13,
        color: 'rgba(255, 255, 255, 0.6)',
        marginBottom: 12,
        marginLeft: materialIcon ? 36 : 0
      }}>
        {description}
      </Text>
    )}

    <View style={{
      flexDirection: 'row',
      gap: 8,
      marginLeft: materialIcon ? 36 : 0
    }}>
      <TouchableOpacity
        onPress={onLeftPress}
        disabled={disabled}
        style={{
          flex: 1,
          backgroundColor: leftSelected ? '#00D4AA' : 'rgba(255, 255, 255, 0.1)',
          borderRadius: 8,
          paddingVertical: 10,
          alignItems: 'center',
          opacity: disabled ? 0.5 : 1
        }}
      >
        <Text style={{
          color: '#ffffff',
          fontSize: 14,
          fontWeight: leftSelected ? '600' : '500'
        }}>
          {leftLabel}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        onPress={onRightPress}
        disabled={disabled}
        style={{
          flex: 1,
          backgroundColor: !leftSelected ? '#00D4AA' : 'rgba(255, 255, 255, 0.1)',
          borderRadius: 8,
          paddingVertical: 10,
          alignItems: 'center',
          opacity: disabled ? 0.5 : 1
        }}
      >
        <Text style={{
          color: '#ffffff',
          fontSize: 14,
          fontWeight: !leftSelected ? '600' : '500'
        }}>
          {rightLabel}
        </Text>
      </TouchableOpacity>
    </View>
  </View>
));

const GroupSettingsTab: React.FC<GroupSettingsTabProps> = ({ groupData, onGroupUpdated }) => {
  const [showEditNameModal, setShowEditNameModal] = useState(false);
  const [newGroupName, setNewGroupName] = useState(groupData.name);
  const [showEditDescriptionModal, setShowEditDescriptionModal] = useState(false);
  const [newGroupDescription, setNewGroupDescription] = useState(groupData.description);
  const [showEditPhotoModal, setShowEditPhotoModal] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);

  // Modal states for privacy settings
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);
  const [showAutoApproveModal, setShowAutoApproveModal] = useState(false);
  const [tempPrivacy, setTempPrivacy] = useState<'PUBLIC' | 'PRIVATE'>('PRIVATE');
  const [tempAutoApprove, setTempAutoApprove] = useState(false);

  const [isUpdating, setIsUpdating] = useState(false);

  // Modal handlers
  const handleOpenPrivacyModal = () => {
    setTempPrivacy(groupData.privacy || 'PRIVATE');
    setShowPrivacyModal(true);
  };

  const handleOpenAutoApproveModal = () => {
    setTempAutoApprove(groupData.autoApproveMembers ?? false);
    setShowAutoApproveModal(true);
  };

  const handleSavePrivacy = async () => {
    if (isUpdating || tempPrivacy === groupData.privacy) {
      setShowPrivacyModal(false);
      return;
    }

    setIsUpdating(true);

    try {
      const updatePayload: any = { privacy: tempPrivacy };

      // If switching to PRIVATE and auto-approve is ON, turn it OFF
      if (tempPrivacy === 'PRIVATE' && groupData.autoApproveMembers) {
        updatePayload.autoApproveMembers = false;
      }

      const updatedGroup = await groupService.updateGroup(groupData.id, updatePayload);

      if (onGroupUpdated) {
        onGroupUpdated(updatedGroup);
      }

      setShowPrivacyModal(false);
    } catch (error) {
      console.error('Failed to update privacy:', error);
      Alert.alert('Error', 'Failed to update privacy settings. Please try again.');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleSaveAutoApprove = async () => {
    if (isUpdating || tempAutoApprove === groupData.autoApproveMembers) {
      setShowAutoApproveModal(false);
      return;
    }

    setIsUpdating(true);

    try {
      const updatedGroup = await groupService.updateGroup(groupData.id, {
        autoApproveMembers: tempAutoApprove
      });

      if (onGroupUpdated) {
        onGroupUpdated(updatedGroup);
      }

      setShowAutoApproveModal(false);
    } catch (error) {
      console.error('Failed to update auto-approve:', error);
      Alert.alert('Error', 'Failed to update auto-approve setting. Please try again.');
    } finally {
      setIsUpdating(false);
    }
  };

  const SettingSection = React.memo(({ title, children }: { title: string; children: React.ReactNode }) => (
    <View style={{
      backgroundColor: 'rgba(255, 255, 255, 0.03)',
      borderRadius: 16,
      padding: 20,
      marginBottom: 16,
      borderWidth: 0.5,
      borderColor: 'rgba(255, 255, 255, 0.08)'
    }}>
      <Text style={{
        fontSize: 16,
        fontWeight: '600',
        color: '#ffffff',
        marginBottom: 16
      }}>
        {title}
      </Text>
      {children}
    </View>
  ));

  const handleEditGroupName = () => {
    setNewGroupName(groupData.name);
    setShowEditNameModal(true);
  };

  const handleEditGroupDescription = () => {
    setNewGroupDescription(groupData.description);
    setShowEditDescriptionModal(true);
  };

  const handleEditGroupPhoto = () => {
    setShowEditPhotoModal(true);
  };

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Sorry, we need camera roll permissions to change your group photo.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled) {
      setSelectedPhoto(result.assets[0].uri);
    }
  };

  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Sorry, we need camera permissions to take a photo.');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled) {
      setSelectedPhoto(result.assets[0].uri);
    }
  };

  const handleSaveGroupPhoto = async () => {
    if (!selectedPhoto) {
      setShowEditPhotoModal(false);
      return;
    }

    setIsUpdating(true);
    try {
      // For now, we'll just simulate the photo upload
      // In a real app, you'd upload the photo to your server first
      
      Alert.alert('Success', 'Group photo will be updated when backend photo upload is implemented!');
      
      setShowEditPhotoModal(false);
      setSelectedPhoto(null);
    } catch (error) {
      console.error('Failed to update group photo:', error);
      Alert.alert('Error', 'Failed to update group photo. Please try again.');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleSaveGroupName = async () => {
    Keyboard.dismiss();

    if (!newGroupName.trim() || newGroupName.trim() === groupData.name) {
      setShowEditNameModal(false);
      return;
    }

    setIsUpdating(true);
    try {
      const updatedGroup = await groupService.updateGroup(groupData.id, {
        groupName: newGroupName.trim()
      });
      
      // Call the callback to update parent component
      if (onGroupUpdated) {
        onGroupUpdated(updatedGroup);
      }
      
      setShowEditNameModal(false);
      Alert.alert('Success', 'Group name updated successfully!');
    } catch (error) {
      console.error('Failed to update group name:', error);
      
      // Provide more specific error messages based on error type
      let errorMessage = 'Failed to update group name. Please try again.';
      
      if (error && typeof error === 'object' && 'statusCode' in error) {
        const apiError = error as { statusCode: number; message: string };
        switch (apiError.statusCode) {
          case 401:
            errorMessage = 'Please log in again to update the group name.';
            break;
          case 403:
            errorMessage = 'You do not have permission to update this group name.';
            break;
          case 400:
            errorMessage = apiError.message || 'Invalid group name. Please check your input.';
            break;
          case 404:
            errorMessage = 'Group not found. Please refresh and try again.';
            break;
          case 500:
            errorMessage = 'Server error. Please try again later.';
            break;
        }
      }
      
      Alert.alert('Error', errorMessage);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleSaveGroupDescription = async () => {
    Keyboard.dismiss();

    if (newGroupDescription.trim() === groupData.description) {
      setShowEditDescriptionModal(false);
      return;
    }

    setIsUpdating(true);
    try {
      const updatedGroup = await groupService.updateGroup(groupData.id, {
        description: newGroupDescription.trim()
      });
      
      // Call the callback to update parent component
      if (onGroupUpdated) {
        onGroupUpdated(updatedGroup);
      }
      
      setShowEditDescriptionModal(false);
      Alert.alert('Success', 'Group description updated successfully!');
    } catch (error) {
      console.error('Failed to update group description:', error);
      
      // Provide more specific error messages based on error type
      let errorMessage = 'Failed to update group description. Please try again.';
      
      if (error && typeof error === 'object' && 'statusCode' in error) {
        const apiError = error as { statusCode: number; message: string };
        switch (apiError.statusCode) {
          case 401:
            errorMessage = 'Please log in again to update the group description.';
            break;
          case 403:
            errorMessage = 'You do not have permission to update this group description.';
            break;
          case 400:
            errorMessage = apiError.message || 'Invalid group description. Please check your input.';
            break;
          case 404:
            errorMessage = 'Group not found. Please refresh and try again.';
            break;
          case 500:
            errorMessage = 'Server error. Please try again later.';
            break;
        }
      }
      
      Alert.alert('Error', errorMessage);
    } finally {
      setIsUpdating(false);
    }
  };


  const handleDeleteGroup = () => {
    Alert.alert(
      'Delete Group',
      'Are you sure you want to permanently delete this group? This action cannot be undone.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            // Handle group deletion
          },
        },
      ]
    );
  };

  return (
    <View>
      {/* Group Information */}
      <SettingSection title="Group Information">
        <SettingItem
          materialIcon="edit"
          title="Group Name"
          description={groupData.name}
          onPress={handleEditGroupName}
        />
        <SettingItem
          materialIcon="description"
          title="Description"
          description={groupData.description}
          onPress={handleEditGroupDescription}
        />
        <SettingItem
          materialIcon="photo-camera"
          title="Group Photo"
          description="Change group profile picture"
          onPress={handleEditGroupPhoto}
        />
      </SettingSection>

      {/* Privacy & Access */}
      <SettingSection title="Privacy & Access">
        <SettingItem
          materialIcon="public"
          title="Privacy"
          description={groupData.privacy === 'PUBLIC' ? 'Public' : 'Private'}
          onPress={handleOpenPrivacyModal}
        />
        <SettingItem
          materialIcon="how-to-reg"
          title="Auto-approve Members"
          description={
            groupData.privacy === 'PRIVATE'
              ? "Private groups require manual approval"
              : (groupData.autoApproveMembers ? 'On' : 'Off')
          }
          onPress={handleOpenAutoApproveModal}
          iconColor={
            groupData.privacy === 'PRIVATE'
              ? 'rgba(255, 255, 255, 0.4)'
              : 'rgba(255, 255, 255, 0.8)'
          }
        />
      </SettingSection>

      {/* Member Management */}
      <SettingSection title="Member Management">
        <SettingItem
          materialIcon="person-add"
          title="Pending Requests"
          description="Review join requests"
          onPress={() => {}}
        />
      </SettingSection>


      {/* Danger Zone */}
      <TouchableOpacity 
        onPress={handleDeleteGroup}
        style={{
          backgroundColor: 'rgba(255, 255, 255, 0.03)',
          borderRadius: 16,
          padding: 16,
          marginBottom: 16,
          borderWidth: 0.5,
          borderColor: 'rgba(239, 68, 68, 0.2)',
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <View style={{
            width: 24,
            height: 24,
            justifyContent: 'center',
            alignItems: 'center',
            marginRight: 12
          }}>
            <MaterialIcons 
              name="delete-forever" 
              size={18} 
              color="#EF4444" 
            />
          </View>
          <View>
            <Text style={{
              fontSize: 15,
              fontWeight: '500',
              color: '#EF4444',
              marginBottom: 2
            }}>
              Delete Group
            </Text>
            <Text style={{
              fontSize: 13,
              color: 'rgba(239, 68, 68, 0.7)'
            }}>
              Permanently delete this group
            </Text>
          </View>
        </View>
        <MaterialIcons 
          name="chevron-right" 
          size={20} 
          color="rgba(239, 68, 68, 0.6)" 
        />
      </TouchableOpacity>

      {/* Edit Group Name Modal */}
      <Modal
        visible={showEditNameModal}
        transparent={true}
        animationType="none"
        onRequestClose={() => {
          Keyboard.dismiss();
          setShowEditNameModal(false);
        }}
      >
        <TouchableWithoutFeedback onPress={() => {
          Keyboard.dismiss();
          setShowEditNameModal(false);
        }}>
        <View style={{
          flex: 1,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          justifyContent: 'flex-start',
          paddingHorizontal: 20,
          paddingTop: 300
        }}>
          <TouchableWithoutFeedback onPress={(e) => e.stopPropagation()}>
          <ScrollView
            keyboardShouldPersistTaps="handled"
            scrollEnabled={false}
            contentContainerStyle={{ flexGrow: 0 }}
          >
          <View style={{
            backgroundColor: '#1a1a1f',
            borderRadius: 12,
            padding: 20,
            marginHorizontal: 20
          }}>
            <Text style={{
              fontSize: 18,
              fontWeight: '600',
              color: '#ffffff',
              marginBottom: 20
            }}>
              Edit Group Name
            </Text>
            
            <TextInput
              value={newGroupName}
              onChangeText={setNewGroupName}
              placeholder="Group name"
              placeholderTextColor="rgba(255, 255, 255, 0.4)"
              style={{
                backgroundColor: 'rgba(255, 255, 255, 0.05)',
                borderRadius: 8,
                paddingHorizontal: 16,
                paddingVertical: 12,
                fontSize: 16,
                color: '#ffffff',
                marginBottom: 20
              }}
              maxLength={50}
              editable={!isUpdating}
              returnKeyType="done"
              onSubmitEditing={handleSaveGroupName}
            />
            
            <View style={{
              flexDirection: 'row',
              gap: 12
            }}>
              <TouchableOpacity
                onPress={() => {
                  Keyboard.dismiss();
                  setShowEditNameModal(false);
                }}
                disabled={isUpdating}
                style={{
                  flex: 1,
                  backgroundColor: 'rgba(255, 255, 255, 0.1)',
                  borderRadius: 8,
                  paddingVertical: 12,
                  alignItems: 'center',
                  opacity: isUpdating ? 0.5 : 1
                }}
              >
                <Text style={{
                  color: '#ffffff',
                  fontSize: 16,
                  fontWeight: '500'
                }}>
                  Cancel
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                onPress={handleSaveGroupName}
                disabled={isUpdating || !newGroupName.trim() || newGroupName.trim() === groupData.name}
                style={{
                  flex: 1,
                  backgroundColor: (!newGroupName.trim() || newGroupName.trim() === groupData.name) ? 'rgba(255, 255, 255, 0.1)' : '#00D4AA',
                  borderRadius: 8,
                  paddingVertical: 12,
                  alignItems: 'center',
                  opacity: isUpdating ? 0.5 : 1
                }}
              >
                <Text style={{
                  color: '#ffffff',
                  fontSize: 16,
                  fontWeight: '500'
                }}>
                  {isUpdating ? 'Saving...' : 'Save'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
          </ScrollView>
          </TouchableWithoutFeedback>
        </View>
        </TouchableWithoutFeedback>
      </Modal>

      {/* Edit Group Description Modal */}
      <Modal
        visible={showEditDescriptionModal}
        transparent={true}
        animationType="none"
        onRequestClose={() => {
          Keyboard.dismiss();
          setShowEditDescriptionModal(false);
        }}
      >
        <TouchableWithoutFeedback onPress={() => {
          Keyboard.dismiss();
          setShowEditDescriptionModal(false);
        }}>
        <View style={{
          flex: 1,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          justifyContent: 'flex-start',
          paddingHorizontal: 20,
          paddingTop: 250
        }}>
          <TouchableWithoutFeedback onPress={(e) => e.stopPropagation()}>
          <ScrollView
            keyboardShouldPersistTaps="handled"
            scrollEnabled={false}
            contentContainerStyle={{ flexGrow: 0 }}
          >
          <View style={{
            backgroundColor: '#1a1a1f',
            borderRadius: 12,
            padding: 20,
            marginHorizontal: 20
          }}>
            <Text style={{
              fontSize: 18,
              fontWeight: '600',
              color: '#ffffff',
              marginBottom: 20
            }}>
              Edit Group Description
            </Text>
            
            <TextInput
              value={newGroupDescription}
              onChangeText={setNewGroupDescription}
              placeholder="Describe your group..."
              placeholderTextColor="rgba(255, 255, 255, 0.4)"
              style={{
                backgroundColor: 'rgba(255, 255, 255, 0.05)',
                borderRadius: 8,
                paddingHorizontal: 16,
                paddingVertical: 12,
                fontSize: 16,
                color: '#ffffff',
                height: 100,
                textAlignVertical: 'top',
                marginBottom: 20
              }}
              maxLength={200}
              editable={!isUpdating}
              multiline={true}
              numberOfLines={4}
            />
            
            <View style={{
              flexDirection: 'row',
              gap: 12
            }}>
              <TouchableOpacity
                onPress={() => {
                  Keyboard.dismiss();
                  setShowEditDescriptionModal(false);
                }}
                disabled={isUpdating}
                style={{
                  flex: 1,
                  backgroundColor: 'rgba(255, 255, 255, 0.1)',
                  borderRadius: 8,
                  paddingVertical: 12,
                  alignItems: 'center',
                  opacity: isUpdating ? 0.5 : 1
                }}
              >
                <Text style={{
                  color: '#ffffff',
                  fontSize: 16,
                  fontWeight: '500'
                }}>
                  Cancel
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                onPress={handleSaveGroupDescription}
                disabled={isUpdating || newGroupDescription.trim() === groupData.description}
                style={{
                  flex: 1,
                  backgroundColor: (newGroupDescription.trim() === groupData.description) ? 'rgba(255, 255, 255, 0.1)' : '#00D4AA',
                  borderRadius: 8,
                  paddingVertical: 12,
                  alignItems: 'center',
                  opacity: isUpdating ? 0.5 : 1
                }}
              >
                <Text style={{
                  color: '#ffffff',
                  fontSize: 16,
                  fontWeight: '500'
                }}>
                  {isUpdating ? 'Saving...' : 'Save'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
          </ScrollView>
          </TouchableWithoutFeedback>
        </View>
        </TouchableWithoutFeedback>
      </Modal>

      {/* Edit Group Photo Modal */}
      <Modal
        visible={showEditPhotoModal}
        transparent={true}
        animationType="none"
        onRequestClose={() => setShowEditPhotoModal(false)}
      >
        <View style={{
          flex: 1,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          justifyContent: 'flex-start',
          paddingHorizontal: 20,
          paddingTop: 200
        }}>
          <TouchableOpacity 
            style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }} 
            onPress={() => setShowEditPhotoModal(false)}
            activeOpacity={1}
          />
          
          <View style={{
            backgroundColor: '#1a1a1f',
            borderRadius: 12,
            padding: 20,
            marginHorizontal: 20
          }}>
            <Text style={{
              fontSize: 18,
              fontWeight: '600',
              color: '#ffffff',
              marginBottom: 20
            }}>
              Edit Group Photo
            </Text>
            
            {selectedPhoto && (
              <View style={{
                alignItems: 'center',
                marginBottom: 20
              }}>
                <Image
                  source={{ uri: selectedPhoto }}
                  style={{
                    width: 120,
                    height: 120,
                    borderRadius: 60,
                    marginBottom: 16
                  }}
                />
                <Text style={{
                  fontSize: 14,
                  color: 'rgba(255, 255, 255, 0.6)'
                }}>
                  Photo Preview
                </Text>
              </View>
            )}
            
            <View style={{
              flexDirection: 'row',
              gap: 12,
              marginBottom: 20
            }}>
              <TouchableOpacity
                onPress={pickImage}
                disabled={isUpdating}
                style={{
                  flex: 1,
                  backgroundColor: 'rgba(255, 255, 255, 0.1)',
                  borderRadius: 8,
                  paddingVertical: 12,
                  alignItems: 'center',
                  opacity: isUpdating ? 0.5 : 1
                }}
              >
                <MaterialIcons name="photo-library" size={20} color="#ffffff" style={{ marginBottom: 4 }} />
                <Text style={{
                  color: '#ffffff',
                  fontSize: 14,
                  fontWeight: '500'
                }}>
                  Gallery
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                onPress={takePhoto}
                disabled={isUpdating}
                style={{
                  flex: 1,
                  backgroundColor: 'rgba(255, 255, 255, 0.1)',
                  borderRadius: 8,
                  paddingVertical: 12,
                  alignItems: 'center',
                  opacity: isUpdating ? 0.5 : 1
                }}
              >
                <MaterialIcons name="camera-alt" size={20} color="#ffffff" style={{ marginBottom: 4 }} />
                <Text style={{
                  color: '#ffffff',
                  fontSize: 14,
                  fontWeight: '500'
                }}>
                  Camera
                </Text>
              </TouchableOpacity>
            </View>
            
            <View style={{
              flexDirection: 'row',
              gap: 12
            }}>
              <TouchableOpacity
                onPress={() => {
                  setShowEditPhotoModal(false);
                  setSelectedPhoto(null);
                }}
                disabled={isUpdating}
                style={{
                  flex: 1,
                  backgroundColor: 'rgba(255, 255, 255, 0.1)',
                  borderRadius: 8,
                  paddingVertical: 12,
                  alignItems: 'center',
                  opacity: isUpdating ? 0.5 : 1
                }}
              >
                <Text style={{
                  color: '#ffffff',
                  fontSize: 16,
                  fontWeight: '500'
                }}>
                  Cancel
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                onPress={handleSaveGroupPhoto}
                disabled={isUpdating || !selectedPhoto}
                style={{
                  flex: 1,
                  backgroundColor: (!selectedPhoto) ? 'rgba(255, 255, 255, 0.1)' : '#00D4AA',
                  borderRadius: 8,
                  paddingVertical: 12,
                  alignItems: 'center',
                  opacity: isUpdating ? 0.5 : 1
                }}
              >
                <Text style={{
                  color: '#ffffff',
                  fontSize: 16,
                  fontWeight: '500'
                }}>
                  {isUpdating ? 'Saving...' : 'Save'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Privacy Modal */}
      <Modal
        visible={showPrivacyModal}
        transparent={true}
        animationType="none"
        onRequestClose={() => setShowPrivacyModal(false)}
      >
        <TouchableWithoutFeedback onPress={() => setShowPrivacyModal(false)}>
          <View style={{
            flex: 1,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            justifyContent: 'flex-start',
            paddingHorizontal: 20,
            paddingTop: 300
          }}>
            <TouchableWithoutFeedback onPress={(e) => e.stopPropagation()}>
              <View style={{
                backgroundColor: '#1a1a1f',
                borderRadius: 12,
                padding: 20,
                marginHorizontal: 20
              }}>
                <Text style={{
                  fontSize: 18,
                  fontWeight: '600',
                  color: '#ffffff',
                  marginBottom: 20
                }}>
                  Change Privacy
                </Text>

                <TouchableOpacity
                  onPress={() => setTempPrivacy('PUBLIC')}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    paddingVertical: 12,
                    paddingHorizontal: 16,
                    backgroundColor: tempPrivacy === 'PUBLIC' ? 'rgba(0, 212, 170, 0.2)' : 'transparent',
                    borderRadius: 8,
                    marginBottom: 8,
                    borderWidth: tempPrivacy === 'PUBLIC' ? 1 : 0,
                    borderColor: '#00D4AA'
                  }}
                >
                  <View style={{
                    width: 20,
                    height: 20,
                    borderRadius: 10,
                    borderWidth: 2,
                    borderColor: tempPrivacy === 'PUBLIC' ? '#00D4AA' : 'rgba(255, 255, 255, 0.3)',
                    backgroundColor: tempPrivacy === 'PUBLIC' ? '#00D4AA' : 'transparent',
                    marginRight: 12,
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    {tempPrivacy === 'PUBLIC' && (
                      <View style={{
                        width: 8,
                        height: 8,
                        borderRadius: 4,
                        backgroundColor: '#ffffff'
                      }} />
                    )}
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{
                      fontSize: 16,
                      fontWeight: '500',
                      color: '#ffffff'
                    }}>
                      Public
                    </Text>
                    <Text style={{
                      fontSize: 13,
                      color: 'rgba(255, 255, 255, 0.6)',
                      marginTop: 2
                    }}>
                      Anyone can find and view this group
                    </Text>
                  </View>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => setTempPrivacy('PRIVATE')}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    paddingVertical: 12,
                    paddingHorizontal: 16,
                    backgroundColor: tempPrivacy === 'PRIVATE' ? 'rgba(0, 212, 170, 0.2)' : 'transparent',
                    borderRadius: 8,
                    marginBottom: 20,
                    borderWidth: tempPrivacy === 'PRIVATE' ? 1 : 0,
                    borderColor: '#00D4AA'
                  }}
                >
                  <View style={{
                    width: 20,
                    height: 20,
                    borderRadius: 10,
                    borderWidth: 2,
                    borderColor: tempPrivacy === 'PRIVATE' ? '#00D4AA' : 'rgba(255, 255, 255, 0.3)',
                    backgroundColor: tempPrivacy === 'PRIVATE' ? '#00D4AA' : 'transparent',
                    marginRight: 12,
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    {tempPrivacy === 'PRIVATE' && (
                      <View style={{
                        width: 8,
                        height: 8,
                        borderRadius: 4,
                        backgroundColor: '#ffffff'
                      }} />
                    )}
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{
                      fontSize: 16,
                      fontWeight: '500',
                      color: '#ffffff'
                    }}>
                      Private
                    </Text>
                    <Text style={{
                      fontSize: 13,
                      color: 'rgba(255, 255, 255, 0.6)',
                      marginTop: 2
                    }}>
                      Only invited members can view
                    </Text>
                  </View>
                </TouchableOpacity>

                <View style={{
                  flexDirection: 'row',
                  gap: 12
                }}>
                  <TouchableOpacity
                    onPress={() => setShowPrivacyModal(false)}
                    disabled={isUpdating}
                    style={{
                      flex: 1,
                      backgroundColor: 'rgba(255, 255, 255, 0.1)',
                      borderRadius: 8,
                      paddingVertical: 12,
                      alignItems: 'center',
                      opacity: isUpdating ? 0.5 : 1
                    }}
                  >
                    <Text style={{
                      color: '#ffffff',
                      fontSize: 16,
                      fontWeight: '500'
                    }}>
                      Cancel
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={handleSavePrivacy}
                    disabled={isUpdating}
                    style={{
                      flex: 1,
                      backgroundColor: '#00D4AA',
                      borderRadius: 8,
                      paddingVertical: 12,
                      alignItems: 'center',
                      opacity: isUpdating ? 0.5 : 1
                    }}
                  >
                    <Text style={{
                      color: '#ffffff',
                      fontSize: 16,
                      fontWeight: '500'
                    }}>
                      {isUpdating ? 'Saving...' : 'Save'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      {/* Auto-approve Modal */}
      <Modal
        visible={showAutoApproveModal}
        transparent={true}
        animationType="none"
        onRequestClose={() => setShowAutoApproveModal(false)}
      >
        <TouchableWithoutFeedback onPress={() => setShowAutoApproveModal(false)}>
          <View style={{
            flex: 1,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            justifyContent: 'flex-start',
            paddingHorizontal: 20,
            paddingTop: 300
          }}>
            <TouchableWithoutFeedback onPress={(e) => e.stopPropagation()}>
              <View style={{
                backgroundColor: '#1a1a1f',
                borderRadius: 12,
                padding: 20,
                marginHorizontal: 20
              }}>
                <Text style={{
                  fontSize: 18,
                  fontWeight: '600',
                  color: '#ffffff',
                  marginBottom: 8
                }}>
                  Auto-approve Members
                </Text>

                {groupData.privacy === 'PRIVATE' && (
                  <Text style={{
                    fontSize: 14,
                    color: 'rgba(255, 255, 255, 0.6)',
                    marginBottom: 20
                  }}>
                    Private groups require manual approval for all members.
                  </Text>
                )}

                {groupData.privacy === 'PUBLIC' && (
                  <>
                    <Text style={{
                      fontSize: 14,
                      color: 'rgba(255, 255, 255, 0.6)',
                      marginBottom: 20
                    }}>
                      Choose whether to automatically approve join requests.
                    </Text>

                    <TouchableOpacity
                      onPress={() => setTempAutoApprove(true)}
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        paddingVertical: 12,
                        paddingHorizontal: 16,
                        backgroundColor: tempAutoApprove ? 'rgba(0, 212, 170, 0.2)' : 'transparent',
                        borderRadius: 8,
                        marginBottom: 8,
                        borderWidth: tempAutoApprove ? 1 : 0,
                        borderColor: '#00D4AA'
                      }}
                    >
                      <View style={{
                        width: 20,
                        height: 20,
                        borderRadius: 10,
                        borderWidth: 2,
                        borderColor: tempAutoApprove ? '#00D4AA' : 'rgba(255, 255, 255, 0.3)',
                        backgroundColor: tempAutoApprove ? '#00D4AA' : 'transparent',
                        marginRight: 12,
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}>
                        {tempAutoApprove && (
                          <View style={{
                            width: 8,
                            height: 8,
                            borderRadius: 4,
                            backgroundColor: '#ffffff'
                          }} />
                        )}
                      </View>
                      <Text style={{
                        fontSize: 16,
                        fontWeight: '500',
                        color: '#ffffff'
                      }}>
                        On
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      onPress={() => setTempAutoApprove(false)}
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        paddingVertical: 12,
                        paddingHorizontal: 16,
                        backgroundColor: !tempAutoApprove ? 'rgba(0, 212, 170, 0.2)' : 'transparent',
                        borderRadius: 8,
                        marginBottom: 20,
                        borderWidth: !tempAutoApprove ? 1 : 0,
                        borderColor: '#00D4AA'
                      }}
                    >
                      <View style={{
                        width: 20,
                        height: 20,
                        borderRadius: 10,
                        borderWidth: 2,
                        borderColor: !tempAutoApprove ? '#00D4AA' : 'rgba(255, 255, 255, 0.3)',
                        backgroundColor: !tempAutoApprove ? '#00D4AA' : 'transparent',
                        marginRight: 12,
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}>
                        {!tempAutoApprove && (
                          <View style={{
                            width: 8,
                            height: 8,
                            borderRadius: 4,
                            backgroundColor: '#ffffff'
                          }} />
                        )}
                      </View>
                      <Text style={{
                        fontSize: 16,
                        fontWeight: '500',
                        color: '#ffffff'
                      }}>
                        Off
                      </Text>
                    </TouchableOpacity>
                  </>
                )}

                <View style={{
                  flexDirection: 'row',
                  gap: 12
                }}>
                  <TouchableOpacity
                    onPress={() => setShowAutoApproveModal(false)}
                    disabled={isUpdating}
                    style={{
                      flex: 1,
                      backgroundColor: 'rgba(255, 255, 255, 0.1)',
                      borderRadius: 8,
                      paddingVertical: 12,
                      alignItems: 'center',
                      opacity: isUpdating ? 0.5 : 1
                    }}
                  >
                    <Text style={{
                      color: '#ffffff',
                      fontSize: 16,
                      fontWeight: '500'
                    }}>
                      {groupData.privacy === 'PRIVATE' ? 'OK' : 'Cancel'}
                    </Text>
                  </TouchableOpacity>

                  {groupData.privacy === 'PUBLIC' && (
                    <TouchableOpacity
                      onPress={handleSaveAutoApprove}
                      disabled={isUpdating}
                      style={{
                        flex: 1,
                        backgroundColor: '#00D4AA',
                        borderRadius: 8,
                        paddingVertical: 12,
                        alignItems: 'center',
                        opacity: isUpdating ? 0.5 : 1
                      }}
                    >
                      <Text style={{
                        color: '#ffffff',
                        fontSize: 16,
                        fontWeight: '500'
                      }}>
                        {isUpdating ? 'Saving...' : 'Save'}
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </View>
  );
};

export default GroupSettingsTab;