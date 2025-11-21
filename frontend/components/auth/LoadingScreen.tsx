import React, { useEffect, useRef } from 'react';
import { View, Text, Animated, Image } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const icon = require("../../assets/images/icon.png");

export default function LoadingScreen() {
  const insets = useSafeAreaInsets();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Initial fade in animation
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 100,
        friction: 8,
        useNativeDriver: true,
      }),
    ]).start();

    // Continuous rotation animation
    const rotateAnimation = Animated.loop(
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 2000,
        useNativeDriver: true,
      })
    );
    rotateAnimation.start();

    return () => rotateAnimation.stop();
  }, [fadeAnim, scaleAnim, rotateAnim]);

  const rotate = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <View style={{
      flex: 1,
      backgroundColor: '#0a0a0f',
      justifyContent: 'center',
      alignItems: 'center',
      paddingTop: insets.top,
      paddingBottom: insets.bottom
    }}>
      <Animated.View
        style={{
          opacity: fadeAnim,
          transform: [{ scale: scaleAnim }],
          alignItems: 'center'
        }}
      >
        {/* Logo */}
        <View style={{
          width: 100,
          height: 100,
          borderRadius: 25,
          backgroundColor: 'rgba(255, 255, 255, 0.08)',
          borderWidth: 1,
          borderColor: 'rgba(255, 255, 255, 0.15)',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: 32,
          shadowColor: '#00D4AA',
          shadowOffset: { width: 0, height: 8 },
          shadowOpacity: 0.1,
          shadowRadius: 16,
          elevation: 8
        }}>
          <Image 
            source={icon}
            style={{
              width: 70,
              height: 70,
              borderRadius: 18
            }}
          />
        </View>

        {/* App Name */}
        <Text style={{
          fontSize: 28,
          fontWeight: '800',
          color: '#ffffff',
          letterSpacing: -0.5,
          marginBottom: 16
        }}>
          RivalPicks
        </Text>

        {/* Loading Indicator */}
        <View style={{
          alignItems: 'center',
          marginTop: 24
        }}>
          <Animated.View
            style={{
              width: 28,
              height: 28,
              borderRadius: 14,
              borderWidth: 2.5,
              borderColor: 'transparent',
              borderTopColor: '#00D4AA',
              borderRightColor: 'rgba(0, 212, 170, 0.3)',
              transform: [{ rotate }]
            }}
          />
        </View>
      </Animated.View>
    </View>
  );
}