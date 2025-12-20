import React, { useEffect, useRef } from 'react';
import { View, Animated, ViewStyle, DimensionValue } from 'react-native';
import { colors } from '../../constants/theme';

interface SkeletonCardProps {
  width?: DimensionValue;
  height?: DimensionValue;
  borderRadius?: number;
  style?: ViewStyle;
}

/**
 * Skeleton placeholder component with shimmer animation
 *
 * Usage:
 * <SkeletonCard width="100%" height={120} borderRadius={16} />
 */
export function SkeletonCard({
  width = '100%',
  height = 100,
  borderRadius = 12,
  style
}: SkeletonCardProps) {
  const animatedValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(animatedValue, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(animatedValue, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    );
    animation.start();

    return () => animation.stop();
  }, [animatedValue]);

  const opacity = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.7],
  });

  return (
    <Animated.View
      style={[
        {
          width,
          height,
          borderRadius,
          backgroundColor: colors.border,
          opacity,
        },
        style,
      ]}
    />
  );
}

/**
 * Skeleton for Bet Card
 */
export function SkeletonBetCard() {
  return (
    <View
      style={{
        backgroundColor: colors.surfaceLight,
        borderRadius: 16,
        padding: 16,
        marginBottom: 16,
        borderWidth: 0.5,
        borderColor: colors.surfaceStrong,
      }}
    >
      {/* Header */}
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 }}>
        <SkeletonCard width={120} height={20} borderRadius={8} />
        <SkeletonCard width={60} height={20} borderRadius={8} />
      </View>

      {/* Title */}
      <SkeletonCard width="80%" height={24} borderRadius={8} style={{ marginBottom: 8 }} />

      {/* Description */}
      <SkeletonCard width="100%" height={16} borderRadius={8} style={{ marginBottom: 4 }} />
      <SkeletonCard width="60%" height={16} borderRadius={8} style={{ marginBottom: 12 }} />

      {/* Footer */}
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <SkeletonCard width={80} height={16} borderRadius={8} />
        <SkeletonCard width={100} height={32} borderRadius={16} />
      </View>
    </View>
  );
}

/**
 * Skeleton for Group Card
 */
export function SkeletonGroupCard() {
  return (
    <View
      style={{
        width: '48%',
        backgroundColor: colors.surfaceLight,
        borderRadius: 16,
        padding: 16,
        marginBottom: 16,
        borderWidth: 0.5,
        borderColor: colors.surfaceStrong,
      }}
    >
      {/* Icon */}
      <SkeletonCard width={48} height={48} borderRadius={24} style={{ marginBottom: 12 }} />

      {/* Title */}
      <SkeletonCard width="100%" height={20} borderRadius={8} style={{ marginBottom: 8 }} />

      {/* Stats */}
      <View style={{ flexDirection: 'row', gap: 8 }}>
        <SkeletonCard width={60} height={16} borderRadius={8} />
        <SkeletonCard width={60} height={16} borderRadius={8} />
      </View>
    </View>
  );
}

/**
 * Skeleton for Store Item Card
 */
export function SkeletonStoreItem() {
  return (
    <View
      style={{
        width: '48%',
        backgroundColor: colors.surfaceLight,
        borderRadius: 16,
        padding: 14,
        marginBottom: 16,
        borderWidth: 0.5,
        borderColor: colors.surfaceStrong,
        height: 240
      }}
    >
      {/* Icon */}
      <View style={{ alignItems: 'center', marginBottom: 16 }}>
        <SkeletonCard width={72} height={72} borderRadius={18} />
      </View>

      {/* Title */}
      <SkeletonCard width="90%" height={16} borderRadius={8} style={{ marginBottom: 16, alignSelf: 'center' }} />

      {/* Price */}
      <View style={{ alignItems: 'center', marginBottom: 8 }}>
        <SkeletonCard width={60} height={20} borderRadius={8} />
      </View>

      {/* Button */}
      <View style={{ alignItems: 'center' }}>
        <SkeletonCard width={70} height={32} borderRadius={12} />
      </View>
    </View>
  );
}

/**
 * Skeleton for Profile Header
 */
