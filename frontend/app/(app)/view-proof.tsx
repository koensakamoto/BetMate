import React from 'react';
import { Text, View, TouchableOpacity, ScrollView, StatusBar, Image } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { ENV } from '../../config/env';
import { haptic } from '../../utils/haptics';

export default function ViewProof() {
  const insets = useSafeAreaInsets();
  const {
    loserName,
    claimedAt,
    proofUrl,
    proofDescription,
    betTitle
  } = useLocalSearchParams<{
    loserName: string;
    claimedAt: string;
    proofUrl?: string;
    proofDescription?: string;
    betTitle?: string;
  }>();

  // Get full image URL helper
  const getFullImageUrl = (imageUrl: string | undefined): string | null => {
    if (!imageUrl) return null;
    if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
      return imageUrl;
    }
    return `${ENV.API_BASE_URL}${imageUrl}`;
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return dateString;
    }
  };

  const fullProofUrl = getFullImageUrl(proofUrl);

  return (
    <View style={{ flex: 1, backgroundColor: '#0a0a0f' }}>
      <StatusBar barStyle="light-content" />

      {/* Header */}
      <View style={{
        paddingTop: insets.top,
        paddingHorizontal: 20,
        paddingBottom: 16,
        backgroundColor: '#0a0a0f',
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255, 255, 255, 0.1)',
      }}>
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
            <MaterialIcons name="arrow-back" size={28} color="#ffffff" />
          </TouchableOpacity>

          <View style={{ flex: 1, alignItems: 'center', marginHorizontal: 16 }}>
            <Text style={{ fontSize: 18, fontWeight: '600', color: '#ffffff' }}>
              Fulfillment Proof
            </Text>
          </View>

          <View style={{ width: 40 }} />
        </View>
      </View>

      <ScrollView
        contentContainerStyle={{
          padding: 20,
          paddingBottom: insets.bottom + 20,
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* Proof Photo - Lead with visual content */}
        {fullProofUrl && (
          <View style={{ marginBottom: 20 }}>
            <View style={{
              borderRadius: 16,
              overflow: 'hidden',
              borderWidth: 1,
              borderColor: 'rgba(255, 255, 255, 0.08)',
            }}>
              <Image
                source={{ uri: fullProofUrl }}
                style={{
                  width: '100%',
                  aspectRatio: 4/3,
                }}
                resizeMode="cover"
              />
            </View>
          </View>
        )}

        {/* Proof Description */}
        {proofDescription && (
          <View style={{
            backgroundColor: 'rgba(255, 255, 255, 0.05)',
            borderRadius: 12,
            padding: 16,
            marginBottom: 16,
            borderWidth: 1,
            borderColor: 'rgba(255, 255, 255, 0.08)',
          }}>
            <Text style={{
              color: '#ffffff',
              fontSize: 15,
              lineHeight: 22
            }}>
              {proofDescription}
            </Text>
          </View>
        )}

        {/* No Proof Message */}
        {!proofDescription && !fullProofUrl && (
          <View style={{
            backgroundColor: 'rgba(255, 255, 255, 0.02)',
            borderRadius: 12,
            padding: 32,
            alignItems: 'center',
            justifyContent: 'center',
            borderWidth: 1,
            borderColor: 'rgba(255, 255, 255, 0.05)',
          }}>
            <MaterialIcons name="info-outline" size={48} color="rgba(255, 255, 255, 0.3)" />
            <Text style={{
              color: 'rgba(255, 255, 255, 0.5)',
              fontSize: 15,
              marginTop: 12,
              textAlign: 'center',
            }}>
              {loserName} claimed fulfillment without providing proof.
            </Text>
            {claimedAt && (
              <Text style={{
                color: 'rgba(255, 255, 255, 0.3)',
                fontSize: 13,
                marginTop: 8,
              }}>
                Claimed {formatDate(claimedAt)}
              </Text>
            )}
          </View>
        )}

        {/* Date Footer */}
        {(proofDescription || fullProofUrl) && claimedAt && (
          <View style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            paddingTop: 16,
            marginTop: 4,
          }}>
            <Text style={{
              fontSize: 13,
              color: 'rgba(255, 255, 255, 0.4)',
            }}>
              Submitted {formatDate(claimedAt)}
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}
