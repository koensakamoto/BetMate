import React from 'react';
import { Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

interface SocialAuthButtonProps {
  provider: 'google';
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
}

export default function SocialAuthButton({
  provider,
  onPress,
  loading = false,
  disabled = false
}: SocialAuthButtonProps) {
  const getProviderConfig = () => {
    switch (provider) {
      case 'google':
        return {
          title: 'Continue with Google',
          icon: 'g-translate' as keyof typeof MaterialIcons.glyphMap, // Using available icon
          backgroundColor: 'rgba(255, 255, 255, 0.08)',
          textColor: '#ffffff',
          borderColor: 'rgba(255, 255, 255, 0.15)'
        };
      default:
        return {
          title: 'Continue',
          icon: 'login' as keyof typeof MaterialIcons.glyphMap,
          backgroundColor: 'rgba(255, 255, 255, 0.08)',
          textColor: '#ffffff',
          borderColor: 'rgba(255, 255, 255, 0.15)'
        };
    }
  };

  const config = getProviderConfig();

  return (
    <TouchableOpacity
      style={{
        backgroundColor: config.backgroundColor,
        borderWidth: 1,
        borderColor: config.borderColor,
        borderRadius: 12,
        paddingVertical: 16,
        paddingHorizontal: 20,
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
          <MaterialIcons 
            name={config.icon} 
            size={18} 
            color={config.textColor}
            style={{ marginRight: 12 }}
          />
          <Text style={{
            fontSize: 16,
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