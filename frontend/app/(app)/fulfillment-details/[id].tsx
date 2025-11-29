import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StatusBar } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { betService, BetResponse } from '../../../services/bet/betService';
import { FulfillmentTracker } from '../../../components/bet/FulfillmentTracker';
import { SkeletonFulfillmentDetails } from '../../../components/common/SkeletonCard';
import { haptic } from '../../../utils/haptics';

export default function FulfillmentDetails() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const [betData, setBetData] = useState<BetResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadBetDetails();
  }, [id]);

  const loadBetDetails = async () => {
    try {
      setIsLoading(true);
      const data = await betService.getBetById(Number(id));
      setBetData(data);
    } catch {
      // Error loading bet details
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <View style={{ flex: 1, backgroundColor: '#0a0a0f', paddingTop: insets.top }}>
        <StatusBar barStyle="light-content" />
        <SkeletonFulfillmentDetails />
      </View>
    );
  }

  if (!betData) {
    return (
      <View style={{ flex: 1, backgroundColor: '#0a0a0f', justifyContent: 'center', alignItems: 'center', paddingHorizontal: 20 }}>
        <StatusBar barStyle="light-content" />
        <MaterialIcons name="error-outline" size={48} color="#EF4444" />
        <Text style={{ color: '#ffffff', marginTop: 16, fontSize: 18, textAlign: 'center' }}>
          Bet not found
        </Text>
        <TouchableOpacity
          onPress={() => router.back()}
          style={{
            backgroundColor: '#00D4AA',
            paddingHorizontal: 24,
            paddingVertical: 12,
            borderRadius: 12,
            marginTop: 20,
          }}
        >
          <Text style={{ color: '#000000', fontWeight: '600', fontSize: 16 }}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: '#0a0a0f' }}>
      <StatusBar barStyle="light-content" />

      {/* Header */}
      <View
        style={{
          paddingTop: insets.top,
          paddingHorizontal: 20,
          paddingBottom: 16,
          backgroundColor: '#0a0a0f',
          borderBottomWidth: 1,
          borderBottomColor: 'rgba(255, 255, 255, 0.1)',
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <TouchableOpacity
            onPress={() => {
              haptic.selection();
              router.back();
            }}
            style={{
              width: 40,
              height: 40,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <MaterialIcons name="arrow-back" size={24} color="#ffffff" />
          </TouchableOpacity>

          <View style={{ flex: 1, alignItems: 'center', marginHorizontal: 16 }}>
            <Text style={{ fontSize: 18, fontWeight: '600', color: '#ffffff' }}>
              Fulfillment Details
            </Text>
            <Text style={{ fontSize: 13, color: 'rgba(255, 255, 255, 0.6)', marginTop: 2 }} numberOfLines={1}>
              {betData.title}
            </Text>
          </View>

          <View style={{ width: 40 }} />
        </View>
      </View>

      {/* Content */}
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{
          padding: 20,
          paddingBottom: insets.bottom + 20,
          gap: 16,
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* What's at Stake Card */}
        {betData.socialStakeDescription && (
          <View style={{
            backgroundColor: 'rgba(255, 255, 255, 0.04)',
            borderRadius: 18,
            padding: 24,
            borderWidth: 1,
            borderColor: 'rgba(255, 255, 255, 0.08)'
          }}>
            <Text style={{
              fontSize: 16,
              fontWeight: '600',
              color: '#ffffff',
              marginBottom: 12
            }}>
              What's at Stake
            </Text>
            <Text style={{
              color: '#00D4AA',
              fontSize: 17,
              fontWeight: '600',
              lineHeight: 24
            }}>
              {betData.socialStakeDescription}
            </Text>
          </View>
        )}

        {/* Fulfillment Tracker */}
        <FulfillmentTracker
          betId={betData.id}
          betTitle={betData.title}
          onRefresh={loadBetDetails}
        />
      </ScrollView>
    </View>
  );
}
