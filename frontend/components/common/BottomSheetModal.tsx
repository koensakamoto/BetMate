import React from 'react';
import { View, Modal, TouchableOpacity, ScrollView, Dimensions, ViewStyle, KeyboardAvoidingView, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../../constants/theme';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

interface BottomSheetModalProps {
  visible: boolean;
  onClose: () => void;
  children: React.ReactNode;
  showDragHandle?: boolean;
  maxHeightRatio?: number;
  contentPadding?: number;
  scrollable?: boolean;
  bottomAction?: React.ReactNode;
}

/**
 * Reusable bottom sheet modal component
 * Provides consistent styling for modal sheets across the app
 */
export function BottomSheetModal({
  visible,
  onClose,
  children,
  showDragHandle = true,
  maxHeightRatio = 0.85,
  contentPadding = 24,
  scrollable = true,
  bottomAction
}: BottomSheetModalProps) {
  const insets = useSafeAreaInsets();
  const maxHeight = SCREEN_HEIGHT * maxHeightRatio;
  const contentMaxHeight = bottomAction ? maxHeight - 180 : maxHeight - 80;

  const contentContainerStyle: ViewStyle = {
    paddingHorizontal: contentPadding,
    paddingTop: 8,
    paddingBottom: 16
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={{
          flex: 1,
          backgroundColor: 'rgba(0, 0, 0, 0.6)',
          justifyContent: 'flex-end'
        }}>
          {/* Backdrop - tap to close */}
          <TouchableOpacity
            style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
            activeOpacity={1}
            onPress={onClose}
          />

          {/* Bottom Sheet */}
          <View style={{
            backgroundColor: colors.cardBackground,
            borderTopLeftRadius: 24,
            borderTopRightRadius: 24,
            maxHeight
          }}>
            {/* Drag Handle */}
            {showDragHandle && (
              <View style={{
                alignItems: 'center',
                paddingTop: 12,
                paddingBottom: 8
              }}>
                <View style={{
                  width: 40,
                  height: 4,
                  borderRadius: 2,
                  backgroundColor: 'rgba(255, 255, 255, 0.3)'
                }} />
              </View>
            )}

            {/* Content */}
            {scrollable ? (
              <ScrollView
                style={{ maxHeight: contentMaxHeight }}
                contentContainerStyle={contentContainerStyle}
                showsVerticalScrollIndicator={false}
                bounces={true}
                keyboardShouldPersistTaps="handled"
              >
                {children}
              </ScrollView>
            ) : (
              <View style={[contentContainerStyle, { maxHeight: contentMaxHeight }]}>
                {children}
              </View>
            )}

            {/* Bottom Action Bar */}
            {bottomAction && (
              <View style={{
                padding: 24,
                paddingBottom: Math.max(24, insets.bottom),
                borderTopWidth: 1,
                borderTopColor: colors.border
              }}>
                {bottomAction}
              </View>
            )}
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

export default BottomSheetModal;
