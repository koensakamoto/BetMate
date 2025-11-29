import React from 'react';
import { Text, TouchableOpacity, ActivityIndicator, View } from 'react-native';
import { Ionicons, AntDesign } from '@expo/vector-icons';

interface SocialAuthButtonProps {
  provider: 'google' | 'apple';
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  compact?: boolean;
}

export default function SocialAuthButton({
  provider,
  onPress,
  loading = false,
  disabled = false,
  compact = false
}: SocialAuthButtonProps) {
  const getProviderConfig = () => {
    switch (provider) {
      case 'google':
        return {
          title: compact ? 'Google' : 'Continue with Google',
          backgroundColor: 'rgba(255, 255, 255, 0.08)',
          textColor: '#ffffff',
          borderColor: 'rgba(255, 255, 255, 0.15)'
        };
      case 'apple':
        return {
          title: compact ? 'Apple' : 'Continue with Apple',
          backgroundColor: '#ffffff',
          textColor: '#000000',
          borderColor: '#ffffff'
        };
      default:
        return {
          title: 'Continue',
          backgroundColor: 'rgba(255, 255, 255, 0.08)',
          textColor: '#ffffff',
          borderColor: 'rgba(255, 255, 255, 0.15)'
        };
    }
  };

  const config = getProviderConfig();

  const renderIcon = () => {
    switch (provider) {
      case 'google':
        return <AntDesign name="google" size={18} color={config.textColor} style={{ marginRight: 12 }} />;
      case 'apple':
        return <Ionicons name="logo-apple" size={20} color={config.textColor} style={{ marginRight: 10 }} />;
      default:
        return null;
    }
  };

  return (
    <TouchableOpacity
      style={{
        backgroundColor: config.backgroundColor,
        borderWidth: 1,
        borderColor: config.borderColor,
        borderRadius: 12,
        paddingVertical: compact ? 12 : 16,
        paddingHorizontal: compact ? 12 : 20,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        opacity: (disabled || loading) ? 0.6 : 1,
        width: '100%'
      }}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.8}
    >
      {loading ? (
        <ActivityIndicator size="small" color={config.textColor} />
      ) : (
        <>
          {renderIcon()}
          <Text style={{
            fontSize: compact ? 14 : 16,
            fontWeight: '600',
            color: config.textColor,
            letterSpacing: 0.4
          }}>
            {config.title}
          </Text>
        </>
      )}
    </TouchableOpacity>
  );
}