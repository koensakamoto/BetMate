import React, { useState, useCallback } from 'react';
import { Text, View, TouchableOpacity, Alert, TextInput, Image } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { MaterialIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { groupService } from '../../services/group/groupService';
import { ENV } from '../../config/env';

const icon = require("../../assets/images/icon.png");

interface GroupSettingsTabProps {
  groupData: {
    id: number;
    name: string;
    description: string;
    memberCount: number;
    privacy?: 'PUBLIC' | 'PRIVATE' | 'SECRET';
    groupPictureUrl?: string;
  };
  onGroupUpdated?: (updatedGroup: any) => void;
}

const SettingSection = React.memo(({ title, children }: { title: string; children: React.ReactNode }) => (
  <View style={{
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
    borderWidth: 0.5,
    borderColor: 'rgba(255, 255, 255, 0.08)'
  }}>
    <Text style={{
      fontSize: 14,
      fontWeight: '600',
      color: '#ffffff',
      marginBottom: 12
    }}>
      {title}
    </Text>
    {children}
  </View>
));
SettingSection.displayName = 'SettingSection';

const GroupSettingsTab: React.FC<GroupSettingsTabProps> = ({ groupData, onGroupUpdated }) => {
  const [isEditingName, setIsEditingName] = useState(false);
  const [editedName, setEditedName] = useState(groupData.name);

  const [isEditingDescription, setIsEditingDescription] = useState(false);
  const [editedDescription, setEditedDescription] = useState(groupData.description);

  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);

  const [tempPrivacy, setTempPrivacy] = useState<'PUBLIC' | 'PRIVATE' | 'SECRET'>(groupData.privacy || 'PRIVATE');
  const [isEditingPrivacy, setIsEditingPrivacy] = useState(false);

  const [isUpdating, setIsUpdating] = useState(false);

  // Get full image URL
  const getFullImageUrl = (relativePath: string | null | undefined): string | null => {
    if (!relativePath) return null;
    if (relativePath.startsWith('http://') || relativePath.startsWith('https://')) {
      return relativePath;
    }
    return `${ENV.API_BASE_URL}${relativePath}`;
  };

  const currentGroupPhotoUrl = selectedPhoto || getFullImageUrl(groupData.groupPictureUrl);

  const handleSaveName = async () => {
    if (!editedName.trim() || editedName.trim() === groupData.name) {
      setIsEditingName(false);
      setEditedName(groupData.name);
      return;
    }

    setIsUpdating(true);
    try {
      const updatedGroup = await groupService.updateGroup(groupData.id, {
        groupName: editedName.trim()
      });

      if (onGroupUpdated) {
        onGroupUpdated(updatedGroup);
      }

      setIsEditingName(false);
      Alert.alert('Success', 'Group name updated successfully!');
    } catch (error) {
      console.error('Failed to update group name:', error);
      Alert.alert('Error', 'Failed to update group name. Please try again.');
      setEditedName(groupData.name);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleCancelName = () => {
    setEditedName(groupData.name);
    setIsEditingName(false);
  };

  const handleSaveDescription = async () => {
    if (editedDescription.trim() === groupData.description) {
      setIsEditingDescription(false);
      return;
    }

    setIsUpdating(true);
    try {
      const updatedGroup = await groupService.updateGroup(groupData.id, {
        description: editedDescription.trim()
      });

      if (onGroupUpdated) {
        onGroupUpdated(updatedGroup);
      }

      setIsEditingDescription(false);
      Alert.alert('Success', 'Group description updated successfully!');
    } catch (error) {
      console.error('Failed to update group description:', error);
      Alert.alert('Error', 'Failed to update group description. Please try again.');
      setEditedDescription(groupData.description);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleCancelDescription = () => {
    setEditedDescription(groupData.description);
    setIsEditingDescription(false);
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
      await handleSaveGroupPhoto(result.assets[0].uri);
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
      await handleSaveGroupPhoto(result.assets[0].uri);
    }
  };

  const handleSaveGroupPhoto = async (photoUri: string) => {
    setIsUpdating(true);
    try {
      const uriParts = photoUri.split('/');
      const fileName = uriParts[uriParts.length - 1];

      const updatedGroup = await groupService.uploadGroupPicture(
        groupData.id,
        photoUri,
        fileName
      );

      if (onGroupUpdated) {
        onGroupUpdated(updatedGroup);
      }

      Alert.alert('Success', 'Group photo updated successfully!');
    } catch (error) {
      console.error('Failed to update group photo:', error);
      Alert.alert('Error', 'Failed to update group photo. Please try again.');
      setSelectedPhoto(null);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleSavePrivacy = async () => {
    if (tempPrivacy === groupData.privacy) {
      setIsEditingPrivacy(false);
      return;
    }

    setIsUpdating(true);
    try {
      const updatedGroup = await groupService.updateGroup(groupData.id, { privacy: tempPrivacy });

      if (onGroupUpdated) {
        onGroupUpdated(updatedGroup);
      }

      setIsEditingPrivacy(false);
      Alert.alert('Success', 'Privacy settings updated successfully!');
    } catch (error) {
      console.error('Failed to update privacy:', error);
      Alert.alert('Error', 'Failed to update privacy settings. Please try again.');
      setTempPrivacy(groupData.privacy || 'PRIVATE');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleCancelPrivacy = () => {
    setTempPrivacy(groupData.privacy || 'PRIVATE');
    setIsEditingPrivacy(false);
  };

  const handleLeaveGroup = async () => {
    // First, check if there is another admin in the group
    setIsUpdating(true);
    try {
      const members = await groupService.getGroupMembers(groupData.id);
      const adminCount = members.filter(m => m.role === 'ADMIN' && m.isActive).length;

      if (adminCount <= 1) {
        Alert.alert(
          'Cannot Leave Group',
          'You are the only admin in this group. Please promote another member to admin before leaving, or delete the group instead.',
          [{ text: 'OK' }]
        );
        setIsUpdating(false);
        return;
      }

      // If there are other admins, proceed with leaving
      Alert.alert(
        'Leave Group',
        `Are you sure you want to leave ${groupData.name}? Another admin will manage the group.`,
        [
          {
            text: 'Cancel',
            style: 'cancel',
            onPress: () => setIsUpdating(false)
          },
          {
            text: 'Leave',
            style: 'destructive',
            onPress: async () => {
              try {
                await groupService.leaveGroup(groupData.id);
                Alert.alert(
                  'Success',
                  'You have left the group',
                  [
                    {
                      text: 'OK',
                      onPress: () => {
                        router.replace({
                          pathname: '/(tabs)/group',
                          params: { refresh: Date.now().toString() }
                        });
                      }
                    }
                  ]
                );
              } catch (error: any) {
                console.error('Failed to leave group:', error);
                const errorMessage = error?.response?.data?.error || 'Failed to leave group. Please try again.';
                Alert.alert('Error', errorMessage);
              } finally {
                setIsUpdating(false);
              }
            }
          }
        ]
      );
    } catch (error) {
      console.error('Failed to fetch group members:', error);
      Alert.alert('Error', 'Failed to verify admin status. Please try again.');
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
          onPress: async () => {
            setIsUpdating(true);
            try {
              await groupService.deleteGroup(groupData.id);
              Alert.alert(
                'Success',
                'Group deleted successfully',
                [
                  {
                    text: 'OK',
                    onPress: () => {
                      router.replace({
                        pathname: '/(tabs)/group',
                        params: { refresh: Date.now().toString() }
                      });
                    }
                  }
                ]
              );
            } catch (error) {
              console.error('Failed to delete group:', error);
              Alert.alert('Error', 'Failed to delete group. Please try again.');
            } finally {
              setIsUpdating(false);
            }
          },
        },
      ]
    );
  };

  return (
    <View>
      {/* Group Photo */}
      <View style={{
        alignItems: 'center',
        marginBottom: 16
      }}>
        <View style={{
          width: 80,
          height: 80,
          borderRadius: 40,
          backgroundColor: 'rgba(255, 255, 255, 0.1)',
          justifyContent: 'center',
          alignItems: 'center',
          borderWidth: 2,
          borderColor: 'rgba(0, 212, 170, 0.3)',
          marginBottom: 12
        }}>
          {currentGroupPhotoUrl ? (
            <Image
              source={{ uri: currentGroupPhotoUrl }}
              style={{
                width: 80,
                height: 80,
                borderRadius: 40
              }}
            />
          ) : (
            <MaterialIcons
              name="groups"
              size={32}
              color="rgba(255, 255, 255, 0.4)"
            />
          )}
        </View>

        {/* Photo Options */}
        <View style={{
          flexDirection: 'row',
          gap: 8,
          width: '100%'
        }}>
          <TouchableOpacity
            onPress={pickImage}
            disabled={isUpdating}
            style={{
              flex: 1,
              backgroundColor: 'rgba(0, 212, 170, 0.15)',
              borderRadius: 8,
              paddingVertical: 8,
              paddingHorizontal: 12,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              borderWidth: 1,
              borderColor: 'rgba(0, 212, 170, 0.3)',
              opacity: isUpdating ? 0.5 : 1
            }}
          >
            <MaterialIcons name="photo-library" size={16} color="#00D4AA" style={{ marginRight: 6 }} />
            <Text style={{ color: '#00D4AA', fontSize: 13, fontWeight: '600' }}>
              Gallery
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={takePhoto}
            disabled={isUpdating}
            style={{
              flex: 1,
              backgroundColor: 'rgba(0, 212, 170, 0.15)',
              borderRadius: 8,
              paddingVertical: 8,
              paddingHorizontal: 12,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              borderWidth: 1,
              borderColor: 'rgba(0, 212, 170, 0.3)',
              opacity: isUpdating ? 0.5 : 1
            }}
          >
            <MaterialIcons name="camera-alt" size={16} color="#00D4AA" style={{ marginRight: 6 }} />
            <Text style={{ color: '#00D4AA', fontSize: 13, fontWeight: '600' }}>
              Camera
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Group Information */}
      <SettingSection title="Group Information">
        {/* Group Name */}
        <View style={{
          paddingBottom: 16,
          borderBottomWidth: 0.5,
          borderBottomColor: 'rgba(255, 255, 255, 0.1)',
          marginBottom: 16
        }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
            <MaterialIcons name="edit" size={18} color="rgba(255, 255, 255, 0.8)" style={{ marginRight: 12 }} />
            <Text style={{ fontSize: 15, color: '#ffffff', fontWeight: '500' }}>
              Group Name
            </Text>
          </View>

          {isEditingName ? (
            <>
              <TextInput
                value={editedName}
                onChangeText={setEditedName}
                placeholder="Group name"
                placeholderTextColor="rgba(255, 255, 255, 0.4)"
                style={{
                  backgroundColor: 'rgba(255, 255, 255, 0.08)',
                  borderRadius: 8,
                  paddingHorizontal: 12,
                  paddingVertical: 10,
                  fontSize: 15,
                  color: '#ffffff',
                  marginBottom: 12,
                  borderWidth: 1,
                  borderColor: '#00D4AA'
                }}
                maxLength={50}
                editable={!isUpdating}
                autoFocus={true}
              />
              <View style={{ flexDirection: 'row', gap: 8 }}>
                <TouchableOpacity
                  onPress={handleCancelName}
                  disabled={isUpdating}
                  activeOpacity={0.7}
                  style={{
                    flex: 1,
                    backgroundColor: 'rgba(255, 255, 255, 0.1)',
                    borderRadius: 8,
                    paddingVertical: 10,
                    alignItems: 'center',
                    opacity: isUpdating ? 0.5 : 1
                  }}
                >
                  <Text style={{ color: '#ffffff', fontSize: 14, fontWeight: '500' }}>
                    Cancel
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={handleSaveName}
                  disabled={isUpdating || !editedName.trim() || editedName.trim() === groupData.name}
                  activeOpacity={0.7}
                  style={{
                    flex: 1,
                    backgroundColor: (!editedName.trim() || editedName.trim() === groupData.name) ? 'rgba(255, 255, 255, 0.1)' : '#00D4AA',
                    borderRadius: 8,
                    paddingVertical: 10,
                    alignItems: 'center',
                    opacity: isUpdating ? 0.5 : 1
                  }}
                >
                  <Text style={{ color: '#ffffff', fontSize: 14, fontWeight: '600' }}>
                    {isUpdating ? 'Saving...' : 'Save'}
                  </Text>
                </TouchableOpacity>
              </View>
            </>
          ) : (
            <TouchableOpacity
              onPress={() => setIsEditingName(true)}
              style={{
                backgroundColor: 'rgba(255, 255, 255, 0.05)',
                borderRadius: 8,
                paddingHorizontal: 12,
                paddingVertical: 10,
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}
            >
              <Text style={{ fontSize: 15, color: 'rgba(255, 255, 255, 0.9)' }}>
                {groupData.name}
              </Text>
              <MaterialIcons name="chevron-right" size={20} color="rgba(255, 255, 255, 0.4)" />
            </TouchableOpacity>
          )}
        </View>

        {/* Group Description */}
        <View>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
            <MaterialIcons name="description" size={18} color="rgba(255, 255, 255, 0.8)" style={{ marginRight: 12 }} />
            <Text style={{ fontSize: 15, color: '#ffffff', fontWeight: '500' }}>
              Description
            </Text>
          </View>

          {isEditingDescription ? (
            <>
              <TextInput
                value={editedDescription}
                onChangeText={setEditedDescription}
                placeholder="Describe your group..."
                placeholderTextColor="rgba(255, 255, 255, 0.4)"
                style={{
                  backgroundColor: 'rgba(255, 255, 255, 0.08)',
                  borderRadius: 8,
                  paddingHorizontal: 12,
                  paddingVertical: 10,
                  fontSize: 15,
                  color: '#ffffff',
                  marginBottom: 12,
                  minHeight: 80,
                  textAlignVertical: 'top',
                  borderWidth: 1,
                  borderColor: '#00D4AA'
                }}
                maxLength={200}
                editable={!isUpdating}
                multiline={true}
                autoFocus={true}
              />
              <View style={{ flexDirection: 'row', gap: 8 }}>
                <TouchableOpacity
                  onPress={handleCancelDescription}
                  disabled={isUpdating}
                  activeOpacity={0.7}
                  style={{
                    flex: 1,
                    backgroundColor: 'rgba(255, 255, 255, 0.1)',
                    borderRadius: 8,
                    paddingVertical: 10,
                    alignItems: 'center',
                    opacity: isUpdating ? 0.5 : 1
                  }}
                >
                  <Text style={{ color: '#ffffff', fontSize: 14, fontWeight: '500' }}>
                    Cancel
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={handleSaveDescription}
                  disabled={isUpdating || editedDescription.trim() === groupData.description}
                  activeOpacity={0.7}
                  style={{
                    flex: 1,
                    backgroundColor: (editedDescription.trim() === groupData.description) ? 'rgba(255, 255, 255, 0.1)' : '#00D4AA',
                    borderRadius: 8,
                    paddingVertical: 10,
                    alignItems: 'center',
                    opacity: isUpdating ? 0.5 : 1
                  }}
                >
                  <Text style={{ color: '#ffffff', fontSize: 14, fontWeight: '600' }}>
                    {isUpdating ? 'Saving...' : 'Save'}
                  </Text>
                </TouchableOpacity>
              </View>
            </>
          ) : (
            <TouchableOpacity
              onPress={() => setIsEditingDescription(true)}
              style={{
                backgroundColor: 'rgba(255, 255, 255, 0.05)',
                borderRadius: 8,
                paddingHorizontal: 12,
                paddingVertical: 10,
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}
            >
              <Text style={{ fontSize: 15, color: 'rgba(255, 255, 255, 0.9)', flex: 1 }} numberOfLines={2}>
                {groupData.description}
              </Text>
              <MaterialIcons name="chevron-right" size={20} color="rgba(255, 255, 255, 0.4)" style={{ marginLeft: 8 }} />
            </TouchableOpacity>
          )}
        </View>
      </SettingSection>

      {/* Privacy & Access */}
      <SettingSection title="Privacy & Access">
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
          <MaterialIcons name="public" size={18} color="rgba(255, 255, 255, 0.8)" style={{ marginRight: 12 }} />
          <Text style={{ fontSize: 15, color: '#ffffff', fontWeight: '500' }}>
            Privacy
          </Text>
        </View>

        {isEditingPrivacy ? (
          <>
            {/* Privacy Options */}
            <TouchableOpacity
              onPress={() => setTempPrivacy('PUBLIC')}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                paddingVertical: 12,
                paddingHorizontal: 12,
                backgroundColor: tempPrivacy === 'PUBLIC' ? 'rgba(0, 212, 170, 0.15)' : 'rgba(255, 255, 255, 0.05)',
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
                <Text style={{ fontSize: 15, fontWeight: '500', color: '#ffffff' }}>
                  Public
                </Text>
                <Text style={{ fontSize: 13, color: 'rgba(255, 255, 255, 0.6)', marginTop: 2 }}>
                  Anyone can join instantly
                </Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setTempPrivacy('PRIVATE')}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                paddingVertical: 12,
                paddingHorizontal: 12,
                backgroundColor: tempPrivacy === 'PRIVATE' ? 'rgba(0, 212, 170, 0.15)' : 'rgba(255, 255, 255, 0.05)',
                borderRadius: 8,
                marginBottom: 8,
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
                <Text style={{ fontSize: 15, fontWeight: '500', color: '#ffffff' }}>
                  Private
                </Text>
                <Text style={{ fontSize: 13, color: 'rgba(255, 255, 255, 0.6)', marginTop: 2 }}>
                  Requires approval to join
                </Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setTempPrivacy('SECRET')}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                paddingVertical: 12,
                paddingHorizontal: 12,
                backgroundColor: tempPrivacy === 'SECRET' ? 'rgba(0, 212, 170, 0.15)' : 'rgba(255, 255, 255, 0.05)',
                borderRadius: 8,
                marginBottom: 12,
                borderWidth: tempPrivacy === 'SECRET' ? 1 : 0,
                borderColor: '#00D4AA'
              }}
            >
              <View style={{
                width: 20,
                height: 20,
                borderRadius: 10,
                borderWidth: 2,
                borderColor: tempPrivacy === 'SECRET' ? '#00D4AA' : 'rgba(255, 255, 255, 0.3)',
                backgroundColor: tempPrivacy === 'SECRET' ? '#00D4AA' : 'transparent',
                marginRight: 12,
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                {tempPrivacy === 'SECRET' && (
                  <View style={{
                    width: 8,
                    height: 8,
                    borderRadius: 4,
                    backgroundColor: '#ffffff'
                  }} />
                )}
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 15, fontWeight: '500', color: '#ffffff' }}>
                  Secret
                </Text>
                <Text style={{ fontSize: 13, color: 'rgba(255, 255, 255, 0.6)', marginTop: 2 }}>
                  Hidden, invite-only
                </Text>
              </View>
            </TouchableOpacity>

            <View style={{ flexDirection: 'row', gap: 8 }}>
              <TouchableOpacity
                onPress={handleCancelPrivacy}
                disabled={isUpdating}
                style={{
                  flex: 1,
                  backgroundColor: 'rgba(255, 255, 255, 0.1)',
                  borderRadius: 8,
                  paddingVertical: 10,
                  alignItems: 'center',
                  opacity: isUpdating ? 0.5 : 1
                }}
              >
                <Text style={{ color: '#ffffff', fontSize: 14, fontWeight: '500' }}>
                  Cancel
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleSavePrivacy}
                disabled={isUpdating || tempPrivacy === groupData.privacy}
                style={{
                  flex: 1,
                  backgroundColor: (tempPrivacy === groupData.privacy) ? 'rgba(255, 255, 255, 0.1)' : '#00D4AA',
                  borderRadius: 8,
                  paddingVertical: 10,
                  alignItems: 'center',
                  opacity: isUpdating ? 0.5 : 1
                }}
              >
                <Text style={{ color: '#ffffff', fontSize: 14, fontWeight: '600' }}>
                  {isUpdating ? 'Saving...' : 'Save'}
                </Text>
              </TouchableOpacity>
            </View>
          </>
        ) : (
          <TouchableOpacity
            onPress={() => setIsEditingPrivacy(true)}
            style={{
              backgroundColor: 'rgba(255, 255, 255, 0.05)',
              borderRadius: 8,
              paddingHorizontal: 12,
              paddingVertical: 10,
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}
          >
            <Text style={{ fontSize: 15, color: 'rgba(255, 255, 255, 0.9)' }}>
              {groupData.privacy === 'PUBLIC'
                ? 'Public'
                : groupData.privacy === 'SECRET'
                ? 'Secret'
                : 'Private'}
            </Text>
            <MaterialIcons name="chevron-right" size={20} color="rgba(255, 255, 255, 0.4)" />
          </TouchableOpacity>
        )}
      </SettingSection>

      {/* Leave Group */}
      <TouchableOpacity
        onPress={handleLeaveGroup}
        disabled={isUpdating}
        style={{
          backgroundColor: 'rgba(255, 255, 255, 0.03)',
          borderRadius: 16,
          padding: 16,
          marginBottom: 12,
          borderWidth: 0.5,
          borderColor: 'rgba(255, 152, 0, 0.2)',
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          opacity: isUpdating ? 0.5 : 1
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
              name="exit-to-app"
              size={18}
              color="#FF9800"
            />
          </View>
          <View>
            <Text style={{
              fontSize: 15,
              fontWeight: '500',
              color: '#FF9800',
              marginBottom: 2
            }}>
              Leave Group
            </Text>
            <Text style={{
              fontSize: 13,
              color: 'rgba(255, 152, 0, 0.7)'
            }}>
              Leave this group as admin
            </Text>
          </View>
        </View>
        <MaterialIcons
          name="chevron-right"
          size={20}
          color="rgba(255, 152, 0, 0.6)"
        />
      </TouchableOpacity>

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
    </View>
  );
};

export default GroupSettingsTab;
