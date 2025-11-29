import React, { useState } from 'react';
import { Text, View, ScrollView, StatusBar, TouchableOpacity, Switch } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';

export default function NotificationPreferences() {
  const insets = useSafeAreaInsets();

  // Notification preferences state
  // General
  const [pushNotifications, setPushNotifications] = useState(true);
  const [emailNotifications, setEmailNotifications] = useState(false);

  // Betting Activity
  const [betCreated, setBetCreated] = useState(true);
  const [betUpdates, setBetUpdates] = useState(true);
  const [betDeadline, setBetDeadline] = useState(true);
  const [betResolutionReminder, setBetResolutionReminder] = useState(true);
  const [betResults, setBetResults] = useState(true);
  const [betCancelled, setBetCancelled] = useState(true);

  // Social & Groups
  const [groupInvites, setGroupInvites] = useState(true);
  const [groupMessages, setGroupMessages] = useState(true);
  const [groupMemberJoined, setGroupMemberJoined] = useState(true);
  const [groupMemberLeft, setGroupMemberLeft] = useState(true);
  const [groupRoleChanged, setGroupRoleChanged] = useState(true);

  // Account & Security
  const [accountSecurity, setAccountSecurity] = useState(true);
  const [promotions, setPromotions] = useState(false);

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
    icon
  }: {
    title: string;
    description: string;
    value: boolean;
    onValueChange: (value: boolean) => void;
    icon: string;
  }) => (
    <View style={{
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: 12,
      borderBottomWidth: 0.5,
      borderBottomColor: 'rgba(255, 255, 255, 0.1)',
      marginBottom: 8
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
      />
    </View>
  );

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
          paddingBottom: insets.bottom + 60,
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
          
          <View>
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
            title="Push Notifications"
            description="Enable notifications on your device"
            value={pushNotifications}
            onValueChange={setPushNotifications}
            icon="notifications"
          />
          <ToggleItem
            title="Email Notifications"
            description="Receive notifications via email"
            value={emailNotifications}
            onValueChange={setEmailNotifications}
            icon="email"
          />
        </Section>

        {/* Betting Activity */}
        <Section title="Betting Activity">
          <ToggleItem
            title="Bet Created"
            description="New bets created in your groups"
            value={betCreated}
            onValueChange={setBetCreated}
            icon="add-circle"
          />
          <ToggleItem
            title="Bet Updated"
            description="When bet details are modified"
            value={betUpdates}
            onValueChange={setBetUpdates}
            icon="update"
          />
          <ToggleItem
            title="Bet Deadline Approaching"
            description="Reminders before bet deadlines"
            value={betDeadline}
            onValueChange={setBetDeadline}
            icon="schedule"
          />
          <ToggleItem
            title="Bet Resolution Reminder"
            description="Reminders to resolve bets you created"
            value={betResolutionReminder}
            onValueChange={setBetResolutionReminder}
            icon="gavel"
          />
          <ToggleItem
            title="Bet Results"
            description="When your bets are resolved"
            value={betResults}
            onValueChange={setBetResults}
            icon="emoji-events"
          />
          <ToggleItem
            title="Bet Cancelled"
            description="When bets are cancelled with refund info"
            value={betCancelled}
            onValueChange={setBetCancelled}
            icon="cancel"
          />
        </Section>

        {/* Social & Groups */}
        <Section title="Social & Groups">
          <ToggleItem
            title="Group Invites"
            description="When you're invited to join a betting group"
            value={groupInvites}
            onValueChange={setGroupInvites}
            icon="group-add"
          />
          <ToggleItem
            title="Group Messages"
            description="New messages in your betting groups"
            value={groupMessages}
            onValueChange={setGroupMessages}
            icon="chat"
          />
          <ToggleItem
            title="Group Member Joined"
            description="When members join your groups"
            value={groupMemberJoined}
            onValueChange={setGroupMemberJoined}
            icon="person-add"
          />
          <ToggleItem
            title="Group Member Left"
            description="When members leave your groups"
            value={groupMemberLeft}
            onValueChange={setGroupMemberLeft}
            icon="person-remove"
          />
          <ToggleItem
            title="Group Role Changed"
            description="When your role in a group changes"
            value={groupRoleChanged}
            onValueChange={setGroupRoleChanged}
            icon="admin-panel-settings"
          />
        </Section>

        {/* Account & Security */}
        <Section title="Account & Security">
          <ToggleItem
            title="Account Security"
            description="Important account security updates"
            value={accountSecurity}
            onValueChange={setAccountSecurity}
            icon="security"
          />
          <ToggleItem
            title="Promotions"
            description="Special offers and promotional content"
            value={promotions}
            onValueChange={setPromotions}
            icon="local-offer"
          />
        </Section>
      </ScrollView>
    </View>
  );
}