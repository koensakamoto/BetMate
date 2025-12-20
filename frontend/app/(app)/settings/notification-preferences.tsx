import React, { useState, useEffect } from 'react';
import { Text, View, ScrollView, StatusBar, TouchableOpacity, Switch, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { userService } from '../../../services/user/userService';
import { NotificationPreferences } from '../../../types/api';
import { showSuccessToast, showErrorToast } from '../../../utils/toast';

const defaultPreferences: NotificationPreferences = {
  pushNotifications: true,
  emailNotifications: false,
  betResultNotifications: true,
  betCreatedNotifications: true,
  betUpdatedNotifications: true,
  betDeadlineNotifications: true,
  betResolutionReminderNotifications: true,
  betCancelledNotifications: true,
  betFulfillmentNotifications: true,
  groupInviteNotifications: true,
  groupMessageNotifications: true,
  groupMemberJoinedNotifications: true,
  groupMemberLeftNotifications: true,
  groupRoleChangedNotifications: true,
  groupJoinRequestNotifications: true,
  groupDeletedNotifications: true,
  friendNotifications: true,
  accountSecurityNotifications: true,
  systemAnnouncementNotifications: true,
  promotionNotifications: false,
};

export default function NotificationPreferencesScreen() {
  const insets = useSafeAreaInsets();
  const [preferences, setPreferences] = useState<NotificationPreferences>(defaultPreferences);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [originalPreferences, setOriginalPreferences] = useState<NotificationPreferences>(defaultPreferences);

  useEffect(() => {
    loadPreferences();
  }, []);

  const loadPreferences = async () => {
    try {
      setIsLoading(true);
      const prefs = await userService.getNotificationPreferences();
      setPreferences(prefs);
      setOriginalPreferences(prefs);
    } catch (error) {
      console.error('Failed to load notification preferences:', error);
      showErrorToast('Error', 'Failed to load notification preferences');
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggle = (key: keyof NotificationPreferences) => (value: boolean) => {
    const newPreferences = { ...preferences, [key]: value };
    setPreferences(newPreferences);
    setHasChanges(JSON.stringify(newPreferences) !== JSON.stringify(originalPreferences));
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      const updated = await userService.updateNotificationPreferences(preferences);
      setPreferences(updated);
      setOriginalPreferences(updated);
      setHasChanges(false);
      showSuccessToast('Success', 'Notification preferences saved');
    } catch (error) {
      console.error('Failed to save notification preferences:', error);
      showErrorToast('Error', 'Failed to save notification preferences');
    } finally {
      setIsSaving(false);
    }
  };

  const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
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

  const ToggleItem = ({
    title,
    description,
    value,
    onValueChange,
    icon,
    disabled = false
  }: {
    title: string;
    description: string;
    value: boolean;
    onValueChange: (value: boolean) => void;
    icon: string;
    disabled?: boolean;
  }) => (
    <View style={{
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: 12,
      borderBottomWidth: 0.5,
      borderBottomColor: 'rgba(255, 255, 255, 0.1)',
      marginBottom: 8,
      opacity: disabled ? 0.5 : 1
    }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
        <View style={{
          width: 24,
          height: 24,
          justifyContent: 'center',
          alignItems: 'center',
          marginRight: 12
        }}>
          <MaterialIcons
            name={icon as any}
            size={18}
            color="rgba(255, 255, 255, 0.8)"
          />
        </View>
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

      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{ false: 'rgba(255, 255, 255, 0.2)', true: '#00D4AA' }}
        thumbColor={value ? '#ffffff' : '#ffffff'}
        ios_backgroundColor="rgba(255, 255, 255, 0.2)"
        disabled={disabled}
      />
    </View>
  );

  if (isLoading) {
    return (
      <View style={{ flex: 1, backgroundColor: '#0a0a0f', justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#00D4AA" />
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

      <ScrollView
        style={{ flex: 1, marginTop: insets.top }}
        contentContainerStyle={{
          paddingTop: 16,
          paddingBottom: insets.bottom + 100,
          paddingHorizontal: 24
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={{
          flexDirection: 'row',
          alignItems: 'center',
          marginBottom: 48,
          paddingVertical: 8
        }}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={{
              width: 40,
              height: 40,
              borderRadius: 20,
              backgroundColor: 'rgba(255, 255, 255, 0.06)',
              justifyContent: 'center',
              alignItems: 'center',
              marginRight: 20
            }}
            activeOpacity={0.7}
          >
            <MaterialIcons
              name="arrow-back"
              size={20}
              color="rgba(255, 255, 255, 0.9)"
            />
          </TouchableOpacity>

          <View style={{ flex: 1 }}>
            <Text style={{
              fontSize: 24,
              fontWeight: '700',
              color: '#ffffff'
            }}>
              Notifications
            </Text>
            <Text style={{
              fontSize: 14,
              color: 'rgba(255, 255, 255, 0.5)',
              marginTop: 4,
              letterSpacing: 0.2
            }}>
              Customize your notification experience
            </Text>
          </View>
        </View>

        {/* General Settings */}
        <Section title="General">
          <ToggleItem
            title="Notifications"
            description="Enable notifications on your device"
            value={preferences.pushNotifications}
            onValueChange={handleToggle('pushNotifications')}
            icon="notifications"
          />
        </Section>

        {/* Betting Activity */}
        <Section title="Betting Activity">
          <ToggleItem
            title="Bet Created"
            description="New bets created in your groups"
            value={preferences.betCreatedNotifications}
            onValueChange={handleToggle('betCreatedNotifications')}
            icon="add-circle"
            disabled={!preferences.pushNotifications}
          />
          <ToggleItem
            title="Bet Updated"
            description="When bet details are modified"
            value={preferences.betUpdatedNotifications}
            onValueChange={handleToggle('betUpdatedNotifications')}
            icon="update"
            disabled={!preferences.pushNotifications}
          />
          <ToggleItem
            title="Bet Deadline Approaching"
            description="Reminders before bet deadlines"
            value={preferences.betDeadlineNotifications}
            onValueChange={handleToggle('betDeadlineNotifications')}
            icon="schedule"
            disabled={!preferences.pushNotifications}
          />
          <ToggleItem
            title="Bet Resolution Reminder"
            description="Reminders to resolve bets you created"
            value={preferences.betResolutionReminderNotifications}
            onValueChange={handleToggle('betResolutionReminderNotifications')}
            icon="gavel"
            disabled={!preferences.pushNotifications}
          />
          <ToggleItem
            title="Bet Results"
            description="When your bets are resolved"
            value={preferences.betResultNotifications}
            onValueChange={handleToggle('betResultNotifications')}
            icon="emoji-events"
            disabled={!preferences.pushNotifications}
          />
          <ToggleItem
            title="Bet Cancelled"
            description="When bets are cancelled with refund info"
            value={preferences.betCancelledNotifications}
            onValueChange={handleToggle('betCancelledNotifications')}
            icon="cancel"
            disabled={!preferences.pushNotifications}
          />
          <ToggleItem
            title="Bet Fulfillment"
            description="When users submit bet fulfillment proof"
            value={preferences.betFulfillmentNotifications}
            onValueChange={handleToggle('betFulfillmentNotifications')}
            icon="verified"
            disabled={!preferences.pushNotifications}
          />
        </Section>

        {/* Social & Groups */}
        <Section title="Social & Groups">
          <ToggleItem
            title="Group Invites"
            description="When you're invited to join a betting group"
            value={preferences.groupInviteNotifications}
            onValueChange={handleToggle('groupInviteNotifications')}
            icon="group-add"
            disabled={!preferences.pushNotifications}
          />
          <ToggleItem
            title="Group Messages"
            description="New messages in your betting groups"
            value={preferences.groupMessageNotifications}
            onValueChange={handleToggle('groupMessageNotifications')}
            icon="chat"
            disabled={!preferences.pushNotifications}
          />
          <ToggleItem
            title="Group Member Joined"
            description="When members join your groups"
            value={preferences.groupMemberJoinedNotifications}
            onValueChange={handleToggle('groupMemberJoinedNotifications')}
            icon="person-add"
            disabled={!preferences.pushNotifications}
          />
          <ToggleItem
            title="Group Member Left"
            description="When members leave your groups"
            value={preferences.groupMemberLeftNotifications}
            onValueChange={handleToggle('groupMemberLeftNotifications')}
            icon="person-remove"
            disabled={!preferences.pushNotifications}
          />
          <ToggleItem
            title="Group Role Changed"
            description="When your role in a group changes"
            value={preferences.groupRoleChangedNotifications}
            onValueChange={handleToggle('groupRoleChangedNotifications')}
            icon="admin-panel-settings"
            disabled={!preferences.pushNotifications}
          />
          <ToggleItem
            title="Group Join Requests"
            description="When users request to join your private groups"
            value={preferences.groupJoinRequestNotifications}
            onValueChange={handleToggle('groupJoinRequestNotifications')}
            icon="how-to-reg"
            disabled={!preferences.pushNotifications}
          />
          <ToggleItem
            title="Group Deleted"
            description="When groups you're in are deleted"
            value={preferences.groupDeletedNotifications}
            onValueChange={handleToggle('groupDeletedNotifications')}
            icon="delete-forever"
            disabled={!preferences.pushNotifications}
          />
          <ToggleItem
            title="Friend Requests"
            description="Friend requests and acceptances"
            value={preferences.friendNotifications}
            onValueChange={handleToggle('friendNotifications')}
            icon="people"
            disabled={!preferences.pushNotifications}
          />
        </Section>

        {/* Account & Security */}
        <Section title="Account & Security">
          <ToggleItem
            title="Account Security"
            description="Important account security updates"
            value={preferences.accountSecurityNotifications}
            onValueChange={handleToggle('accountSecurityNotifications')}
            icon="security"
            disabled={!preferences.pushNotifications}
          />
          <ToggleItem
            title="System Announcements"
            description="Important system news and maintenance notices"
            value={preferences.systemAnnouncementNotifications}
            onValueChange={handleToggle('systemAnnouncementNotifications')}
            icon="campaign"
            disabled={!preferences.pushNotifications}
          />
          <ToggleItem
            title="Promotions"
            description="Special offers and promotional content"
            value={preferences.promotionNotifications}
            onValueChange={handleToggle('promotionNotifications')}
            icon="local-offer"
            disabled={!preferences.pushNotifications}
          />
        </Section>
      </ScrollView>

      {/* Save Button */}
      {hasChanges && (
        <View style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          paddingHorizontal: 24,
          paddingTop: 16,
          paddingBottom: insets.bottom + 16,
          backgroundColor: '#0a0a0f',
          borderTopWidth: 0.5,
          borderTopColor: 'rgba(255, 255, 255, 0.1)'
        }}>
          <TouchableOpacity
            onPress={handleSave}
            disabled={isSaving}
            style={{
              backgroundColor: '#00D4AA',
              borderRadius: 12,
              paddingVertical: 16,
              alignItems: 'center',
              opacity: isSaving ? 0.7 : 1
            }}
            activeOpacity={0.8}
          >
            {isSaving ? (
              <ActivityIndicator color="#0a0a0f" />
            ) : (
              <Text style={{
                color: '#0a0a0f',
                fontSize: 16,
                fontWeight: '600'
              }}>
                Save Changes
              </Text>
            )}
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}
