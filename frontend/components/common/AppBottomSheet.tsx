import React, { useCallback, useEffect, useRef, forwardRef, useImperativeHandle } from 'react';
import { View, ViewStyle } from 'react-native';
import {
  BottomSheetModal,
  BottomSheetScrollView,
  BottomSheetBackdrop,
  BottomSheetBackdropProps,
} from '@gorhom/bottom-sheet';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../../constants/theme';

export interface AppBottomSheetRef {
  present: () => void;
  dismiss: () => void;
}

export interface AppBottomSheetProps {
  /** Declarative control - syncs with present/dismiss */
  visible?: boolean;
  /** Called when sheet is closed */
  onClose: () => void;
  /** Called when sheet is presented (useful for resetting state) */
  onPresent?: () => void;
  /** Content to render inside the sheet */
  children: React.ReactNode;
  /** Snap points for the sheet. Default: ['85%'] */
  snapPoints?: (string | number)[];
  /** Whether content should be scrollable. Default: true */
  scrollable?: boolean;
  /** Sticky bottom action bar */
  bottomAction?: React.ReactNode;
  /** Style for the content container */
  contentContainerStyle?: ViewStyle;
  /** Backdrop opacity. Default: 0.5 */
  backdropOpacity?: number;
  /** Enable pan down to close. Default: true */
  enablePanDownToClose?: boolean;
  /** Enable dynamic sizing based on content. Default: false */
  enableDynamicSizing?: boolean;
}

/**
 * Unified bottom sheet component using @gorhom/bottom-sheet
 * Supports both declarative (visible prop) and imperative (ref) APIs
 */
const AppBottomSheet = forwardRef<AppBottomSheetRef, AppBottomSheetProps>(({
  visible,
  onClose,
  onPresent,
  children,
  snapPoints = ['85%'],
  scrollable = true,
  bottomAction,
  contentContainerStyle,
  backdropOpacity = 0.5,
  enablePanDownToClose = true,
  enableDynamicSizing = false,
}, ref) => {
  const bottomSheetRef = useRef<BottomSheetModal>(null);
  const insets = useSafeAreaInsets();

  // Expose present/dismiss methods to parent
  useImperativeHandle(ref, () => ({
    present: () => {
      onPresent?.();
      bottomSheetRef.current?.present();
    },
    dismiss: () => {
      bottomSheetRef.current?.dismiss();
    }
  }), [onPresent]);

  // Sync visible prop with present/dismiss
  useEffect(() => {
    if (visible === undefined) return;

    if (visible) {
      onPresent?.();
      bottomSheetRef.current?.present();
    } else {
      bottomSheetRef.current?.dismiss();
    }
  }, [visible, onPresent]);

  const handleSheetChanges = useCallback((index: number) => {
    if (index === -1) {
      onClose();
    }
  }, [onClose]);

  const renderBackdrop = useCallback(
    (props: BottomSheetBackdropProps) => (
      <BottomSheetBackdrop
        {...props}
        disappearsOnIndex={-1}
        appearsOnIndex={0}
        opacity={backdropOpacity}
      />
    ),
    [backdropOpacity]
  );

  const defaultContentStyle: ViewStyle = {
    paddingHorizontal: 24,
    paddingTop: 8,
    paddingBottom: 16,
    ...contentContainerStyle,
  };

  const content = scrollable ? (
    <BottomSheetScrollView
      style={{ flex: 1 }}
      contentContainerStyle={defaultContentStyle}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
      {children}
    </BottomSheetScrollView>
  ) : (
    <View style={[{ flex: 1 }, defaultContentStyle]}>
      {children}
    </View>
  );

  return (
    <BottomSheetModal
      ref={bottomSheetRef}
      snapPoints={enableDynamicSizing ? undefined : snapPoints}
      enableDynamicSizing={enableDynamicSizing}
      onChange={handleSheetChanges}
      backdropComponent={renderBackdrop}
      enablePanDownToClose={enablePanDownToClose}
      backgroundStyle={{
        backgroundColor: colors.cardBackground,
      }}
      handleIndicatorStyle={{
        backgroundColor: colors.borderStrong,
        width: 40,
      }}
      android_keyboardInputMode="adjustResize"
    >
      <View style={{ flex: 1 }}>
        {content}

        {/* Bottom Action Bar */}
        {bottomAction && (
          <View style={{
            paddingHorizontal: 24,
            paddingTop: 16,
            paddingBottom: Math.max(insets.bottom, 16),
            borderTopWidth: 1,
            borderTopColor: colors.border,
            backgroundColor: colors.cardBackground,
          }}>
            {bottomAction}
          </View>
        )}
      </View>
    </BottomSheetModal>
  );
});

AppBottomSheet.displayName = 'AppBottomSheet';

export default AppBottomSheet;

// Re-export BottomSheet components for consumers that need them
export { BottomSheetTextInput, BottomSheetScrollView } from '@gorhom/bottom-sheet';
