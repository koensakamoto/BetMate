import React, { useEffect, useRef } from 'react';
import { Text, View, Animated } from 'react-native';

interface TypingIndicatorProps {
  typingUsers: string[];
  maxDisplay?: number;
}

function TypingIndicator({
  typingUsers,
  maxDisplay = 3
}: TypingIndicatorProps) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const dot1 = useRef(new Animated.Value(0)).current;
  const dot2 = useRef(new Animated.Value(0)).current;
  const dot3 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (typingUsers.length > 0) {
      // Fade in
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true
      }).start();

      // Animate dots
      const animateDots = () => {
        Animated.sequence([
          Animated.timing(dot1, { toValue: 1, duration: 400, useNativeDriver: true }),
          Animated.timing(dot2, { toValue: 1, duration: 400, useNativeDriver: true }),
          Animated.timing(dot3, { toValue: 1, duration: 400, useNativeDriver: true }),
          Animated.timing(dot1, { toValue: 0, duration: 400, useNativeDriver: true }),
          Animated.timing(dot2, { toValue: 0, duration: 400, useNativeDriver: true }),
          Animated.timing(dot3, { toValue: 0, duration: 400, useNativeDriver: true })
        ]).start(() => {
          if (typingUsers.length > 0) {
            animateDots();
          }
        });
      };

      animateDots();
    } else {
      // Fade out
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true
      }).start();
    }
  }, [typingUsers.length]);

  if (typingUsers.length === 0) {
    return null;
  }

  const getTypingText = (): string => {
    const displayUsers = typingUsers.slice(0, maxDisplay);
    const remainingCount = typingUsers.length - maxDisplay;

    if (displayUsers.length === 1) {
      return `${displayUsers[0]} is typing`;
    } else if (displayUsers.length === 2) {
      return `${displayUsers[0]} and ${displayUsers[1]} are typing`;
    } else if (displayUsers.length === 3 && remainingCount === 0) {
      return `${displayUsers[0]}, ${displayUsers[1]}, and ${displayUsers[2]} are typing`;
    } else {
      const othersText = remainingCount > 0 ? ` and ${remainingCount} other${remainingCount === 1 ? '' : 's'}` : '';
      return `${displayUsers.slice(0, -1).join(', ')}, ${displayUsers[displayUsers.length - 1]}${othersText} are typing`;
    }
  };

  return (
    <Animated.View
      style={{
        opacity: fadeAnim,
        paddingHorizontal: 20,
        paddingVertical: 8
      }}
    >
      <View style={{
        flexDirection: 'row',
        alignItems: 'center'
      }}>
        <Text style={{
          color: '#8b8b8b',
          fontSize: 14,
          fontStyle: 'italic'
        }}>
          {getTypingText()}
        </Text>
        
        {/* Animated dots */}
        <View style={{
          flexDirection: 'row',
          marginLeft: 6,
          alignItems: 'center'
        }}>
          <Animated.View
            style={{
              width: 4,
              height: 4,
              borderRadius: 2,
              backgroundColor: '#8b8b8b',
              opacity: dot1,
              marginHorizontal: 1
            }}
          />
          <Animated.View
            style={{
              width: 4,
              height: 4,
              borderRadius: 2,
              backgroundColor: '#8b8b8b',
              opacity: dot2,
              marginHorizontal: 1
            }}
          />
          <Animated.View
            style={{
              width: 4,
              height: 4,
              borderRadius: 2,
              backgroundColor: '#8b8b8b',
              opacity: dot3,
              marginHorizontal: 1
            }}
          />
        </View>
      </View>
    </Animated.View>
  );
}

export default React.memo(TypingIndicator);