export function SkeletonProfile() {
  return (
    <View>
      {/* Profile Header */}
      <View style={{
        backgroundColor: colors.surfaceLight,
        borderRadius: 16,
        padding: 20,
        marginBottom: 20,
        borderWidth: 0.5,
        borderColor: colors.surfaceStrong,
      }}>
        {/* Avatar and Name */}
        <View style={{ alignItems: 'center', marginBottom: 20 }}>
          <SkeletonCard width={100} height={100} borderRadius={50} style={{ marginBottom: 12 }} />
          <SkeletonCard width={150} height={24} borderRadius={8} style={{ marginBottom: 8 }} />
          <SkeletonCard width={120} height={16} borderRadius={8} />
        </View>

        {/* Stats Row */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-around' }}>
          <View style={{ alignItems: 'center' }}>
            <SkeletonCard width={60} height={28} borderRadius={8} style={{ marginBottom: 6 }} />
            <SkeletonCard width={50} height={14} borderRadius={8} />
          </View>
          <View style={{ alignItems: 'center' }}>
            <SkeletonCard width={60} height={28} borderRadius={8} style={{ marginBottom: 6 }} />
            <SkeletonCard width={50} height={14} borderRadius={8} />
          </View>
          <View style={{ alignItems: 'center' }}>
            <SkeletonCard width={60} height={28} borderRadius={8} style={{ marginBottom: 6 }} />
            <SkeletonCard width={50} height={14} borderRadius={8} />
          </View>
        </View>
      </View>

      {/* Stats Cards */}
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 }}>
        <SkeletonCard width="48%" height={80} borderRadius={16} />
        <SkeletonCard width="48%" height={80} borderRadius={16} />
      </View>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 }}>
        <SkeletonCard width="48%" height={80} borderRadius={16} />
        <SkeletonCard width="48%" height={80} borderRadius={16} />
      </View>
    </View>
  );
}

/**
 * Skeleton for User Card
 */
export function SkeletonUserCard() {
  return (
    <View
      style={{
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: colors.surfaceLight,
        borderRadius: 12,
        padding: 12,
        marginBottom: 12,
        borderWidth: 0.5,
        borderColor: colors.surfaceStrong,
      }}
    >
      {/* Left side: Avatar and user info */}
      <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
        {/* Avatar */}
        <SkeletonCard width={48} height={48} borderRadius={24} style={{ marginRight: 12 }} />

        {/* User info */}
        <View style={{ flex: 1 }}>
          <SkeletonCard width="70%" height={18} borderRadius={8} style={{ marginBottom: 6 }} />
          <SkeletonCard width="50%" height={14} borderRadius={8} />
        </View>
      </View>

      {/* Right side: Button */}
      <SkeletonCard width={90} height={36} borderRadius={18} />
    </View>
  );
}

/**
 * Skeleton for Bet Details Page
 * Matches the structure of bet-details/[id].tsx
 */
