import React, { useState } from 'react';
import { Text, View, ScrollView, StatusBar, TouchableOpacity, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { userService } from '../services/user/userService';
import { debugLog, errorLog } from '../config/env';
import { File, Paths } from 'expo-file-system/next';
import * as Sharing from 'expo-sharing';

export default function AccountSecurity() {
  const insets = useSafeAreaInsets();
  const [isExportingData, setIsExportingData] = useState(false);

  const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <View style={{ marginBottom: 32 }}>
      <Text style={{
        fontSize: 16,
        fontWeight: '600',
        color: '#ffffff',
        marginBottom: 16,
        marginLeft: 4
      }}>
        {title}
      </Text>
      <View style={{
        backgroundColor: 'rgba(255, 255, 255, 0.03)',
        borderRadius: 12,
        borderWidth: 0.5,
        borderColor: 'rgba(255, 255, 255, 0.08)'
      }}>
        {children}
      </View>
    </View>
  );

  const SecurityItem = ({ 
    title, 
    description, 
    onPress, 
    icon,
    showStatus = false,
    status = '',
    statusColor = '#00D4AA',
    isLast = false
  }: {
    title: string;
    description: string;
    onPress: () => void;
    icon: string;
    showStatus?: boolean;
    status?: string;
    statusColor?: string;
    isLast?: boolean;
  }) => (
    <TouchableOpacity 
      onPress={onPress}
      style={{
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 16,
        borderBottomWidth: isLast ? 0 : 0.5,
        borderBottomColor: 'rgba(255, 255, 255, 0.08)'
      }}
      activeOpacity={0.7}
    >
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
            color="rgba(255, 255, 255, 0.7)" 
          />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{
            fontSize: 15,
            color: '#ffffff',
            marginBottom: showStatus ? 4 : 2
          }}>
            {title}
          </Text>
          <Text style={{
            fontSize: 13,
            color: 'rgba(255, 255, 255, 0.6)'
          }}>
            {description}
          </Text>
          {showStatus && (
            <Text style={{
              fontSize: 12,
              color: statusColor,
              marginTop: 4,
              fontWeight: '500'
            }}>
              {status}
            </Text>
          )}
        </View>
      </View>
      
      <MaterialIcons 
        name="chevron-right" 
        size={18} 
        color="rgba(255, 255, 255, 0.3)" 
      />
    </TouchableOpacity>
  );

  const handleChangePassword = () => {
    router.push('/change-password');
  };

  const handleTwoFactor = () => {
    Alert.alert(
      'Two-Factor Authentication',
      'Set up 2FA to add an extra layer of security to your account.',
      [{ text: 'OK' }]
    );
  };

  const handleLoginActivity = () => {
    Alert.alert(
      'Login Activity',
      'View your recent login sessions and device history.',
      [{ text: 'OK' }]
    );
  };

  const handleAccountRecovery = () => {
    Alert.alert(
      'Account Recovery',
      'Set up recovery options in case you lose access to your account.',
      [{ text: 'OK' }]
    );
  };

  const handleDataDownload = () => {
    Alert.alert(
      'Download Your Data',
      'This will export all your personal data including profile, bets, transactions, and more as a JSON file.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Download',
          onPress: async () => {
            try {
              setIsExportingData(true);
              debugLog('Starting data export...');

              // Get the JSON data from the API
              const jsonData = await userService.exportUserData();

              // Create a filename with timestamp
              const timestamp = new Date().toISOString().split('T')[0];
              const filename = `betmate-data-${timestamp}.json`;

              // Use new expo-file-system API
              const file = new File(Paths.cache, filename);
              await file.write(jsonData);

              debugLog('Data exported to file:', file.uri);

              // Check if sharing is available
              const isAvailable = await Sharing.isAvailableAsync();
              if (isAvailable) {
                await Sharing.shareAsync(file.uri, {
                  mimeType: 'application/json',
                  dialogTitle: 'Save your BetMate data',
                  UTI: 'public.json',
                });
              } else {
                Alert.alert(
                  'Success',
                  `Your data has been saved to: ${filename}`,
                  [{ text: 'OK' }]
                );
              }

            } catch (error) {
              errorLog('Data export error:', error);
              Alert.alert(
                'Error',
                'Failed to export your data. Please try again.',
                [{ text: 'OK' }]
              );
            } finally {
              setIsExportingData(false);
            }
          },
        },
      ]
    );
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'This action cannot be undone. Are you sure you want to permanently delete your account?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: () => {
            Alert.alert(
              'Account Deletion',
              'Please contact support to proceed with account deletion.',
              [{ text: 'OK' }]
            );
          }
        }
      ]
    );
  };

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
          paddingBottom: insets.bottom + 40,
          paddingHorizontal: 24
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={{
          flexDirection: 'row',
          alignItems: 'center',
          marginBottom: 40,
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
              Account Security
            </Text>
            <Text style={{
              fontSize: 14,
              color: 'rgba(255, 255, 255, 0.5)',
              marginTop: 4
            }}>
              Protect your account and data
            </Text>
          </View>
        </View>

        {/* Password & Authentication */}
        <Section title="Password & Authentication">
          <SecurityItem
            title="Change Password"
            description="Update your account password"
            onPress={handleChangePassword}
            icon="lock"
          />
          <SecurityItem
            title="Two-Factor Authentication"
            description="Add an extra layer of security"
            onPress={handleTwoFactor}
            icon="verified-user"
            showStatus={true}
            status="Not enabled"
            statusColor="#EF4444"
            isLast={true}
          />
        </Section>

        {/* Account Activity */}
        <Section title="Account Activity">
          <SecurityItem
            title="Login Activity"
            description="Recent logins and active sessions"
            onPress={handleLoginActivity}
            icon="history"
          />
          <SecurityItem
            title="Account Recovery"
            description="Set up recovery email and phone"
            onPress={handleAccountRecovery}
            icon="restore"
            showStatus={true}
            status="Email verified"
            statusColor="#00D4AA"
            isLast={true}
          />
        </Section>

        {/* Data & Privacy */}
        <Section title="Data & Privacy">
          <SecurityItem
            title={isExportingData ? "Exporting Data..." : "Download Your Data"}
            description="Get a copy of your account information"
            onPress={isExportingData ? () => {} : handleDataDownload}
            icon="download"
            isLast={true}
          />
        </Section>

        {/* Delete Account */}
        <TouchableOpacity 
          onPress={handleDeleteAccount}
          style={{
            backgroundColor: 'rgba(255, 255, 255, 0.03)',
            borderRadius: 16,
            padding: 16,
            marginTop: 24,
            borderWidth: 0.5,
            borderColor: 'rgba(255, 255, 255, 0.08)',
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}
          activeOpacity={0.7}
        >
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
              Delete Account
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