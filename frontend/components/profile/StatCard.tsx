import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

interface StatCardProps {
  title: string;
  value: number | string;
  icon: string;
  onPress?: () => void;
  loading?: boolean;
  subtitle?: string;
}

const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  icon,
  onPress,
  loading = false,
  subtitle
}) => {
  const formatValue = (val: number | string): string => {
    if (typeof val === 'number') {
      if (val >= 1000000) {
        return (val / 1000000).toFixed(1) + 'M';
      } else if (val >= 1000) {
        return (val / 1000).toFixed(1) + 'K';
      }
      return val.toString();
    }
    return val;
  };

  const CardContent = (
    <View style={{
      backgroundColor: 'rgba(255, 255, 255, 0.04)',
      borderRadius: 16,
      padding: 20,
      borderWidth: 1,
      borderColor: 'rgba(255, 255, 255, 0.08)',
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: 100,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 2
    }}>
      {/* Icon */}
      <View style={{
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(0, 212, 170, 0.15)',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 12
      }}>
        <MaterialIcons
          name={icon as any}
          size={20}
          color="#00D4AA"
        />
      </View>

      {/* Value */}
      <Text style={{
        fontSize: 24,
        fontWeight: '700',
        color: '#ffffff',
        marginBottom: 4,
        textAlign: 'center'
      }}>
        {loading ? '...' : formatValue(value)}
      </Text>

      {/* Title */}
      <Text style={{
        fontSize: 14,
        fontWeight: '500',
        color: 'rgba(255, 255, 255, 0.7)',
        textAlign: 'center',
        marginBottom: subtitle ? 4 : 0
      }}>
        {title}
      </Text>

      {/* Subtitle */}
      {subtitle && (
        <Text style={{
          fontSize: 12,
          color: 'rgba(255, 255, 255, 0.5)',
          textAlign: 'center'
        }}>
          {subtitle}
        </Text>
      )}

      {/* Loading indicator for interactive cards */}
      {loading && (
        <View style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.3)',
          borderRadius: 16,
          justifyContent: 'center',
          alignItems: 'center'
        }}>
          <View style={{
            width: 20,
            height: 20,
            borderRadius: 10,
            borderWidth: 2,
            borderColor: '#00D4AA',
            borderTopColor: 'transparent'
          }} />
        </View>
      )}
    </View>
  );

  if (onPress) {
    return (
      <TouchableOpacity
        onPress={onPress}
        disabled={loading}
        style={{ flex: 1 }}
        activeOpacity={0.8}
      >
        {CardContent}
      </TouchableOpacity>
    );
  }

  return CardContent;
};

interface StatsGridProps {
  children: React.ReactNode;
}

export const StatsGrid: React.FC<StatsGridProps> = ({ children }) => {
  return (
    <View style={{
      flexDirection: 'row',
      justifyContent: 'space-between',
      gap: 12,
      paddingHorizontal: 20,
      marginBottom: 24
    }}>
      {children}
    </View>
  );
};

export default React.memo(StatCard);