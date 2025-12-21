import React, { useState, useMemo, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, RefreshControl, ActivityIndicator, StatusBar } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import PendingRequestCard from '../../../../components/group/PendingRequestCard';
import { usePendingRequests, useApprovePendingRequest, useDenyPendingRequest } from '../../../../hooks/useGroupQueries';

export default function PendingRequestsPage() {
  const insets = useSafeAreaInsets();
  const { groupId } = useLocalSearchParams();
  const [refreshing, setRefreshing] = useState(false);

  // Parse groupId
  const numericGroupId = useMemo(() => {
    if (!groupId) return undefined;
    return typeof groupId === 'string' ? parseInt(groupId) : parseInt(groupId[0]);
  }, [groupId]);

  // React Query hooks
  const { data: pendingRequests = [], isLoading, refetch } = usePendingRequests(numericGroupId);
  const approveMutation = useApprovePendingRequest();
  const denyMutation = useDenyPendingRequest();

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  const handleApproveRequest = useCallback(async (requestId: number) => {
    if (!numericGroupId) return;
    try {
      await approveMutation.mutateAsync({ groupId: numericGroupId, requestId });
    } catch (error) {
      // Error handled by mutation
    }
  }, [numericGroupId, approveMutation]);

  const handleDenyRequest = useCallback(async (requestId: number) => {
    if (!numericGroupId) return;
    try {
      await denyMutation.mutateAsync({ groupId: numericGroupId, requestId });
    } catch (error) {
      // Error handled by mutation
    }
  }, [numericGroupId, denyMutation]);

  return (
    <View style={{ flex: 1, backgroundColor: '#0a0a0f' }}>
      <StatusBar barStyle="light-content" backgroundColor="#0a0a0f" translucent={true} />

      {/* Header */}
      <View style={{ paddingTop: insets.top + 16, paddingHorizontal: 20, paddingBottom: 16 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={{
              width: 36,
              height: 36,
              borderRadius: 18,
              backgroundColor: 'rgba(255, 255, 255, 0.08)',
              justifyContent: 'center',
              alignItems: 'center',
              marginRight: 12
            }}
          >
            <MaterialIcons name="arrow-back" size={20} color="#ffffff" />
          </TouchableOpacity>
          <Text style={{
            fontSize: 24,
            fontWeight: '700',
            color: '#ffffff',
            flex: 1
          }}>
            Join Requests
          </Text>
        </View>
        <Text style={{
          fontSize: 14,
          color: 'rgba(255, 255, 255, 0.6)',
          marginLeft: 48
        }}>
          {pendingRequests.length} pending {pendingRequests.length === 1 ? 'request' : 'requests'}
        </Text>
      </View>

      {/* Content */}
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 20 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#00D4AA"
            colors={['#00D4AA']}
          />
        }
      >
        {isLoading ? (
          <View style={{ paddingVertical: 40, alignItems: 'center' }}>
            <ActivityIndicator size="large" color="#00D4AA" />
          </View>
        ) : pendingRequests.length === 0 ? (
          <View style={{
            paddingVertical: 60,
            alignItems: 'center'
          }}>
            <View style={{
              width: 64,
              height: 64,
              borderRadius: 32,
              backgroundColor: 'rgba(255, 255, 255, 0.05)',
              justifyContent: 'center',
              alignItems: 'center',
              marginBottom: 16
            }}>
              <MaterialIcons name="check-circle" size={32} color="rgba(255, 255, 255, 0.3)" />
            </View>
            <Text style={{
              fontSize: 18,
              fontWeight: '600',
              color: '#ffffff',
              marginBottom: 8
            }}>
              All Caught Up!
            </Text>
            <Text style={{
              fontSize: 14,
              color: 'rgba(255, 255, 255, 0.6)',
              textAlign: 'center'
            }}>
              No pending join requests at the moment
            </Text>
          </View>
        ) : (
          pendingRequests.map((request) => (
            <PendingRequestCard
              key={request.requestId}
              request={request}
              onApprove={handleApproveRequest}
              onDeny={handleDenyRequest}
            />
          ))
        )}
      </ScrollView>
    </View>
  );
}
