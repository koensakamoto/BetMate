import React from 'react';
import { View, ActivityIndicator, Text, Modal } from 'react-native';

interface LoadingOverlayProps {
  visible: boolean;
  message?: string;
  transparent?: boolean;
}

/**
 * Full-screen loading overlay
 *
 * Features:
 * - Blocks user interaction while loading
 * - Optional custom message
 * - Semi-transparent backdrop
 *
 * Usage:
 * <LoadingOverlay
 *   visible={isLoading}
 *   message="Creating your bet..."
 * />
 */
export default function LoadingOverlay({
  visible,
  message = 'Loading...',
  transparent = true
}: LoadingOverlayProps) {
  if (!visible) return null;

  return (
    <Modal
      transparent={transparent}
      visible={visible}
      animationType="fade"
    >
      <View
        style={{
          flex: 1,
          backgroundColor: 'rgba(0, 0, 0, 0.7)',
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        <View
          style={{
            backgroundColor: 'rgba(26, 26, 31, 0.95)',
            borderRadius: 20,
            padding: 32,
            alignItems: 'center',
            borderWidth: 1,
            borderColor: 'rgba(255, 255, 255, 0.1)',
            minWidth: 200,
          }}
        >
          <ActivityIndicator size="large" color="#00D4AA" />
          {message && (
            <Text
              style={{
                color: '#ffffff',
                fontSize: 16,
                fontWeight: '600',
                marginTop: 16,
                textAlign: 'center',
              }}
            >
              {message}
            </Text>
          )}
        </View>
      </View>
    </Modal>
  );
}
