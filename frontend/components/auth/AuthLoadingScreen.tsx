import React from 'react';
import { View, Image } from 'react-native';

const logo = require("../../assets/images/adaptive-icon.png");

interface AuthLoadingScreenProps {
  message?: string;
}

export default function AuthLoadingScreen({ message = "Loading..." }: AuthLoadingScreenProps) {
  // This screen matches the splash screen exactly for a seamless transition
  return (
    <View style={{
      flex: 1,
      backgroundColor: '#0a0a0f',
      alignItems: 'center',
      justifyContent: 'center',
    }}>
      <Image
        source={logo}
        style={{
          width: 200,
          height: 200,
        }}
      />
    </View>
  );
}