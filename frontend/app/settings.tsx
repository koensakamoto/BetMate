import React, { useState } from 'react';
import { Text, View, TouchableOpacity, ScrollView, StatusBar, Switch, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { authService } from '../services/auth/authService';
import { debugLog, errorLog } from '../config/env';

export default function Settings() {
  const insets = useSafeAreaInsets();
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [isSigningOut, setIsSigningOut] = useState(false);

  const handleSignOut = async () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            try {
              setIsSigningOut(true);
              debugLog('Starting sign out process...');
              
              await authService.logout();
              debugLog('Successfully signed out');
              
              // Navigate to login screen
              router.replace('/auth/login');
              
            } catch (error) {
              errorLog('Sign out error:', error);
              Alert.alert(
                'Error',
                'Failed to sign out. Please try again.',
                [{ text: 'OK' }]
              );
            } finally {
              setIsSigningOut(false);
            }
          },
        },
      ]
    );
  };

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
          paddingTop: 20,
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
            materialIcon="security"
            title="Account & Privacy"
            description="Username, email, password, privacy settings"
            onPress={() => router.push('/account-security')}
          />
        </SettingSection>

        {/* Notifications */}
        <SettingSection title="Notifications">
          <SettingItem
            materialIcon="tune"
            title="Notification Preferences"
            description="Choose what notifications to receive"
            onPress={() => router.push('/notification-preferences')}
          />
        </SettingSection>


        {/* Support & Info */}
        <SettingSection title="Support & Info">
          <SettingItem
            materialIcon="help"
            title="Help & Support"
            description="Get help with using the app"
            onPress={() => router.push('/help-support')}
          />
          <SettingItem
            materialIcon="description"
            title="Terms of Service"
            description="Read our terms and conditions"
            onPress={() => router.push('/terms-of-service')}
          />
          <SettingItem
            materialIcon="privacy-tip"
            title="Privacy Policy"
            description="Learn about data protection"
            onPress={() => router.push('/privacy-policy')}
          />
          <SettingItem
            materialIcon="info"
            title="About"
            description="App version 1.0.0"
            onPress={() => router.push('/about')}
          />
        </SettingSection>

        {/* Sign Out */}
        <TouchableOpacity 
          onPress={handleSignOut}
          disabled={isSigningOut}
          style={{
            backgroundColor: 'rgba(255, 255, 255, 0.03)',
            borderRadius: 16,
            padding: 16,
            marginBottom: 16,
            borderWidth: 0.5,
            borderColor: 'rgba(255, 255, 255, 0.08)',
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            opacity: isSigningOut ? 0.6 : 1
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
              {isSigningOut ? 'Signing Out...' : 'Sign Out'}
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