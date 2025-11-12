import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, Animated, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

interface DoublerSuccessModalProps {
  visible: boolean;
  onClose: () => void;
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export const DoublerSuccessModal: React.FC<DoublerSuccessModalProps> = ({ visible, onClose }) => {
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (visible) {
      // Trigger haptic feedback on open
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      // Start entrance animation
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }).start();

      // Start pulse animation for the icon
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.2,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
          }),
        ])
      ).start();

      // Auto-dismiss after 5 seconds
      const timeout = setTimeout(() => {
        handleClose();
      }, 5000);

      return () => clearTimeout(timeout);
    } else {
      scaleAnim.setValue(0);
    }
  }, [visible]);

  const handleClose = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Animated.timing(scaleAnim, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true,
    }).start(() => {
      onClose();
    });
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleClose}
    >
      <View style={styles.backdrop}>
        <Animated.View
          style={[
            styles.modalContainer,
            {
              transform: [{ scale: scaleAnim }],
            },
          ]}
        >
          {/* Animated 2X Icon */}
          <Animated.View
            style={[
              styles.iconContainer,
              {
                transform: [{ scale: pulseAnim }],
              },
            ]}
          >
            <View style={styles.iconBackground}>
              <Ionicons name="flash" size={64} color="#00D4AA" />
            </View>
            <View style={styles.multiplierBadge}>
              <Text style={styles.multiplierText}>2X</Text>
            </View>
          </Animated.View>

          {/* Title */}
          <Text style={styles.title}>Daily Bonus Doubler{'\n'}Activated! 🎉</Text>

          {/* Description */}
          <Text style={styles.description}>
            Your daily login rewards will be DOUBLED for the next <Text style={styles.highlight}>14 days</Text>
          </Text>

          {/* Credits comparison */}
          <View style={styles.comparisonContainer}>
            <Text style={styles.comparisonText}>
              10 credits <Ionicons name="arrow-forward" size={16} color="#6B7280" /> <Text style={styles.doubledAmount}>20 credits</Text>
            </Text>
          </View>

          {/* Info text */}
          <Text style={styles.infoText}>
            The doubler will automatically apply each time you claim your daily reward. Make sure to log in daily to maximize value!
          </Text>

          {/* Close button */}
          <TouchableOpacity
            style={styles.button}
            onPress={handleClose}
            activeOpacity={0.8}
          >
            <Text style={styles.buttonText}>Awesome!</Text>
            <Ionicons name="checkmark-circle" size={20} color="#ffffff" />
          </TouchableOpacity>
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContainer: {
    backgroundColor: '#1a1a1f',
    borderRadius: 24,
    padding: 32,
    width: Math.min(SCREEN_WIDTH - 40, 400),
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#2a2a2f',
    shadowColor: '#00D4AA',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  iconContainer: {
    position: 'relative',
    marginBottom: 24,
  },
  iconBackground: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(0, 212, 170, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(0, 212, 170, 0.3)',
  },
  multiplierBadge: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: '#00D4AA',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderWidth: 3,
    borderColor: '#1a1a1f',
    shadowColor: '#00D4AA',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 10,
    elevation: 5,
  },
  multiplierText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 32,
  },
  description: {
    fontSize: 16,
    color: '#9CA3AF',
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 24,
  },
  highlight: {
    color: '#00D4AA',
    fontWeight: 'bold',
  },
  comparisonContainer: {
    backgroundColor: '#0a0a0f',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    width: '100%',
    borderWidth: 1,
    borderColor: '#2a2a2f',
  },
  comparisonText: {
    fontSize: 18,
    color: '#9CA3AF',
    textAlign: 'center',
    flexDirection: 'row',
    alignItems: 'center',
  },
  doubledAmount: {
    color: '#00D4AA',
    fontWeight: 'bold',
    fontSize: 20,
  },
  infoText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
  button: {
    backgroundColor: '#00D4AA',
    borderRadius: 14,
    paddingVertical: 16,
    paddingHorizontal: 32,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    width: '100%',
    justifyContent: 'center',
    shadowColor: '#00D4AA',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});
