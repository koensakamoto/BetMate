import React, { useState } from 'react';
import { Text, View, TouchableOpacity, ScrollView, StatusBar, Switch } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';

export default function Settings() {
  const insets = useSafeAreaInsets();
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [emailNotifications, setEmailNotifications] = useState(false);
  const [pushNotifications, setPushNotifications] = useState(true);
  const [privateProfile, setPrivateProfile] = useState(false);

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
    icon,
    materialIcon
  }: {
    title: string;
    description: string;
    onPress?: () => void;
    showSwitch?: boolean;
    switchValue?: boolean;
    onSwitchChange?: (value: boolean) => void;
    icon?: string;
    materialIcon?: string;
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
        {(icon || materialIcon) && (
          <View style={{
            width: 24,
            height: 24,
            justifyContent: 'center',
            alignItems: 'center',
            marginRight: 12
          }}>
            {materialIcon ? (
              <MaterialIcons 
                name={materialIcon as any} 
                size={18} 
                color="rgba(255, 255, 255, 0.8)" 
              />
            ) : (
              <Text style={{ 
                fontSize: 16, 
                color: 'rgba(255, 255, 255, 0.8)',
                fontWeight: '400',
                textAlign: 'center'
              }}>{icon}</Text>
            )}
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

  return (
    <View style={{ flex: 1, backgroundColor: '#0a0a0f' }}>
      <StatusBar
        barStyle="light-content"
        backgroundColor="#0a0a0f"
        translucent={true}
      />
      
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
            Settings
          </Text>
        </View>

        {/* Account & Profile */}
        <SettingSection title="Account & Profile">
          <SettingItem
            materialIcon="person"
            title="Profile Settings"
            description="Edit your profile information"
            onPress={() => {}}
          />
          <SettingItem
            materialIcon="lock"
            title="Privacy"
            description="Control who can see your profile"
            showSwitch={true}
            switchValue={privateProfile}
            onSwitchChange={setPrivateProfile}
          />
          <SettingItem
            materialIcon="security"
            title="Account Security"
            description="Password, two-factor authentication"
            onPress={() => {}}
          />
        </SettingSection>

        {/* Notifications */}
        <SettingSection title="Notifications">
          <SettingItem
            materialIcon="notifications"
            title="Push Notifications"
            description="Receive notifications on your device"
            showSwitch={true}
            switchValue={pushNotifications}
            onSwitchChange={setPushNotifications}
          />
          <SettingItem
            materialIcon="email"
            title="Email Notifications"
            description="Get updates via email"
            showSwitch={true}
            switchValue={emailNotifications}
            onSwitchChange={setEmailNotifications}
          />
          <SettingItem
            materialIcon="tune"
            title="Notification Preferences"
            description="Choose what notifications to receive"
            onPress={() => {}}
          />
        </SettingSection>

        {/* App Settings */}
        <SettingSection title="App Settings">
          <SettingItem
            materialIcon="palette"
            title="Appearance"
            description="Theme and display options"
            onPress={() => {}}
          />
          <SettingItem
            materialIcon="language"
            title="Language"
            description="English"
            onPress={() => {}}
          />
          <SettingItem
            materialIcon="storage"
            title="Data & Storage"
            description="Manage app data usage"
            onPress={() => {}}
          />
        </SettingSection>

        {/* Support & Info */}
        <SettingSection title="Support & Info">
          <SettingItem
            materialIcon="help"
            title="Help & Support"
            description="Get help with using the app"
            onPress={() => {}}
          />
          <SettingItem
            materialIcon="description"
            title="Terms of Service"
            description="Read our terms and conditions"
            onPress={() => {}}
          />
          <SettingItem
            materialIcon="privacy-tip"
            title="Privacy Policy"
            description="Learn about data protection"
            onPress={() => {}}
          />
          <SettingItem
            materialIcon="info"
            title="About"
            description="App version 1.0.0"
            onPress={() => {}}
          />
        </SettingSection>

        {/* Sign Out */}
        <TouchableOpacity style={{
          backgroundColor: 'rgba(255, 255, 255, 0.03)',
          borderRadius: 16,
          padding: 16,
          marginBottom: 16,
          borderWidth: 0.5,
          borderColor: 'rgba(255, 255, 255, 0.08)',
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
                name="logout" 
                size={18} 
                color="#EF4444" 
              />
            </View>
            <Text style={{
              fontSize: 15,
              fontWeight: '500',
              color: '#EF4444'
            }}>
              Sign Out
            </Text>
          </View>
          <MaterialIcons 
            name="chevron-right" 
            size={20} 
            color="rgba(239, 68, 68, 0.6)" 
          />
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}