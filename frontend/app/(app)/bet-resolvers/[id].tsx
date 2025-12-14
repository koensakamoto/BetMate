import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StatusBar, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { ResolverInfo } from '../../../services/bet/betService';
import { useBetDetailsCache } from '../../../hooks/useBetDetailsCache';
import { Avatar } from '../../../components/common/Avatar';

export default function BetResolvers() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const { bet: betData, isLoading } = useBetDetailsCache(id ? parseInt(id) : null);

  const handleBackPress = () => {
    router.back();
  };

  const handleResolverPress = (resolver: ResolverInfo) => {
    // Navigate to vote details page for any resolver who has voted
    if (resolver.hasVoted) {
      router.push({
        pathname: '/bet-resolver-vote/[betId]/[resolverId]',
        params: {
          betId: id!,
          resolverId: resolver.id.toString(),
          resolverName: resolver.displayName || resolver.username
        }
      });
    }
  };

  const isResolverTappable = (resolver: ResolverInfo) => {
    // Make card tappable if resolver has voted (for any bet type)
    return resolver.hasVoted === true;
  };

  if (isLoading) {
    return (
      <View style={{ flex: 1, backgroundColor: '#0a0a0f', justifyContent: 'center', alignItems: 'center' }}>
        <StatusBar barStyle="light-content" />
        <ActivityIndicator size="large" color="#ffffff" />
      </View>
    );
  }

  const resolvers = betData?.resolvers || [];

  return (
    <View style={{ flex: 1, backgroundColor: '#0a0a0f' }}>
      <StatusBar barStyle="light-content" />

      {/* Header */}
      <View style={{
        paddingTop: insets.top + 12,
        paddingHorizontal: 20,
        paddingBottom: 16,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255, 255, 255, 0.06)'
      }}>
        <View style={{
          flexDirection: 'row',
          alignItems: 'center',
          height: 44
        }}>
          <Text style={{
            position: 'absolute',
            left: 0,
            right: 0,
            fontSize: 17,
            fontWeight: '600',
            color: '#ffffff',
            textAlign: 'center'
          }}>
            Resolvers
          </Text>

          <TouchableOpacity
            onPress={handleBackPress}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            style={{
              width: 40,
              height: 40,
              borderRadius: 20,
              backgroundColor: 'rgba(255, 255, 255, 0.06)',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 1
            }}
          >
            <MaterialIcons name="arrow-back" size={22} color="#ffffff" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: 20 }}
        showsVerticalScrollIndicator={false}
      >
        {resolvers.length > 0 ? (
          <View style={{ gap: 12 }}>
            {resolvers.map((resolver) => {
              const isTappable = isResolverTappable(resolver);
              const CardWrapper = isTappable ? TouchableOpacity : View;

              return (
                <CardWrapper
                  key={resolver.id}
                  onPress={isTappable ? () => handleResolverPress(resolver) : undefined}
                  activeOpacity={0.7}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    backgroundColor: 'rgba(255, 255, 255, 0.03)',
                    borderRadius: 14,
                    padding: 14,
                    borderWidth: 1,
                    borderColor: 'rgba(255, 255, 255, 0.05)'
                  }}
                >
                  <Avatar
                    imageUrl={resolver.profileImageUrl}
                    firstName={resolver.displayName?.split(' ')[0] || resolver.username}
                    lastName={resolver.displayName?.split(' ')[1] || ''}
                    username={resolver.username}
                    userId={resolver.id}
                    customSize={44}
                  />

                  <View style={{ flex: 1, marginLeft: 14 }}>
                    <Text style={{
                      fontSize: 15,
                      fontWeight: '600',
                      color: '#ffffff'
                    }}>
                      {resolver.displayName || resolver.username}
                    </Text>
                    <Text style={{
                      fontSize: 13,
                      color: 'rgba(255, 255, 255, 0.5)',
                      marginTop: 4
                    }}>
                      @{resolver.username}
                    </Text>
                  </View>

                  {/* Vote status */}
                  {resolver.hasVoted ? (
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                      {/* MCQ: show voted option */}
                      {betData?.betType === 'MULTIPLE_CHOICE' && resolver.votedOutcome && (
                        <View style={{
                          backgroundColor: 'rgba(0, 212, 170, 0.1)',
                          paddingHorizontal: 10,
                          paddingVertical: 5,
                          borderRadius: 8,
                          maxWidth: 100
                        }}>
                          <Text style={{ fontSize: 11, fontWeight: '600', color: '#00D4AA' }} numberOfLines={1}>
                            {resolver.votedOutcome}
                          </Text>
                        </View>
                      )}
                      {/* Prediction: show winner count */}
                      {betData?.betType === 'PREDICTION' && resolver.votedWinnerUserIds?.length && (
                        <View style={{
                          backgroundColor: 'rgba(16, 185, 129, 0.1)',
                          paddingHorizontal: 10,
                          paddingVertical: 5,
                          borderRadius: 8
                        }}>
                          <Text style={{ fontSize: 11, fontWeight: '600', color: '#10b981' }}>
                            {resolver.votedWinnerUserIds.length} winner{resolver.votedWinnerUserIds.length !== 1 ? 's' : ''}
                          </Text>
                        </View>
                      )}
                      <MaterialIcons name="chevron-right" size={20} color="rgba(255, 255, 255, 0.4)" />
                    </View>
                  ) : (
                    <View style={{
                      backgroundColor: 'rgba(255, 255, 255, 0.05)',
                      paddingHorizontal: 10,
                      paddingVertical: 5,
                      borderRadius: 8
                    }}>
                      <Text style={{ fontSize: 11, fontWeight: '500', color: 'rgba(255, 255, 255, 0.4)' }}>
                        Pending
                      </Text>
                    </View>
                  )}
                </CardWrapper>
              );
            })}
          </View>
        ) : (
          <View style={{
            alignItems: 'center',
            justifyContent: 'center',
            paddingVertical: 60
          }}>
            <MaterialIcons name="gavel" size={48} color="rgba(255, 255, 255, 0.15)" />
            <Text style={{
              color: 'rgba(255, 255, 255, 0.5)',
              fontSize: 16,
              marginTop: 16,
              fontWeight: '500'
            }}>
              No resolvers assigned
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}
