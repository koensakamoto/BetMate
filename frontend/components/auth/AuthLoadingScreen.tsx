import React from 'react';
import { View, ActivityIndicator, Text, Image } from 'react-native';

const icon = require("../../assets/images/icon.png");

interface AuthLoadingScreenProps {
  message?: string;
}

export default function AuthLoadingScreen({ message = "Loading..." }: AuthLoadingScreenProps) {
  return (
    <View style={{
      flex: 1,
      backgroundColor: '#0a0a0f',
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 20,
    }}>
      {/* App Logo */}
      <View style={{
        marginBottom: 40,
        alignItems: 'center',
      }}>
        <Image
          source={icon}
          style={{
            width: 80,
            height: 80,
            borderRadius: 20,
            marginBottom: 16,
          }}
        />
        <Text style={{
          fontSize: 24,
          fontWeight: 'bold',
          color: '#FFFFFF',
          textAlign: 'center',
        }}>
          GroupReels
        </Text>
      </View>

      {/* Loading Indicator */}
      <ActivityIndicator
        size="large"
        color="#00D4AA"
        style={{ marginBottom: 16 }}
      />
      
      {/* Loading Message */}
      <Text style={{
        fontSize: 16,
        color: 'rgba(255, 255, 255, 0.7)',
        textAlign: 'center',
      }}>
        {message}
      </Text>
    </View>
  );
}