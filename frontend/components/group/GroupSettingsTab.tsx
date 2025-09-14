import React, { useState } from 'react';
import { Text, View, TouchableOpacity, Switch, Alert, TextInput, Modal, Animated } from 'react-native';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { groupService } from '../../services/group/groupService';

interface GroupSettingsTabProps {
  groupData: {
    id: number;
    name: string;
    description: string;
    memberCount: number;
  };
  onGroupUpdated?: (updatedGroup: any) => void;
}

const GroupSettingsTab: React.FC<GroupSettingsTabProps> = ({ groupData, onGroupUpdated }) => {
  const [autoApprove, setAutoApprove] = useState(true);
  const [publicGroup, setPublicGroup] = useState(true);
  const [showEditNameModal, setShowEditNameModal] = useState(false);
  const [newGroupName, setNewGroupName] = useState(groupData.name);
  const [isUpdating, setIsUpdating] = useState(false);

  const SettingSection = ({ title, children }: { title: string; children: React.ReactNode }) => (
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
  );

  const SettingItem = ({ 
    title, 
    description, 
    onPress, 
    showSwitch = false, 
    switchValue = false, 
    onSwitchChange,
    materialIcon,
    iconColor = 'rgba(255, 255, 255, 0.8)'
  }: {
    title: string;
    description: string;
    onPress?: () => void;
    showSwitch?: boolean;
    switchValue?: boolean;
    onSwitchChange?: (value: boolean) => void;
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
  );

  const handleEditGroupName = () => {
    setNewGroupName(groupData.name);
    setShowEditNameModal(true);
  };

  const handleSaveGroupName = async () => {
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
      Alert.alert('Error', 'Failed to update group name. Please try again.');
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
          onPress={() => {}}
        />
        <SettingItem
          materialIcon="photo-camera"
          title="Group Photo"
          description="Change group profile picture"
          onPress={() => {}}
        />
      </SettingSection>

      {/* Privacy & Access */}
      <SettingSection title="Privacy & Access">
        <SettingItem
          materialIcon="public"
          title="Public Group"
          description="Anyone can find and view this group"
          showSwitch={true}
          switchValue={publicGroup}
          onSwitchChange={setPublicGroup}
        />
        <SettingItem
          materialIcon="how-to-reg"
          title="Auto-approve Members"
          description="Automatically approve join requests"
          showSwitch={true}
          switchValue={autoApprove}
          onSwitchChange={setAutoApprove}
        />
        <SettingItem
          materialIcon="link"
          title="Invite Link"
          description="Create and share invite links"
          onPress={() => {}}
        />
      </SettingSection>

      {/* Member Management */}
      <SettingSection title="Member Management">
        <SettingItem
          materialIcon="people"
          title="View All Members"
          description={`Manage ${groupData.memberCount} group members`}
          onPress={() => {}}
        />
        <SettingItem
          materialIcon="admin-panel-settings"
          title="Group Admins"
          description="Manage admin roles and permissions"
          onPress={() => {}}
        />
        <SettingItem
          materialIcon="person-add"
          title="Pending Requests"
          description="Review join requests"
          onPress={() => {}}
        />
      </SettingSection>

      {/* Notifications */}
      <SettingSection title="Notifications">
        <SettingItem
          materialIcon="notifications"
          title="Group Notifications"
          description="Manage notification preferences"
          onPress={() => {}}
        />
        <SettingItem
          materialIcon="volume-up"
          title="Chat Sounds"
          description="Enable sounds for group messages"
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
        animationType="fade"
        onRequestClose={() => setShowEditNameModal(false)}
      >
        <View style={{
          flex: 1,
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          justifyContent: 'center',
          alignItems: 'center',
          paddingHorizontal: 20
        }}>
          <View style={{
            backgroundColor: '#1a1a1f',
            borderRadius: 16,
            padding: 24,
            width: '100%',
            maxWidth: 400,
            borderWidth: 0.5,
            borderColor: 'rgba(255, 255, 255, 0.1)'
          }}>
            <Text style={{
              fontSize: 20,
              fontWeight: '600',
              color: '#ffffff',
              marginBottom: 16,
              textAlign: 'center'
            }}>
              Edit Group Name
            </Text>
            
            <TextInput
              value={newGroupName}
              onChangeText={setNewGroupName}
              placeholder="Enter new group name"
              placeholderTextColor="rgba(255, 255, 255, 0.5)"
              style={{
                backgroundColor: 'rgba(255, 255, 255, 0.05)',
                borderWidth: 1,
                borderColor: 'rgba(255, 255, 255, 0.1)',
                borderRadius: 12,
                paddingHorizontal: 16,
                paddingVertical: 12,
                fontSize: 16,
                color: '#ffffff',
                marginBottom: 20
              }}
              maxLength={50}
              editable={!isUpdating}
              autoFocus={true}
            />
            
            <View style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              gap: 12
            }}>
              <TouchableOpacity
                onPress={() => setShowEditNameModal(false)}
                disabled={isUpdating}
                style={{
                  flex: 1,
                  backgroundColor: 'rgba(255, 255, 255, 0.1)',
                  borderRadius: 12,
                  paddingVertical: 14,
                  alignItems: 'center',
                  opacity: isUpdating ? 0.5 : 1
                }}
              >
                <Text style={{
                  color: '#ffffff',
                  fontSize: 16,
                  fontWeight: '600'
                }}>
                  Cancel
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                onPress={handleSaveGroupName}
                disabled={isUpdating || !newGroupName.trim() || newGroupName.trim() === groupData.name}
                style={{
                  flex: 1,
                  backgroundColor: !newGroupName.trim() || newGroupName.trim() === groupData.name 
                    ? 'rgba(255, 255, 255, 0.1)' 
                    : '#00D4AA',
                  borderRadius: 12,
                  paddingVertical: 14,
                  alignItems: 'center',
                  opacity: isUpdating ? 0.7 : 1
                }}
              >
                <Text style={{
                  color: '#ffffff',
                  fontSize: 16,
                  fontWeight: '600'
                }}>
                  {isUpdating ? 'Saving...' : 'Save'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

export default GroupSettingsTab;