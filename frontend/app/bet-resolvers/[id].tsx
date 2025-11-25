import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StatusBar, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { betService, BetResponse } from '../../services/bet/betService';
import { authService } from '../../services/auth/authService';
import { Avatar } from '../../components/common/Avatar';

export default function BetResolvers() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const [betData, setBetData] = useState<BetResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);

  useEffect(() => {
    loadData();
  }, [id]);

  const loadData = async () => {
    try {
      setIsLoading(true);

      if (!id) {
        throw new Error('Bet ID is required');
      }

      // Load current user
      const userData = await authService.getCurrentUser();
      if (userData?.id) {
        setCurrentUserId(userData.id);
      }

      // Load bet details (includes resolvers)
      const betResponse = await betService.getBetById(parseInt(id));
      setBetData(betResponse);

    } catch (error) {
      console.error('Error loading resolvers:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleBackPress = () => {
    router.back();
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
              const isCurrentUser = resolver.id === currentUserId;

              return (
                <View
                  key={resolver.id}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    backgroundColor: 'rgba(255, 255, 255, 0.03)',
                    borderRadius: 14,
                    padding: 14,
                    borderWidth: 1,
                    borderColor: isCurrentUser ? 'rgba(255, 255, 255, 0.1)' : 'rgba(255, 255, 255, 0.05)'
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
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                      <Text style={{
                        fontSize: 15,
                        fontWeight: '600',
                        color: '#ffffff'
                      }}>
                        {resolver.displayName || resolver.username}
                      </Text>
                      {isCurrentUser && (
                        <View style={{
                          backgroundColor: 'rgba(255, 255, 255, 0.1)',
                          paddingHorizontal: 6,
                          paddingVertical: 2,
                          borderRadius: 4
                        }}>
                          <Text style={{ color: 'rgba(255, 255, 255, 0.6)', fontSize: 9, fontWeight: '600' }}>YOU</Text>
                        </View>
                      )}
                    </View>
                    <Text style={{
                      fontSize: 13,
                      color: 'rgba(255, 255, 255, 0.5)',
                      marginTop: 4
                    }}>
                      @{resolver.username}
                    </Text>
                  </View>

                  {/* Vote status for PARTICIPANT_VOTE */}
                  {betData?.resolutionMethod === 'PARTICIPANT_VOTE' && betData?.status === 'CLOSED' && (
                    <View style={{
                      paddingHorizontal: 10,
                      paddingVertical: 5,
                      borderRadius: 8,
                      backgroundColor: resolver.hasVoted
                        ? 'rgba(16, 185, 129, 0.1)'
                        : 'rgba(255, 255, 255, 0.06)'
                    }}>
                      <Text style={{
                        fontSize: 12,
                        fontWeight: '600',
                        color: resolver.hasVoted ? '#10b981' : 'rgba(255, 255, 255, 0.5)'
                      }}>
                        {resolver.hasVoted ? 'Voted' : 'Pending'}
                      </Text>
                    </View>
                  )}

                  {/* Resolver badge for ASSIGNED_RESOLVERS */}
                  {betData?.resolutionMethod === 'ASSIGNED_RESOLVERS' && (
                    <View style={{
                      paddingHorizontal: 10,
                      paddingVertical: 5,
                      borderRadius: 8,
                      backgroundColor: 'rgba(255, 255, 255, 0.06)'
                    }}>
                      <Text style={{
                        fontSize: 12,
                        fontWeight: '600',
                        color: 'rgba(255, 255, 255, 0.5)'
                      }}>
                        Resolver
                      </Text>
                    </View>
                  )}
                </View>
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
