import React, { useState, useCallback } from 'react';
import { Text, View, TouchableOpacity, Alert, TextInput, Linking, Modal, ScrollView, ActivityIndicator } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { MaterialIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useQueryClient } from '@tanstack/react-query';
import { groupService, GroupMemberResponse, GroupDetailResponse } from '../../services/group/groupService';
import { groupKeys } from '../../hooks/useGroupQueries';
import { Avatar } from '../common/Avatar';
import { OptimizedImage } from '../common/OptimizedImage';
import { getFullImageUrl, getAvatarColor, getAvatarColorWithOpacity, getGroupInitials } from '../../utils/avatarUtils';
import { colors, spacing, borderRadius, fontSize, fontWeight } from '../../constants/theme';
import { showSuccessToast, showErrorToast } from '../../utils/toast';

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
  isOwner?: boolean;
  currentUsername?: string;
  onGroupUpdated?: (updatedGroup: GroupDetailResponse) => void;
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

const GroupSettingsTab: React.FC<GroupSettingsTabProps> = ({ groupData, isOwner = false, currentUsername, onGroupUpdated }) => {
  const queryClient = useQueryClient();

  const [isEditingName, setIsEditingName] = useState(false);
  const [editedName, setEditedName] = useState(groupData.name);

  const [isEditingDescription, setIsEditingDescription] = useState(false);
  const [editedDescription, setEditedDescription] = useState(groupData.description);

  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);

  const [tempPrivacy, setTempPrivacy] = useState<'PUBLIC' | 'PRIVATE' | 'SECRET'>(groupData.privacy || 'PRIVATE');
  const [isEditingPrivacy, setIsEditingPrivacy] = useState(false);

  const [isUpdating, setIsUpdating] = useState(false);

  // Transfer ownership state
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [members, setMembers] = useState<GroupMemberResponse[]>([]);
  const [isLoadingMembers, setIsLoadingMembers] = useState(false);
  const [memberSearchQuery, setMemberSearchQuery] = useState('');
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [selectedMember, setSelectedMember] = useState<GroupMemberResponse | null>(null);

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

      // Invalidate React Query cache so group page shows updated data
      queryClient.invalidateQueries({ queryKey: groupKeys.detail(groupData.id) });
      queryClient.invalidateQueries({ queryKey: groupKeys.myGroups() });

      if (onGroupUpdated) {
        onGroupUpdated(updatedGroup);
      }

      setIsEditingName(false);
      showSuccessToast('Name Updated', 'Group name updated successfully!');
    } catch (error) {
      // Error handled silently
      showErrorToast('Update Failed', 'Failed to update group name. Please try again.');
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

      // Invalidate React Query cache so group page shows updated data
      queryClient.invalidateQueries({ queryKey: groupKeys.detail(groupData.id) });
      queryClient.invalidateQueries({ queryKey: groupKeys.myGroups() });

      if (onGroupUpdated) {
        onGroupUpdated(updatedGroup);
      }

      setIsEditingDescription(false);
      showSuccessToast('Description Updated', 'Group description updated successfully!');
    } catch (error) {
      // Error handled silently
      showErrorToast('Update Failed', 'Failed to update group description. Please try again.');
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

    if (!result.canceled) {
      setSelectedPhoto(result.assets[0].uri);
      await handleSaveGroupPhoto(result.assets[0].uri);
    }
  };

  const takePhoto = async () => {
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

      // Invalidate React Query cache so group page shows updated data
      queryClient.invalidateQueries({ queryKey: groupKeys.detail(groupData.id) });
      queryClient.invalidateQueries({ queryKey: groupKeys.myGroups() });

      if (onGroupUpdated) {
        onGroupUpdated(updatedGroup);
      }

      // Clear local photo so it uses the new server URL from props
      setSelectedPhoto(null);

      showSuccessToast('Photo Updated', 'Group photo updated successfully!');
    } catch (error) {
      // Error handled silently
      showErrorToast('Upload Failed', 'Failed to update group photo. Please try again.');
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

      // Invalidate React Query cache so group page shows updated data
      queryClient.invalidateQueries({ queryKey: groupKeys.detail(groupData.id) });
      queryClient.invalidateQueries({ queryKey: groupKeys.myGroups() });
      queryClient.invalidateQueries({ queryKey: groupKeys.publicGroups() });

      if (onGroupUpdated) {
        onGroupUpdated(updatedGroup);
      }

      setIsEditingPrivacy(false);
      showSuccessToast('Privacy Updated', 'Privacy settings updated successfully!');
    } catch (error) {
      // Error handled silently
      showErrorToast('Update Failed', 'Failed to update privacy settings. Please try again.');
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
                        router.dismissAll();
                        router.navigate({
                          pathname: '/(tabs)/group' as any,
                          params: { refresh: Date.now().toString() }
                        });
                      }
                    }
                  ]
                );
              } catch (error: any) {
                // Error handled silently
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
      // Error handled silently
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
                      router.dismissAll();
                      router.navigate({
                        pathname: '/(tabs)/group' as any,
                        params: { refresh: Date.now().toString() }
                      });
                    }
                  }
                ]
              );
            } catch (error: any) {
              // Error handled silently
              Alert.alert('Error', 'Failed to delete group. Please try again.');
            } finally {
              setIsUpdating(false);
            }
          },
        },
      ]
    );
  };

  const handleOpenTransferModal = async () => {
    setShowTransferModal(true);
    setIsLoadingMembers(true);
    setMemberSearchQuery('');

    try {
      const membersList = await groupService.getGroupMembers(groupData.id);
      // Filter out the current owner from the list
      const eligibleMembers = membersList.filter(m => m.username !== currentUsername);
      setMembers(eligibleMembers);
    } catch (error) {
      // Error handled silently
      Alert.alert('Error', 'Failed to load members. Please try again.');
      setShowTransferModal(false);
    } finally {
      setIsLoadingMembers(false);
    }
  };

  const handleTransferOwnership = (member: GroupMemberResponse) => {
    setSelectedMember(member);
    setShowConfirmModal(true);
  };

  const confirmTransferOwnership = async () => {
    if (!selectedMember) return;

    setIsUpdating(true);
    try {
      await groupService.transferOwnership(groupData.id, selectedMember.id);
      setShowConfirmModal(false);
      setShowTransferModal(false);
      Alert.alert(
        'Ownership Transferred',
        `${selectedMember.displayName || selectedMember.username} is now the owner of this group.`,
        [
          {
            text: 'OK',
            onPress: () => {
              router.dismissAll();
              router.navigate({
                pathname: '/(tabs)/group' as any,
                params: { refresh: Date.now().toString() }
              });
            }
          }
        ]
      );
    } catch (error: any) {
      // Error handled silently
      Alert.alert('Error', 'Failed to transfer ownership. Please try again.');
    } finally {
      setIsUpdating(false);
    }
  };

  const filteredMembers = members.filter(member => {
    if (!memberSearchQuery.trim()) return true;
    const query = memberSearchQuery.toLowerCase();
    return (
      member.username.toLowerCase().includes(query) ||
      (member.displayName?.toLowerCase().includes(query))
    );
  });

  return (
    <View>
      {/* Group Photo Section */}
      <View style={{
        paddingVertical: 16,
        borderBottomWidth: 0.5,
        borderBottomColor: 'rgba(255, 255, 255, 0.1)',
        marginBottom: 8
      }}>
        {/* Avatar Display */}
        <View style={{
          alignItems: 'center',
          marginBottom: 20
        }}>
          {currentGroupPhotoUrl ? (
            <View style={{
              borderWidth: 2,
              borderColor: 'rgba(255, 255, 255, 0.1)',
              borderRadius: 50,
              overflow: 'hidden'
            }}>
              <OptimizedImage
                source={currentGroupPhotoUrl}
                width={100}
                height={100}
                borderRadius={50}
                sizeVariant="medium"
                transition={0}
                recyclingKey={`group-settings-${groupData.id}`}
                accessibilityLabel="Group photo"
              />
            </View>
          ) : (
            <View style={{
              width: 100,
              height: 100,
              borderRadius: 50,
              backgroundColor: getAvatarColorWithOpacity(groupData.id, 0.2),
              justifyContent: 'center',
              alignItems: 'center',
              borderWidth: 2,
              borderColor: getAvatarColorWithOpacity(groupData.id, 0.3)
            }}>
              <Text style={{
                fontSize: 36,
                fontWeight: '700',
                color: getAvatarColor(groupData.id)
              }}>
                {getGroupInitials(groupData.name)}
              </Text>
            </View>
          )}
        </View>

        {/* Upload Buttons */}
        <View style={{
          flexDirection: 'row',
          gap: 12
        }}>
          {/* Photo Library Button */}
          <TouchableOpacity
            onPress={pickImage}
            disabled={isUpdating}
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel="Select from photo library"
            accessibilityHint="Double tap to choose a photo from your library"
            accessibilityState={{ disabled: isUpdating }}
            style={{
              flex: 1,
              backgroundColor: 'rgba(255, 255, 255, 0.05)',
              borderWidth: 1,
              borderColor: 'rgba(255, 255, 255, 0.1)',
              borderRadius: 12,
              paddingVertical: 14,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              opacity: isUpdating ? 0.5 : 1
            }}
          >
            <MaterialIcons name="photo-library" size={20} color="#00D4AA" accessible={false} />
            <Text style={{
              fontSize: 14,
              fontWeight: '600',
              color: '#ffffff'
            }} accessible={false}>
              Photo Library
            </Text>
          </TouchableOpacity>

          {/* Camera Button */}
          <TouchableOpacity
            onPress={takePhoto}
            disabled={isUpdating}
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel="Take a photo"
            accessibilityHint="Double tap to take a photo with your camera"
            accessibilityState={{ disabled: isUpdating }}
            style={{
              flex: 1,
              backgroundColor: 'rgba(255, 255, 255, 0.05)',
              borderWidth: 1,
              borderColor: 'rgba(255, 255, 255, 0.1)',
              borderRadius: 12,
              paddingVertical: 14,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              opacity: isUpdating ? 0.5 : 1
            }}
          >
            <MaterialIcons name="camera-alt" size={20} color="#00D4AA" accessible={false} />
            <Text style={{
              fontSize: 14,
              fontWeight: '600',
              color: '#ffffff'
            }} accessible={false}>
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

      {/* Group Actions */}
      <View style={{
        backgroundColor: 'rgba(255, 255, 255, 0.03)',
        borderRadius: 12,
        padding: 14,
        marginBottom: 16,
        borderWidth: 0.5,
        borderColor: 'rgba(255, 255, 255, 0.08)'
      }}>
        <Text style={{
          fontSize: 14,
          fontWeight: '600',
          color: '#ffffff',
          marginBottom: 12
        }}>
          Group Actions
        </Text>

        {/* Transfer Ownership - Only visible to owner */}
        {isOwner && (
          <TouchableOpacity
            onPress={handleOpenTransferModal}
            disabled={isUpdating}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              paddingVertical: 12,
              borderBottomWidth: 0.5,
              borderBottomColor: 'rgba(255, 255, 255, 0.1)',
              opacity: isUpdating ? 0.6 : 1
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
                  name="swap-horiz"
                  size={18}
                  color="#FF8C00"
                />
              </View>
              <Text style={{
                fontSize: 15,
                fontWeight: '500',
                color: '#FF8C00'
              }}>
                Transfer Ownership
              </Text>
            </View>
            <MaterialIcons
              name="chevron-right"
              size={20}
              color="rgba(255, 140, 0, 0.6)"
            />
          </TouchableOpacity>
        )}

        {/* Leave Group */}
        <TouchableOpacity
          onPress={handleLeaveGroup}
          disabled={isUpdating}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingVertical: 12,
            borderBottomWidth: 0.5,
            borderBottomColor: 'rgba(255, 255, 255, 0.1)',
            opacity: isUpdating ? 0.6 : 1
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
                color="#EF4444"
              />
            </View>
            <Text style={{
              fontSize: 15,
              fontWeight: '500',
              color: '#EF4444'
            }}>
              {isUpdating ? 'Leaving...' : 'Leave Group'}
            </Text>
          </View>
          <MaterialIcons
            name="chevron-right"
            size={20}
            color="rgba(239, 68, 68, 0.6)"
          />
        </TouchableOpacity>

        {/* Delete Group - Owner only */}
        {isOwner && (
          <TouchableOpacity
            onPress={handleDeleteGroup}
            disabled={isUpdating}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              paddingVertical: 12,
              opacity: isUpdating ? 0.6 : 1
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
              <Text style={{
                fontSize: 15,
                fontWeight: '500',
                color: '#EF4444'
              }}>
                Delete Group
              </Text>
            </View>
            <MaterialIcons
              name="chevron-right"
              size={20}
              color="rgba(239, 68, 68, 0.6)"
            />
          </TouchableOpacity>
        )}
      </View>

      {/* Transfer Ownership Modal */}
      <Modal
        visible={showTransferModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => {
          setShowTransferModal(false);
          setShowConfirmModal(false);
          setSelectedMember(null);
        }}
      >
        <View style={{ flex: 1, backgroundColor: colors.background }}>
          {/* Compact Header */}
          <View style={{
            paddingTop: spacing.lg,
            paddingBottom: spacing.md,
            paddingHorizontal: spacing.xl,
            borderBottomWidth: 1,
            borderBottomColor: colors.border,
            backgroundColor: colors.backgroundCard,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <View style={{ flex: 1 }}>
              <Text style={{
                fontSize: fontSize.lg,
                fontWeight: fontWeight.bold,
                color: colors.textPrimary
              }}>
                Transfer Ownership
              </Text>
              <Text style={{
                fontSize: fontSize.sm,
                color: colors.textMuted,
                marginTop: spacing.xs
              }}>
                Select a member to become the new owner
              </Text>
            </View>
            <TouchableOpacity
              onPress={() => setShowTransferModal(false)}
              style={{
                width: 32,
                height: 32,
                borderRadius: 16,
                backgroundColor: colors.surfaceStrong,
                justifyContent: 'center',
                alignItems: 'center'
              }}
            >
              <MaterialIcons name="close" size={18} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          {/* Search Input */}
          <View style={{
            paddingHorizontal: spacing.xl,
            paddingVertical: spacing.lg
          }}>
            <View style={{
              backgroundColor: colors.surfaceMedium,
              borderRadius: borderRadius.lg,
              flexDirection: 'row',
              alignItems: 'center',
              paddingHorizontal: spacing.lg,
              paddingVertical: spacing.md,
              borderWidth: 1,
              borderColor: colors.borderLight
            }}>
              <MaterialIcons name="search" size={20} color={colors.textMuted} />
              <TextInput
                value={memberSearchQuery}
                onChangeText={setMemberSearchQuery}
                placeholder="Search members..."
                placeholderTextColor={colors.textDisabled}
                style={{
                  flex: 1,
                  fontSize: fontSize.md,
                  color: colors.textPrimary,
                  marginLeft: spacing.md
                }}
              />
              {memberSearchQuery.length > 0 && (
                <TouchableOpacity onPress={() => setMemberSearchQuery('')}>
                  <MaterialIcons name="clear" size={20} color={colors.textMuted} />
                </TouchableOpacity>
              )}
            </View>
          </View>

          {/* Members List */}
          {isLoadingMembers ? (
            <View style={{
              flex: 1,
              justifyContent: 'center',
              alignItems: 'center'
            }}>
              <ActivityIndicator size="large" color={colors.primary} />
              <Text style={{
                color: colors.textMuted,
                marginTop: spacing.md,
                fontSize: fontSize.sm
              }}>
                Loading members...
              </Text>
            </View>
          ) : (
            <ScrollView
              style={{ flex: 1 }}
              contentContainerStyle={{ paddingHorizontal: spacing.xl }}
              showsVerticalScrollIndicator={false}
            >
              {filteredMembers.length === 0 ? (
                <View style={{
                  flex: 1,
                  justifyContent: 'center',
                  alignItems: 'center',
                  paddingVertical: 80
                }}>
                  <View style={{
                    width: 64,
                    height: 64,
                    borderRadius: 32,
                    backgroundColor: colors.surfaceMedium,
                    justifyContent: 'center',
                    alignItems: 'center',
                    marginBottom: spacing.lg
                  }}>
                    <MaterialIcons name="people-outline" size={32} color={colors.textDisabled} />
                  </View>
                  <Text style={{
                    fontSize: fontSize.lg,
                    fontWeight: fontWeight.semibold,
                    color: colors.textSecondary,
                    marginBottom: spacing.xs
                  }}>
                    {memberSearchQuery.trim() ? 'No members found' : 'No eligible members'}
                  </Text>
                  <Text style={{
                    fontSize: fontSize.sm,
                    color: colors.textMuted,
                    textAlign: 'center'
                  }}>
                    {memberSearchQuery.trim() ? 'Try a different search term' : 'Add members to your group first'}
                  </Text>
                </View>
              ) : (
                <>
                  <Text style={{
                    fontSize: fontSize.xs,
                    fontWeight: fontWeight.semibold,
                    color: colors.textMuted,
                    textTransform: 'uppercase',
                    letterSpacing: 0.5,
                    marginBottom: spacing.md
                  }}>
                    {filteredMembers.length} Member{filteredMembers.length !== 1 ? 's' : ''}
                  </Text>

                  {filteredMembers.map((member, index) => (
                    <TouchableOpacity
                      key={member.id}
                      onPress={() => handleTransferOwnership(member)}
                      activeOpacity={0.7}
                      style={{
                        backgroundColor: colors.surfaceLight,
                        borderWidth: 1,
                        borderColor: colors.borderLight,
                        borderRadius: borderRadius.xl,
                        padding: spacing.lg,
                        marginBottom: spacing.md,
                        flexDirection: 'row',
                        alignItems: 'center'
                      }}
                    >
                      {/* Avatar */}
                      <Avatar
                        imageUrl={member.profileImageUrl}
                        username={member.displayName || member.username}
                        userId={member.id}
                        size="md"
                      />

                      {/* Member Info */}
                      <View style={{ flex: 1, marginLeft: spacing.md }}>
                        <View style={{
                          flexDirection: 'row',
                          alignItems: 'center',
                          marginBottom: 2
                        }}>
                          <Text style={{
                            fontSize: fontSize.md,
                            fontWeight: fontWeight.semibold,
                            color: colors.textPrimary
                          }}>
                            {member.displayName || member.username}
                          </Text>

                          {member.role === 'ADMIN' && (
                            <View style={{
                              backgroundColor: 'rgba(255, 215, 0, 0.15)',
                              paddingHorizontal: spacing.sm,
                              paddingVertical: 2,
                              borderRadius: borderRadius.sm,
                              marginLeft: spacing.sm
                            }}>
                              <Text style={{
                                fontSize: fontSize.xs,
                                fontWeight: fontWeight.semibold,
                                color: colors.gold
                              }}>
                                ADMIN
                              </Text>
                            </View>
                          )}
                        </View>

                        <Text style={{
                          fontSize: fontSize.sm,
                          color: colors.textMuted
                        }}>
                          @{member.username}
                        </Text>
                      </View>

                      {/* Selection Indicator */}
                      <View style={{
                        width: 24,
                        height: 24,
                        borderRadius: 12,
                        borderWidth: 2,
                        borderColor: colors.borderMedium,
                        justifyContent: 'center',
                        alignItems: 'center'
                      }}>
                        <MaterialIcons name="arrow-forward" size={14} color={colors.textMuted} />
                      </View>
                    </TouchableOpacity>
                  ))}
                </>
              )}

              {/* Bottom spacing */}
              <View style={{ height: 40 }} />
            </ScrollView>
          )}
        </View>

        {/* Confirmation Bottom Sheet */}
        {showConfirmModal && selectedMember && (
          <View style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            justifyContent: 'flex-end',
            backgroundColor: 'rgba(0, 0, 0, 0.7)'
          }}>
            <TouchableOpacity
              style={{ flex: 1 }}
              activeOpacity={1}
              onPress={() => {
                if (!isUpdating) {
                  setShowConfirmModal(false);
                  setSelectedMember(null);
                }
              }}
            />
            <View style={{
              backgroundColor: colors.backgroundCard,
              borderTopLeftRadius: borderRadius.xxl,
              borderTopRightRadius: borderRadius.xxl,
              paddingTop: spacing.lg,
              paddingHorizontal: spacing.xxl,
              paddingBottom: 40
            }}>
              {/* Drag Handle */}
              <View style={{
                alignItems: 'center',
                marginBottom: spacing.xl
              }}>
                <View style={{
                  width: 40,
                  height: 4,
                  borderRadius: 2,
                  backgroundColor: colors.borderStrong
                }} />
              </View>

              {/* Title */}
              <Text style={{
                fontSize: fontSize.lg,
                fontWeight: fontWeight.bold,
                color: colors.textPrimary,
                textAlign: 'center',
                marginBottom: spacing.sm
              }}>
                Transfer to {selectedMember.displayName || selectedMember.username}?
              </Text>

              {/* Warning */}
              <View style={{
                backgroundColor: 'rgba(239, 68, 68, 0.08)',
                padding: spacing.lg,
                borderRadius: borderRadius.lg,
                marginBottom: spacing.xxl,
                flexDirection: 'row',
                alignItems: 'flex-start',
                borderWidth: 1,
                borderColor: 'rgba(239, 68, 68, 0.2)'
              }}>
                <View style={{
                  width: 32,
                  height: 32,
                  borderRadius: 16,
                  backgroundColor: 'rgba(239, 68, 68, 0.15)',
                  justifyContent: 'center',
                  alignItems: 'center',
                  marginRight: spacing.md
                }}>
                  <MaterialIcons name="warning" size={18} color={colors.error} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{
                    fontSize: fontSize.sm,
                    fontWeight: fontWeight.semibold,
                    color: colors.error,
                    marginBottom: spacing.xs
                  }}>
                    This action cannot be undone
                  </Text>
                  <Text style={{
                    fontSize: fontSize.sm,
                    color: colors.textSecondary,
                    lineHeight: 20
                  }}>
                    You will remain as an admin but will no longer be able to transfer ownership or delete the group.
                  </Text>
                </View>
              </View>

              {/* Action Buttons */}
              <View style={{ gap: spacing.md }}>
                <TouchableOpacity
                  onPress={confirmTransferOwnership}
                  disabled={isUpdating}
                  style={{
                    backgroundColor: colors.error,
                    borderRadius: borderRadius.xl,
                    paddingVertical: spacing.lg,
                    alignItems: 'center',
                    flexDirection: 'row',
                    justifyContent: 'center',
                    opacity: isUpdating ? 0.7 : 1
                  }}
                >
                  {isUpdating ? (
                    <>
                      <ActivityIndicator size="small" color="#ffffff" style={{ marginRight: spacing.sm }} />
                      <Text style={{
                        fontSize: fontSize.md,
                        fontWeight: fontWeight.semibold,
                        color: '#ffffff'
                      }}>
                        Transferring...
                      </Text>
                    </>
                  ) : (
                    <>
                      <MaterialIcons name="check" size={20} color="#ffffff" style={{ marginRight: spacing.sm }} />
                      <Text style={{
                        fontSize: fontSize.md,
                        fontWeight: fontWeight.semibold,
                        color: '#ffffff'
                      }}>
                        Transfer Ownership
                      </Text>
                    </>
                  )}
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => {
                    setShowConfirmModal(false);
                    setSelectedMember(null);
                  }}
                  disabled={isUpdating}
                  style={{
                    backgroundColor: colors.surfaceMedium,
                    borderRadius: borderRadius.xl,
                    paddingVertical: spacing.lg,
                    alignItems: 'center',
                    opacity: isUpdating ? 0.5 : 1
                  }}
                >
                  <Text style={{
                    fontSize: fontSize.md,
                    fontWeight: fontWeight.medium,
                    color: colors.textSecondary
                  }}>
                    Cancel
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}
      </Modal>
    </View>
  );
};

export default React.memo(GroupSettingsTab);
