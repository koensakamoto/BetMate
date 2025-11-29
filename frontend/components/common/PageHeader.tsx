import React from 'react';
import { View, Text, TouchableOpacity, Image, ImageSourcePropType } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Avatar } from './Avatar';
import { colors } from '../../constants/theme';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  onBack?: () => void;
  backPath?: string;
  rightAction?: React.ReactNode;
  avatar?: {
    imageUrl?: string;
    name?: string;
    userId?: number;
  };
  showBackButton?: boolean;
  centerContent?: boolean;
}

/**
 * Reusable page header component with back button, title, and optional right action
 */
export function PageHeader({
  title,
  subtitle,
  onBack,
  backPath,
  rightAction,
  avatar,
  showBackButton = true,
  centerContent = true
}: PageHeaderProps) {
  const insets = useSafeAreaInsets();

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else if (backPath) {
      router.dismissAll();
      router.navigate(backPath as any);
    } else {
      router.back();
    }
  };

  // Get initials from name
  const getInitials = (name?: string): string => {
    if (!name) return '?';
    const words = name.trim().split(' ');
    if (words.length >= 2) {
      return (words[0][0] + words[1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  return (
    <View style={{ paddingTop: insets.top + 8, paddingHorizontal: 20, marginBottom: 12 }}>
      <View style={{
        flexDirection: 'row',
        alignItems: 'center'
      }}>
        {/* Back Button */}
        {showBackButton && (
          <TouchableOpacity
            onPress={handleBack}
            style={{
              width: 36,
              height: 36,
              borderRadius: 18,
              backgroundColor: 'rgba(255, 255, 255, 0.08)',
              justifyContent: 'center',
              alignItems: 'center'
            }}
          >
            <MaterialIcons name="arrow-back" size={16} color={colors.textPrimary} />
          </TouchableOpacity>
        )}

        {/* Center Content */}
        <View style={{
          flex: 1,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: centerContent ? 'center' : 'flex-start',
          marginLeft: centerContent ? 0 : 12
        }}>
          {/* Avatar */}
          {avatar && (
            avatar.imageUrl ? (
              <Image
                source={{ uri: avatar.imageUrl }}
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 10,
                  marginRight: 12
                }}
              />
            ) : avatar.name ? (
              <View style={{
                width: 36,
                height: 36,
                borderRadius: 10,
                marginRight: 12,
                backgroundColor: 'rgba(0, 212, 170, 0.2)',
                justifyContent: 'center',
                alignItems: 'center'
              }}>
                <Text style={{
                  fontSize: 14,
                  fontWeight: '700',
                  color: colors.primary
                }}>
                  {getInitials(avatar.name)}
                </Text>
              </View>
            ) : null
          )}

          {/* Title and Subtitle */}
          <View>
            <Text style={{
              fontSize: 18,
              fontWeight: '700',
              color: colors.textPrimary
            }}>
              {title}
            </Text>
            {subtitle && (
              <Text style={{
                fontSize: 13,
                color: colors.textSecondary,
                marginTop: 2
              }}>
                {subtitle}
              </Text>
            )}
          </View>
        </View>

        {/* Right Action */}
        {rightAction ? (
          rightAction
        ) : showBackButton ? (
          // Placeholder for alignment when no right action
          <View style={{ width: 36 }} />
        ) : null}
      </View>
    </View>
  );
}

/**
 * Standard icon button for use in PageHeader rightAction
 */
export function HeaderIconButton({
  icon,
  onPress,
  showBorder = false
}: {
  icon: keyof typeof MaterialIcons.glyphMap;
  onPress: () => void;
  showBorder?: boolean;
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={{
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: 'rgba(255, 255, 255, 0.08)',
        justifyContent: 'center',
        alignItems: 'center',
        ...(showBorder && {
          borderWidth: 0.5,
          borderColor: 'rgba(255, 255, 255, 0.15)'
        })
      }}
    >
      <MaterialIcons name={icon} size={16} color={colors.textPrimary} />
    </TouchableOpacity>
  );
}

export default PageHeader;
