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
      paddingVertical: 20,
      alignItems: 'center'
    }}>
      {/* Back Button Row */}
      {showBackButton && (
        <View style={{
          width: '100%',
          flexDirection: 'row',
          alignItems: 'center',
          marginBottom: 20
        }}>
          <TouchableOpacity 
            onPress={onBackPress}
            style={{
              width: 40,
              height: 40,
              borderRadius: 20,
              backgroundColor: 'rgba(255, 255, 255, 0.08)',
              borderWidth: 1,
              borderColor: 'rgba(255, 255, 255, 0.15)',
              justifyContent: 'center',
              alignItems: 'center'
            }}
          >
            <MaterialIcons 
              name="arrow-back" 
              size={20} 
              color="#ffffff" 
            />
          </TouchableOpacity>
        </View>
      )}

      {/* Title */}
      <Text style={{
        fontSize: 28,
        fontWeight: '700',
        color: '#ffffff',
        textAlign: 'center',
        letterSpacing: -0.5,
        marginBottom: subtitle ? 12 : 0
      }}>
        {title}
      </Text>

      {/* Subtitle */}
      {subtitle && (
        <Text style={{
          fontSize: 16,
          color: 'rgba(255, 255, 255, 0.6)',
          textAlign: 'center',
          lineHeight: 22,
          paddingHorizontal: 20
        }}>
          {subtitle}
        </Text>
      )}
    </View>
  );
}