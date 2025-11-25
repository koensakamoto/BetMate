import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Modal, Animated, Dimensions } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

interface BetJoinSuccessModalProps {
  visible: boolean;
  onClose: () => void;
  betTitle?: string;
  selectedOption?: string;
  amount?: number;
  isSocialBet?: boolean;
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export const BetJoinSuccessModal: React.FC<BetJoinSuccessModalProps> = ({
  visible,
  onClose,
  betTitle,
  selectedOption,
  amount,
  isSocialBet = false,
}) => {
  const translateY = useRef(new Animated.Value(-100)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      // Slide down and fade in
      Animated.parallel([
        Animated.spring(translateY, {
          toValue: 0,
          tension: 80,
          friction: 12,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();

      // Auto-dismiss after 2.5 seconds
      const timeout = setTimeout(() => {
        handleClose();
      }, 2500);

      return () => clearTimeout(timeout);
    } else {
      translateY.setValue(-100);
      opacity.setValue(0);
    }
  }, [visible]);

  const handleClose = () => {
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: -100,
        duration: 250,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onClose();
    });
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={handleClose}
    >
      <View style={styles.container}>
        <Animated.View
          style={[
            styles.toast,
            {
              transform: [{ translateY }],
              opacity,
            },
          ]}
        >
          {/* Success Icon */}
          <View style={styles.iconContainer}>
            <MaterialIcons name="check" size={18} color="#000000" />
          </View>

          {/* Content */}
          <View style={styles.content}>
            <Text style={styles.title}>You're in!</Text>

            <View style={styles.details}>
              {selectedOption && (
                <Text style={styles.detailText} numberOfLines={1}>
                  {selectedOption}
                </Text>
              )}

              {selectedOption && (isSocialBet || (amount !== undefined && amount > 0)) && (
                <View style={styles.dot} />
              )}

              {isSocialBet ? (
                <Text style={styles.detailTextMuted}>Social</Text>
              ) : amount !== undefined && amount > 0 ? (
                <Text style={styles.amount}>${amount}</Text>
              ) : null}
            </View>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    paddingTop: 60,
  },
  toast: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a1a1f',
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 16,
    minWidth: 200,
    maxWidth: SCREEN_WIDTH - 48,
    borderWidth: 1,
    borderColor: 'rgba(0, 212, 170, 0.2)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 10,
  },
  iconContainer: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#00D4AA',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  content: {
    flex: 1,
  },
  title: {
    fontSize: 15,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 2,
  },
  details: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  detailText: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.6)',
    maxWidth: 150,
  },
  detailTextMuted: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.4)',
  },
  dot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    marginHorizontal: 8,
  },
  amount: {
    fontSize: 13,
    color: '#00D4AA',
    fontWeight: '600',
  },
});
