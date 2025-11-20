import React, { useEffect, useRef } from 'react';
import { View, Animated, ViewStyle } from 'react-native';

interface SkeletonCardProps {
  width?: number | string;
  height?: number | string;
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
          backgroundColor: 'rgba(255, 255, 255, 0.1)',
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
        backgroundColor: 'rgba(255, 255, 255, 0.03)',
        borderRadius: 16,
        padding: 16,
        marginBottom: 16,
        borderWidth: 0.5,
        borderColor: 'rgba(255, 255, 255, 0.08)',
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
        backgroundColor: 'rgba(255, 255, 255, 0.03)',
        borderRadius: 16,
        padding: 16,
        marginBottom: 16,
        borderWidth: 0.5,
        borderColor: 'rgba(255, 255, 255, 0.08)',
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
        backgroundColor: 'rgba(255, 255, 255, 0.03)',
        borderRadius: 16,
        padding: 14,
        marginBottom: 16,
        borderWidth: 0.5,
        borderColor: 'rgba(255, 255, 255, 0.08)',
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
        backgroundColor: 'rgba(255, 255, 255, 0.03)',
        borderRadius: 16,
        padding: 20,
        marginBottom: 20,
        borderWidth: 0.5,
        borderColor: 'rgba(255, 255, 255, 0.08)',
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
        backgroundColor: 'rgba(255, 255, 255, 0.03)',
        borderRadius: 12,
        padding: 12,
        marginBottom: 12,
        borderWidth: 0.5,
        borderColor: 'rgba(255, 255, 255, 0.08)',
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
