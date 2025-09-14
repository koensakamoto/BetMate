import React, { useState } from 'react';
import { Text, View, ScrollView, StatusBar, TouchableOpacity, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';

export default function AccountSecurity() {
  const insets = useSafeAreaInsets();
  const [isLoading, setIsLoading] = useState(false);

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

  const SecurityItem = ({ 
    title, 
    description, 
    onPress, 
    icon,
    showStatus = false,
    status = '',
    statusColor = '#00D4AA'
  }: {
    title: string;
    description: string;
    onPress: () => void;
    icon: string;
    showStatus?: boolean;
    status?: string;
    statusColor?: string;
  }) => (
    <TouchableOpacity 
      onPress={onPress}
      style={{
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 12,
        borderBottomWidth: 0.5,
        borderBottomColor: 'rgba(255, 255, 255, 0.1)',
        marginBottom: 8
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
        size={20} 
        color="rgba(255, 255, 255, 0.4)" 
      />
    </TouchableOpacity>
  );

  const handleChangePassword = () => {
    Alert.alert(
      'Change Password',
      'You will be redirected to change your password.',
      [{ text: 'OK' }]
    );
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
      'Download Data',
      'Request a copy of your account data and betting history.',
      [{ text: 'OK' }]
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
      
      <ScrollView 
        style={{ flex: 1 }}
        contentContainerStyle={{ 
          paddingTop: insets.top + 16,
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
            showStatus={true}
            status="Last changed 3 months ago"
            statusColor="rgba(255, 255, 255, 0.5)"
          />
          <SecurityItem
            title="Two-Factor Authentication"
            description="Add an extra layer of security"
            onPress={handleTwoFactor}
            icon="verified-user"
            showStatus={true}
            status="Not enabled"
            statusColor="#EF4444"
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
          />
        </Section>

        {/* Data & Privacy */}
        <Section title="Data & Privacy">
          <SecurityItem
            title="Download Your Data"
            description="Get a copy of your account information"
            onPress={handleDataDownload}
            icon="download"
          />
          <SecurityItem
            title="Privacy Settings"
            description="Control who can see your profile"
            onPress={() => router.back()}
            icon="privacy-tip"
          />
        </Section>

        {/* Danger Zone */}
        <Section title="Danger Zone">
          <TouchableOpacity 
            onPress={handleDeleteAccount}
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
              paddingVertical: 12,
              borderBottomWidth: 0.5,
              borderBottomColor: 'rgba(239, 68, 68, 0.2)',
              marginBottom: 8
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
                  name="delete-forever" 
                  size={18} 
                  color="#EF4444" 
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{
                  fontSize: 15,
                  color: '#EF4444',
                  marginBottom: 2
                }}>
                  Delete Account
                </Text>
                <Text style={{
                  fontSize: 13,
                  color: 'rgba(239, 68, 68, 0.7)'
                }}>
                  Permanently delete your account and data
                </Text>
              </View>
            </View>
            
            <MaterialIcons 
              name="chevron-right" 
              size={20} 
              color="rgba(239, 68, 68, 0.6)" 
            />
          </TouchableOpacity>
        </Section>

        {/* Security Tips */}
        <View style={{
          backgroundColor: 'rgba(255, 255, 255, 0.02)',
          borderRadius: 12,
          padding: 20,
          marginTop: 20,
          borderWidth: 1,
          borderColor: 'rgba(255, 255, 255, 0.05)'
        }}>
          <View style={{
            flexDirection: 'row',
            alignItems: 'center',
            marginBottom: 12
          }}>
            <MaterialIcons 
              name="security" 
              size={18} 
              color="rgba(255, 255, 255, 0.7)" 
            />
            <Text style={{
              fontSize: 15,
              fontWeight: '600',
              color: '#ffffff',
              marginLeft: 8
            }}>
              Security Tips
            </Text>
          </View>
          <Text style={{
            fontSize: 14,
            color: 'rgba(255, 255, 255, 0.7)',
            lineHeight: 20
          }}>
            • Use a strong, unique password for your account{'\n'}
            • Enable two-factor authentication for extra security{'\n'}
            • Never share your login credentials with others{'\n'}
            • Log out from shared or public devices
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}