export function SkeletonBetDetails() {
  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      {/* Scrollable Content */}
      <View style={{ flex: 1, paddingTop: 60 }}>
        {/* Header Section */}
        <View style={{ paddingHorizontal: 20, marginBottom: 28 }}>
          {/* Back button + Status */}
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 20 }}>
            <SkeletonCard width={40} height={40} borderRadius={20} style={{ marginRight: 16 }} />
            <View style={{ flex: 1 }}>
              <SkeletonCard width={80} height={14} borderRadius={8} style={{ marginBottom: 6 }} />
              <SkeletonCard width={60} height={14} borderRadius={8} />
            </View>
          </View>

          {/* Title */}
          <SkeletonCard width="85%" height={28} borderRadius={10} style={{ marginBottom: 12 }} />

          {/* Description */}
          <SkeletonCard width="100%" height={16} borderRadius={8} style={{ marginBottom: 6 }} />
          <SkeletonCard width="70%" height={16} borderRadius={8} />
        </View>

        {/* Essential Details Card */}
        <View style={{
          backgroundColor: colors.surfaceLight,
          borderRadius: 18,
          marginHorizontal: 20,
          marginBottom: 24,
          padding: 24,
          borderWidth: 1,
          borderColor: colors.borderLight
        }}>
          <SkeletonCard width={130} height={18} borderRadius={8} style={{ marginBottom: 20 }} />

          {/* Detail rows */}
          {[1, 2, 3, 4].map((i) => (
            <View key={i} style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 14 }}>
              <SkeletonCard width={90} height={14} borderRadius={8} />
              <SkeletonCard width={110} height={14} borderRadius={8} />
            </View>
          ))}
        </View>

        {/* Bet Options Card */}
        <View style={{
          backgroundColor: colors.surfaceLight,
          borderRadius: 18,
          marginHorizontal: 20,
          marginBottom: 24,
          padding: 24,
          borderWidth: 1,
          borderColor: colors.borderLight
        }}>
          <SkeletonCard width={100} height={18} borderRadius={8} style={{ marginBottom: 16 }} />

          {/* Two option buttons side by side */}
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <View style={{ flex: 1 }}>
              <SkeletonCard width="100%" height={52} borderRadius={14} />
            </View>
            <View style={{ flex: 1 }}>
              <SkeletonCard width="100%" height={52} borderRadius={14} />
            </View>
          </View>
        </View>

        {/* Participants Card */}
        <View style={{
          backgroundColor: colors.surfaceLight,
          borderRadius: 18,
          marginHorizontal: 20,
          marginBottom: 24,
          padding: 20,
          borderWidth: 1,
          borderColor: colors.borderLight
        }}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            {/* Stacked avatars */}
            <View style={{ flexDirection: 'row', marginRight: 14 }}>
              {[1, 2, 3].map((i) => (
                <View key={i} style={{ marginLeft: i > 1 ? -12 : 0, zIndex: 4 - i }}>
                  <SkeletonCard width={36} height={36} borderRadius={18} />
                </View>
              ))}
            </View>

            {/* Text */}
            <View style={{ flex: 1 }}>
              <SkeletonCard width={110} height={16} borderRadius={8} style={{ marginBottom: 6 }} />
              <SkeletonCard width={80} height={12} borderRadius={8} />
            </View>

            {/* Chevron */}
            <SkeletonCard width={24} height={24} borderRadius={12} />
          </View>
        </View>

        {/* Bet Amount Card */}
        <View style={{
          backgroundColor: colors.surfaceLight,
          borderRadius: 18,
          marginHorizontal: 20,
          marginBottom: 24,
          padding: 24,
          borderWidth: 1,
          borderColor: colors.borderLight
        }}>
          <SkeletonCard width={90} height={18} borderRadius={8} style={{ marginBottom: 14 }} />
          <SkeletonCard width="100%" height={52} borderRadius={14} />
        </View>

        {/* Action Button */}
        <View style={{ marginHorizontal: 20, marginTop: 8 }}>
          <SkeletonCard width="100%" height={56} borderRadius={16} />
        </View>
      </View>
    </View>
  );
}

/**
 * Skeleton for Group Detail View
 * Shows loading state for group header and tabs
 */
