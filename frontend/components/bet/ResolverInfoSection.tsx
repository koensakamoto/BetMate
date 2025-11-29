import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { BetResponse, ResolverInfo } from '../../services/bet/betService';
import { Avatar } from '../common/Avatar';

interface ResolverInfoSectionProps {
  bet: BetResponse;
  currentUserId: number | null;
}

export const ResolverInfoSection: React.FC<ResolverInfoSectionProps> = React.memo(({
  bet,
  currentUserId,
}) => {
  // Render avatar for a resolver using the Avatar component
  const renderAvatar = (resolver: ResolverInfo, size: number = 24) => {
    const nameParts = (resolver.displayName || resolver.username).trim().split(/\s+/);
    return (
      <Avatar
        imageUrl={resolver.profileImageUrl}
        firstName={nameParts[0]}
        lastName={nameParts[1] || ''}
        username={resolver.username}
        userId={resolver.id}
        customSize={size}
      />
    );
  };

  // SELF resolution - creator is the resolver
  if (bet.resolutionMethod === 'SELF') {
    const isResolved = bet.status === 'RESOLVED';

    return (
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <Text style={{ color: 'rgba(255, 255, 255, 0.6)', fontSize: 14 }}>
          {isResolved ? 'Resolved by' : 'Resolves'}
        </Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          {bet.resolvers && bet.resolvers[0] && renderAvatar(bet.resolvers[0], 20)}
          <Text style={{ color: '#ffffff', fontSize: 14, fontWeight: '500' }}>
            Creator
          </Text>
        </View>
      </View>
    );
  }

  // ASSIGNED_RESOLVERS - specific users assigned to resolve
  if (bet.resolutionMethod === 'ASSIGNED_RESOLVERS') {
    const resolvers = bet.resolvers || [];
    const isOpen = bet.status === 'OPEN';
    const isClosed = bet.status === 'CLOSED';
    const isResolved = bet.status === 'RESOLVED';
    const votingProgress = bet.votingProgress;

    // OPEN - just show count with link
    if (isOpen) {
      return (
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <Text style={{ color: 'rgba(255, 255, 255, 0.6)', fontSize: 14 }} accessible={false}>
            Resolvers
          </Text>
          <TouchableOpacity
            onPress={() => router.push(`/(app)/bet-resolvers/${bet.id}`)}
            style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel={`${resolvers.length} resolvers assigned`}
            accessibilityHint="Double tap to view resolver details"
          >
            <Text style={{ color: '#00D4AA', fontSize: 14, fontWeight: '500' }} accessible={false}>
              {resolvers.length} assigned
            </Text>
            <MaterialIcons name="chevron-right" size={16} color="#00D4AA" accessible={false} />
          </TouchableOpacity>
        </View>
      );
    }

    // CLOSED - show progress bar + link to resolvers
    if (isClosed && votingProgress) {
      const progress = votingProgress.totalResolvers > 0
        ? (votingProgress.votesSubmitted / votingProgress.totalResolvers) * 100
        : 0;

      return (
        <View style={{ gap: 8 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text style={{ color: 'rgba(255, 255, 255, 0.6)', fontSize: 14 }} accessible={false}>
              Resolution Progress
            </Text>
            <TouchableOpacity
              onPress={() => router.push(`/(app)/bet-resolvers/${bet.id}`)}
              style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}
              accessible={true}
              accessibilityRole="button"
              accessibilityLabel={`${votingProgress.votesSubmitted} of ${votingProgress.totalResolvers} votes submitted`}
              accessibilityHint="Double tap to view resolver voting details"
            >
              <Text style={{ color: '#00D4AA', fontSize: 14, fontWeight: '600' }} accessible={false}>
                {votingProgress.votesSubmitted}/{votingProgress.totalResolvers} votes
              </Text>
              <MaterialIcons name="chevron-right" size={16} color="#00D4AA" accessible={false} />
            </TouchableOpacity>
          </View>

          {/* Progress bar */}
          <View
            style={{
              height: 6,
              backgroundColor: 'rgba(255, 255, 255, 0.1)',
              borderRadius: 3,
              overflow: 'hidden',
            }}
            accessible={true}
            accessibilityRole="progressbar"
            accessibilityLabel="Resolution progress"
            accessibilityValue={{
              min: 0,
              max: 100,
              now: Math.round(progress),
            }}
          >
            <View style={{
              height: '100%',
              width: `${progress}%`,
              backgroundColor: '#00D4AA',
              borderRadius: 3,
            }} />
          </View>
        </View>
      );
    }

    // RESOLVED - just show resolver count + link (vote results shown in ResultsCard)
    if (isResolved) {
      return (
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <Text style={{ color: 'rgba(255, 255, 255, 0.6)', fontSize: 14 }}>
            Resolution
          </Text>
          <TouchableOpacity
            onPress={() => router.push(`/(app)/bet-resolvers/${bet.id}`)}
            style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}
          >
            <Text style={{ color: '#00D4AA', fontSize: 14, fontWeight: '500' }}>
              {resolvers.length} resolvers
            </Text>
            <MaterialIcons name="chevron-right" size={16} color="#00D4AA" />
          </TouchableOpacity>
        </View>
      );
    }

    // Fallback for ASSIGNED_RESOLVERS
    return (
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <Text style={{ color: 'rgba(255, 255, 255, 0.6)', fontSize: 14 }}>
          Resolvers
        </Text>
        <TouchableOpacity
          onPress={() => router.push(`/(app)/bet-resolvers/${bet.id}`)}
          style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}
        >
          <Text style={{ color: '#00D4AA', fontSize: 14, fontWeight: '500' }}>
            {resolvers.length} assigned
          </Text>
          <MaterialIcons name="chevron-right" size={16} color="#00D4AA" />
        </TouchableOpacity>
      </View>
    );
  }

  // PARTICIPANT_VOTE - participants vote to resolve
  if (bet.resolutionMethod === 'PARTICIPANT_VOTE') {
    const isOpen = bet.status === 'OPEN';
    const isClosed = bet.status === 'CLOSED';
    const isResolved = bet.status === 'RESOLVED';
    const votingProgress = bet.votingProgress;
    const resolvers = bet.resolvers || [];

    // For OPEN bets - show info message
    if (isOpen) {
      return (
        <View style={{ gap: 8 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text style={{ color: 'rgba(255, 255, 255, 0.6)', fontSize: 14 }}>
              Resolution
            </Text>
            <Text style={{ color: '#ffffff', fontSize: 14, fontWeight: '500' }}>
              Participant Vote
            </Text>
          </View>
          <View style={{
            backgroundColor: 'rgba(0, 212, 170, 0.1)',
            borderRadius: 8,
            padding: 10,
            flexDirection: 'row',
            alignItems: 'center',
            gap: 8,
          }}>
            <MaterialIcons name="how-to-vote" size={16} color="#00D4AA" />
            <Text style={{ color: 'rgba(255, 255, 255, 0.8)', fontSize: 12, flex: 1 }}>
              When you join, you'll vote on the outcome after betting closes
            </Text>
          </View>
        </View>
      );
    }

    // For CLOSED bets - show voting progress + link to resolvers
    if (isClosed && votingProgress) {
      const progress = votingProgress.totalResolvers > 0
        ? (votingProgress.votesSubmitted / votingProgress.totalResolvers) * 100
        : 0;

      return (
        <View style={{ gap: 8 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text style={{ color: 'rgba(255, 255, 255, 0.6)', fontSize: 14 }}>
              Voting Progress
            </Text>
            <TouchableOpacity
              onPress={() => router.push(`/(app)/bet-resolvers/${bet.id}`)}
              style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}
            >
              <Text style={{ color: '#00D4AA', fontSize: 14, fontWeight: '600' }}>
                {votingProgress.votesSubmitted}/{votingProgress.totalResolvers} votes
              </Text>
              <MaterialIcons name="chevron-right" size={16} color="#00D4AA" />
            </TouchableOpacity>
          </View>

          {/* Progress bar */}
          <View style={{
            height: 6,
            backgroundColor: 'rgba(255, 255, 255, 0.1)',
            borderRadius: 3,
            overflow: 'hidden',
          }}>
            <View style={{
              height: '100%',
              width: `${progress}%`,
              backgroundColor: '#00D4AA',
              borderRadius: 3,
            }} />
          </View>
        </View>
      );
    }

    // For RESOLVED bets - just show voter count + link (vote results shown in ResultsCard)
    if (isResolved) {
      return (
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <Text style={{ color: 'rgba(255, 255, 255, 0.6)', fontSize: 14 }}>
            Resolution
          </Text>
          <TouchableOpacity
            onPress={() => router.push(`/(app)/bet-resolvers/${bet.id}`)}
            style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}
          >
            <Text style={{ color: '#00D4AA', fontSize: 14, fontWeight: '500' }}>
              {resolvers.length} voters
            </Text>
            <MaterialIcons name="chevron-right" size={16} color="#00D4AA" />
          </TouchableOpacity>
        </View>
      );
    }

    // Default fallback
    return (
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <Text style={{ color: 'rgba(255, 255, 255, 0.6)', fontSize: 14 }}>
          Resolution
        </Text>
        <Text style={{ color: '#ffffff', fontSize: 14, fontWeight: '500' }}>
          Participant Vote
        </Text>
      </View>
    );
  }

  // Fallback for unknown resolution method
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
      <Text style={{ color: 'rgba(255, 255, 255, 0.6)', fontSize: 14 }}>
        Resolution
      </Text>
      <Text style={{ color: '#ffffff', fontSize: 14, fontWeight: '500' }}>
        {bet.resolutionMethodDisplay || bet.resolutionMethod}
      </Text>
    </View>
  );
});
