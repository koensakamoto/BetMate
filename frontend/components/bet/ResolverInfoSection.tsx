import React from 'react';
import { View, Text, Image, TouchableOpacity } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { BetResponse, ResolverInfo } from '../../services/bet/betService';
import { ENV } from '../../config/env';

interface ResolverInfoSectionProps {
  bet: BetResponse;
  currentUserId: number | null;
}

export const ResolverInfoSection: React.FC<ResolverInfoSectionProps> = ({
  bet,
  currentUserId,
}) => {
  // Get full image URL helper
  const getFullImageUrl = (imageUrl: string | null | undefined): string | null => {
    if (!imageUrl) return null;
    if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
      return imageUrl;
    }
    return `${ENV.API_BASE_URL}${imageUrl}`;
  };

  // Get user initials from display name
  const getUserInitials = (displayName: string) => {
    const nameParts = displayName.trim().split(/\s+/);
    if (nameParts.length >= 2) {
      return nameParts[0].charAt(0).toUpperCase() + nameParts[1].charAt(0).toUpperCase();
    }
    return displayName.charAt(0).toUpperCase();
  };

  // Render avatar for a resolver
  const renderAvatar = (resolver: ResolverInfo, size: number = 24) => {
    const imageUrl = getFullImageUrl(resolver.profileImageUrl);

    if (imageUrl) {
      return (
        <Image
          source={{ uri: imageUrl }}
          style={{
            width: size,
            height: size,
            borderRadius: size / 2,
            backgroundColor: 'rgba(255, 255, 255, 0.1)',
          }}
        />
      );
    }

    return (
      <View style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: 'rgba(0, 212, 170, 0.2)',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        <Text style={{
          color: '#00D4AA',
          fontSize: size * 0.45,
          fontWeight: '600',
        }}>
          {getUserInitials(resolver.displayName || resolver.username)}
        </Text>
      </View>
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
          <Text style={{ color: 'rgba(255, 255, 255, 0.6)', fontSize: 14 }}>
            Resolvers
          </Text>
          <TouchableOpacity
            onPress={() => router.push(`/bet-resolvers/${bet.id}`)}
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

    // CLOSED - show progress bar + link to resolvers
    if (isClosed && votingProgress) {
      const progress = votingProgress.totalResolvers > 0
        ? (votingProgress.votesSubmitted / votingProgress.totalResolvers) * 100
        : 0;

      return (
        <View style={{ gap: 8 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text style={{ color: 'rgba(255, 255, 255, 0.6)', fontSize: 14 }}>
              Resolution Progress
            </Text>
            <TouchableOpacity
              onPress={() => router.push(`/bet-resolvers/${bet.id}`)}
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

    // RESOLVED - show vote results + link
    if (isResolved && votingProgress) {
      const voteDistribution = votingProgress.voteDistribution || {};
      const hasVotes = Object.keys(voteDistribution).length > 0;

      return (
        <View style={{ gap: 8 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text style={{ color: 'rgba(255, 255, 255, 0.6)', fontSize: 14 }}>
              Resolution
            </Text>
            <TouchableOpacity
              onPress={() => router.push(`/bet-resolvers/${bet.id}`)}
              style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}
            >
              <Text style={{ color: '#00D4AA', fontSize: 14, fontWeight: '500' }}>
                {resolvers.length} resolvers
              </Text>
              <MaterialIcons name="chevron-right" size={16} color="#00D4AA" />
            </TouchableOpacity>
          </View>

          {hasVotes && (
            <View style={{
              backgroundColor: 'rgba(255, 255, 255, 0.03)',
              borderRadius: 8,
              padding: 10,
              gap: 6,
            }}>
              <Text style={{ color: 'rgba(255, 255, 255, 0.5)', fontSize: 11, marginBottom: 2 }}>
                Vote Results
              </Text>
              {Object.entries(voteDistribution).map(([option, count]) => {
                const optionIndex = parseInt(option.replace('OPTION_', '')) - 1;
                const optionText = bet.options?.[optionIndex] || option;
                const isWinningOption = bet.outcome === option;

                return (
                  <View key={option} style={{
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      {isWinningOption && (
                        <MaterialIcons name="check-circle" size={14} color="#00D4AA" />
                      )}
                      <Text style={{
                        color: isWinningOption ? '#00D4AA' : 'rgba(255, 255, 255, 0.7)',
                        fontSize: 12,
                        fontWeight: isWinningOption ? '600' : '400',
                      }}>
                        {optionText}
                      </Text>
                    </View>
                    <Text style={{
                      color: isWinningOption ? '#00D4AA' : 'rgba(255, 255, 255, 0.5)',
                      fontSize: 12,
                      fontWeight: '500',
                    }}>
                      {count} vote{count !== 1 ? 's' : ''}
                    </Text>
                  </View>
                );
              })}
            </View>
          )}
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
          onPress={() => router.push(`/bet-resolvers/${bet.id}`)}
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
              onPress={() => router.push(`/bet-resolvers/${bet.id}`)}
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

    // For RESOLVED bets - show vote breakdown
    if (isResolved && votingProgress) {
      const voteDistribution = votingProgress.voteDistribution || {};
      const hasVotes = Object.keys(voteDistribution).length > 0;

      return (
        <View style={{ gap: 8 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text style={{ color: 'rgba(255, 255, 255, 0.6)', fontSize: 14 }}>
              Resolution
            </Text>
            <TouchableOpacity
              onPress={() => router.push(`/bet-resolvers/${bet.id}`)}
              style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}
            >
              <Text style={{ color: '#00D4AA', fontSize: 14, fontWeight: '500' }}>
                {resolvers.length} voters
              </Text>
              <MaterialIcons name="chevron-right" size={16} color="#00D4AA" />
            </TouchableOpacity>
          </View>

          {hasVotes && (
            <View style={{
              backgroundColor: 'rgba(255, 255, 255, 0.03)',
              borderRadius: 8,
              padding: 10,
              gap: 6,
            }}>
              <Text style={{ color: 'rgba(255, 255, 255, 0.5)', fontSize: 11, marginBottom: 2 }}>
                Vote Results
              </Text>
              {Object.entries(voteDistribution).map(([option, count]) => {
                const optionIndex = parseInt(option.replace('OPTION_', '')) - 1;
                const optionText = bet.options?.[optionIndex] || option;
                const isWinningOption = bet.outcome === option;

                return (
                  <View key={option} style={{
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      {isWinningOption && (
                        <MaterialIcons name="check-circle" size={14} color="#00D4AA" />
                      )}
                      <Text style={{
                        color: isWinningOption ? '#00D4AA' : 'rgba(255, 255, 255, 0.7)',
                        fontSize: 12,
                        fontWeight: isWinningOption ? '600' : '400',
                      }}>
                        {optionText}
                      </Text>
                    </View>
                    <Text style={{
                      color: isWinningOption ? '#00D4AA' : 'rgba(255, 255, 255, 0.5)',
                      fontSize: 12,
                      fontWeight: '500',
                    }}>
                      {count} vote{count !== 1 ? 's' : ''}
                    </Text>
                  </View>
                );
              })}
            </View>
          )}
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
};
