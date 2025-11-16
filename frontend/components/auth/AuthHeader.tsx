import React from 'react';
import { Text, View, TouchableOpacity } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

interface AuthHeaderProps {
  title: string;
  subtitle?: string;
  showBackButton?: boolean;
  onBackPress?: () => void;
}

export default function AuthHeader({
  title,
  subtitle,
  showBackButton = false,
  onBackPress
}: AuthHeaderProps) {
  return (
    <View style={{
      paddingHorizontal: 20,
      paddingVertical: 12,
      alignItems: 'center'
    }}>
      {/* Back Button Row */}
      {showBackButton && (
        <View style={{
          width: '100%',
          flexDirection: 'row',
          alignItems: 'center',
          marginBottom: 14
        }}>
          <TouchableOpacity
            onPress={onBackPress}
            style={{
              width: 36,
              height: 36,
              borderRadius: 18,
              backgroundColor: 'rgba(255, 255, 255, 0.08)',
              borderWidth: 1,
              borderColor: 'rgba(255, 255, 255, 0.15)',
              justifyContent: 'center',
              alignItems: 'center'
            }}
          >
            <MaterialIcons
              name="arrow-back"
              size={18}
              color="#ffffff"
            />
          </TouchableOpacity>
        </View>
      )}

      {/* Title */}
      <Text style={{
        fontSize: 24,
        fontWeight: '700',
        color: '#ffffff',
        textAlign: 'center',
        letterSpacing: -0.5,
        marginBottom: subtitle ? 8 : 0
      }}>
        {title}
      </Text>

      {/* Subtitle */}
      {subtitle && (
        <Text style={{
          fontSize: 14,
          color: 'rgba(255, 255, 255, 0.6)',
          textAlign: 'center',
          lineHeight: 20,
          paddingHorizontal: 20
        }}>
          {subtitle}
        </Text>
      )}
    </View>
  );
}