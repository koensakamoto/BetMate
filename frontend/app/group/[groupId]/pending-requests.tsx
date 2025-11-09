import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, RefreshControl, ActivityIndicator, StatusBar } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import PendingRequestCard from '../../../components/group/PendingRequestCard';
import { groupService, PendingRequestResponse } from '../../../services/group/groupService';

export default function PendingRequestsPage() {
  const insets = useSafeAreaInsets();
  const { groupId } = useLocalSearchParams();
  const [pendingRequests, setPendingRequests] = useState<PendingRequestResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchPendingRequests = useCallback(async () => {
    try {
      const numericGroupId = typeof groupId === 'string' ? parseInt(groupId) : parseInt(groupId[0]);
      const requests = await groupService.getPendingRequests(numericGroupId);
      setPendingRequests(requests);
    } catch (error) {
      console.error('Error fetching pending requests:', error);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  }, [groupId]);

  useEffect(() => {
    fetchPendingRequests();
  }, [fetchPendingRequests]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchPendingRequests();
  }, [fetchPendingRequests]);

  const handleApproveRequest = useCallback(async (requestId: number) => {
    try {
      const numericGroupId = typeof groupId === 'string' ? parseInt(groupId) : parseInt(groupId[0]);
      await groupService.approvePendingRequest(numericGroupId, requestId);
      setPendingRequests(prev => prev.filter(r => r.requestId !== requestId));
    } catch (error) {
      console.error('Error approving request:', error);
    }
  }, [groupId]);

  const handleDenyRequest = useCallback(async (requestId: number) => {
    try {
      const numericGroupId = typeof groupId === 'string' ? parseInt(groupId) : parseInt(groupId[0]);
      await groupService.denyPendingRequest(numericGroupId, requestId);
      setPendingRequests(prev => prev.filter(r => r.requestId !== requestId));
    } catch (error) {
      console.error('Error denying request:', error);
    }
  }, [groupId]);

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
