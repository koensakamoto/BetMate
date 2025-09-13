import React, { useState } from 'react';
import { Text, View, TouchableOpacity, Switch, Alert } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

interface GroupSettingsTabProps {
  groupData: {
    name: string;
    description: string;
    memberCount: number;
  };
}

const GroupSettingsTab: React.FC<GroupSettingsTabProps> = ({ groupData }) => {
  const [autoApprove, setAutoApprove] = useState(true);
  const [publicGroup, setPublicGroup] = useState(true);

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
          onPress={() => {}}
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
    </View>
  );
};

export default GroupSettingsTab;