export function SkeletonGroupDetail() {
  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      {/* Header */}
      <View style={{ paddingHorizontal: 20, paddingTop: 8, marginBottom: 12 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          {/* Back Button */}
          <SkeletonCard width={36} height={36} borderRadius={18} />

          {/* Centered Group Info */}
          <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
            <SkeletonCard width={36} height={36} borderRadius={10} style={{ marginRight: 12 }} />
            <SkeletonCard width={120} height={20} borderRadius={8} />
          </View>

          {/* Settings Button */}
          <SkeletonCard width={36} height={36} borderRadius={18} />
        </View>
      </View>

      {/* Tab Navigation */}
      <View style={{ flexDirection: 'row', marginBottom: 8, paddingHorizontal: 4 }}>
        <View style={{ flex: 1, alignItems: 'center', paddingBottom: 8 }}>
          <SkeletonCard width={50} height={16} borderRadius={8} />
        </View>
        <View style={{ flex: 1, alignItems: 'center', paddingBottom: 8 }}>
          <SkeletonCard width={40} height={16} borderRadius={8} />
        </View>
        <View style={{ flex: 1, alignItems: 'center', paddingBottom: 8 }}>
          <SkeletonCard width={50} height={16} borderRadius={8} />
        </View>
      </View>

      {/* Content Area - Empty while loading */}
      <View style={{ flex: 1 }} />
    </View>
  );
}

/**
 * Skeleton for Owed Stakes Card
 * Matches the structure of the owed stakes cards in bet.tsx
 */
export function SkeletonOwedStakesCard() {
  return (
    <View
      style={{
        backgroundColor: 'rgba(255, 255, 255, 0.03)',
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        position: 'relative'
      }}
    >
      {/* Status Badge - top right */}
      <View style={{ position: 'absolute', top: 12, right: 12 }}>
        <SkeletonCard width={60} height={22} borderRadius={6} />
      </View>

      {/* Win/Loss indicator */}
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 }}>
        <SkeletonCard width={16} height={16} borderRadius={8} />
        <SkeletonCard width={60} height={12} borderRadius={6} />
      </View>

      {/* Bet Title */}
      <SkeletonCard width="75%" height={18} borderRadius={8} style={{ marginBottom: 8 }} />

      {/* Social Stake Description */}
      <View style={{
        backgroundColor: 'rgba(255, 255, 255, 0.04)',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 8,
        marginBottom: 12
      }}>
        <SkeletonCard width="90%" height={14} borderRadius={6} style={{ marginBottom: 4 }} />
        <SkeletonCard width="60%" height={14} borderRadius={6} />
      </View>

      {/* Footer: Other party + Date */}
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <SkeletonCard width={24} height={24} borderRadius={12} />
          <SkeletonCard width={80} height={12} borderRadius={6} />
        </View>
        <SkeletonCard width={70} height={12} borderRadius={6} />
      </View>
    </View>
  );
}

/**
 * Skeleton for Fulfillment Details Page
 * Matches the structure of fulfillment-details/[id].tsx
 */
export function SkeletonFulfillmentDetails() {
  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      {/* Header */}
      <View style={{
        paddingHorizontal: 20,
        paddingBottom: 16,
        paddingTop: 12,
        borderBottomWidth: 1,
        borderBottomColor: colors.border
      }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          {/* Back button */}
          <SkeletonCard width={40} height={40} borderRadius={20} />

          {/* Title area */}
          <View style={{ flex: 1, alignItems: 'center', marginHorizontal: 16 }}>
            <SkeletonCard width={140} height={18} borderRadius={8} style={{ marginBottom: 6 }} />
            <SkeletonCard width={180} height={13} borderRadius={6} />
          </View>

          {/* Spacer */}
          <View style={{ width: 40 }} />
        </View>
      </View>

      {/* Content */}
      <View style={{ padding: 20, gap: 16 }}>
        {/* What's at Stake Card */}
        <View style={{
          backgroundColor: colors.surfaceLight,
          borderRadius: 18,
          padding: 24,
          borderWidth: 1,
          borderColor: colors.borderLight
        }}>
          <SkeletonCard width={120} height={16} borderRadius={8} style={{ marginBottom: 12 }} />
          <SkeletonCard width="100%" height={17} borderRadius={8} style={{ marginBottom: 6 }} />
          <SkeletonCard width="70%" height={17} borderRadius={8} />
        </View>

        {/* Fulfillment Tracker Card */}
        <View style={{
          backgroundColor: colors.surfaceLight,
          borderRadius: 18,
          padding: 20,
          borderWidth: 1,
          borderColor: colors.borderLight
        }}>
          {/* Header */}
          <SkeletonCard width={150} height={18} borderRadius={8} style={{ marginBottom: 20 }} />

          {/* Participant rows */}
          {[1, 2, 3].map((i) => (
            <View key={i} style={{
              flexDirection: 'row',
              alignItems: 'center',
              paddingVertical: 12,
              borderBottomWidth: i < 3 ? 1 : 0,
              borderBottomColor: colors.border
            }}>
              {/* Avatar */}
              <SkeletonCard width={40} height={40} borderRadius={20} style={{ marginRight: 12 }} />

              {/* User info */}
              <View style={{ flex: 1 }}>
                <SkeletonCard width={100} height={14} borderRadius={6} style={{ marginBottom: 4 }} />
                <SkeletonCard width={70} height={12} borderRadius={6} />
              </View>

              {/* Status */}
              <SkeletonCard width={80} height={28} borderRadius={14} />
            </View>
          ))}
        </View>
      </View>
    </View>
  );
}
