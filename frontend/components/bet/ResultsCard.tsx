import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

interface ResultsCardProps {
  outcome: string | null; // OPTION_1, OPTION_2, DRAW, CANCELLED, etc.
  userChoice: string | null; // OPTION_1, OPTION_2, etc.
  hasUserParticipated: boolean;
  betType: 'BINARY' | 'MULTIPLE_CHOICE' | 'PREDICTION';
  options: string[];
  cancellationReason?: string;
  voteDistribution?: Record<string, number>;
  totalResolvers?: number;
}

type ResultState = 'WIN' | 'LOSS' | 'DRAW' | 'CANCELLED' | 'DID_NOT_PARTICIPATE';

export function ResultsCard({
  outcome,
  userChoice,
  hasUserParticipated,
  betType,
  options,
  cancellationReason,
  voteDistribution,
  totalResolvers,
}: ResultsCardProps) {
  // Get all available options based on bet type
  const getAllOptions = (): string[] => {
    if (betType === 'BINARY') {
      return ['Yes', 'No'];
    }
    return options && options.length > 0 ? options : ['Option 1', 'Option 2', 'Option 3'];
  };

  // Get user's result state
  const getUserResult = (): ResultState => {
    if (!hasUserParticipated) return 'DID_NOT_PARTICIPATE';
    if (outcome === 'CANCELLED') return 'CANCELLED';
    if (outcome === 'DRAW') return 'DRAW';
    if (!outcome || !userChoice) return 'DID_NOT_PARTICIPATE';
    return outcome === userChoice ? 'WIN' : 'LOSS';
  };

  // Check if an option (by index) is the winning option
  const isWinningOption = (index: number): boolean => {
    if (!outcome || outcome === 'CANCELLED' || outcome === 'DRAW') return false;
    return outcome === `OPTION_${index + 1}`;
  };

  // Check if an option (by index) is the user's choice
  const isUserPick = (index: number): boolean => {
    if (!userChoice) return false;
    return userChoice === `OPTION_${index + 1}`;
  };

  // Get the text for user's choice
  const getUserChoiceText = (): string | null => {
    if (!userChoice) return null;
    const allOptions = getAllOptions();
    const match = userChoice.match(/OPTION_(\d+)/);
    if (match) {
      const index = parseInt(match[1], 10) - 1;
      return allOptions[index] || null;
    }
    return null;
  };

  // Get the text for winning option
  const getWinningOptionText = (): string | null => {
    if (!outcome || outcome === 'CANCELLED' || outcome === 'DRAW') return null;
    const allOptions = getAllOptions();
    const match = outcome.match(/OPTION_(\d+)/);
    if (match) {
      const index = parseInt(match[1], 10) - 1;
      return allOptions[index] || null;
    }
    return null;
  };

  const result = getUserResult();
  const allOptions = getAllOptions();
  const userChoiceText = getUserChoiceText();
  const winningOptionText = getWinningOptionText();

  // Cancelled state
  if (outcome === 'CANCELLED') {
    return (
      <View
        style={styles.container}
        accessible={true}
        accessibilityRole="alert"
        accessibilityLabel={`Bet cancelled${cancellationReason ? `. Reason: ${cancellationReason}` : ''}`}
      >
        <View style={styles.cancelledBanner}>
          <View style={styles.cancelledIconContainer}>
            <MaterialIcons name="block" size={24} color="#9ca3af" accessible={false} />
          </View>
          <View style={styles.bannerTextContainer}>
            <Text style={styles.cancelledTitle} accessible={false}>Bet Cancelled</Text>
            {cancellationReason && (
              <Text style={styles.cancelledReason} accessible={false}>{cancellationReason}</Text>
            )}
          </View>
        </View>
      </View>
    );
  }

  // Draw state
  if (outcome === 'DRAW') {
    return (
      <View
        style={styles.container}
        accessible={true}
        accessibilityLabel={`Bet result: Draw${hasUserParticipated && userChoiceText ? `. Your pick was ${userChoiceText}` : ''}`}
      >
        {/* Draw Banner - Compact style matching Win/Loss */}
        <View style={styles.drawBanner} accessible={false}>
          <MaterialIcons name="balance" size={20} color="#60a5fa" accessible={false} />
          <Text style={styles.drawBannerText} accessible={false}>It's a draw</Text>
        </View>

        {/* All Options */}
        <View style={styles.allOptionsSection}>
          <Text style={styles.sectionLabel}>ALL OPTIONS</Text>
          <View style={styles.optionsList}>
            {allOptions.map((option, index) => {
              const voteCount = voteDistribution?.[`OPTION_${index + 1}`] || 0;
              const votePercentage = totalResolvers && totalResolvers > 0 ? (voteCount / totalResolvers) * 100 : 0;
              const hasVoteData = voteDistribution && Object.keys(voteDistribution).length > 0;
              const showVoteBar = totalResolvers && totalResolvers > 1 && hasVoteData;

              return (
                <View key={index} style={styles.drawOptionItem}>
                  <View style={styles.optionTopRow}>
                    <Text style={styles.drawOptionText}>{option}</Text>
                    {isUserPick(index) && hasUserParticipated && (
                      <View style={styles.youBadgeMuted}>
                        <Text style={styles.youBadgeMutedText}>YOU</Text>
                      </View>
                    )}
                  </View>
                  {showVoteBar && (
                    <View style={styles.voteBarContainer}>
                      <View style={styles.voteBarBackground}>
                        <View
                          style={[
                            styles.voteBarFill,
                            { width: `${votePercentage}%` },
                          ]}
                        />
                      </View>
                      <Text style={styles.voteCountText}>
                        {voteCount}/{totalResolvers} votes
                      </Text>
                    </View>
                  )}
                </View>
              );
            })}
          </View>
        </View>
      </View>
    );
  }

  // Normal resolved state (Win/Loss)
  const isWin = result === 'WIN';

  const resultsAccessibilityLabel = hasUserParticipated
    ? `Bet result: ${isWin ? 'You won' : 'You lost'}${winningOptionText ? `. Winning answer: ${winningOptionText}` : ''}${userChoiceText ? `. Your pick: ${userChoiceText}` : ''}`
    : `Bet resolved${winningOptionText ? `. Winning answer: ${winningOptionText}` : ''}`;

  return (
    <View
      style={styles.container}
      accessible={true}
      accessibilityLabel={resultsAccessibilityLabel}
    >
      {/* Result Banner - Only show if user participated */}
      {hasUserParticipated && (
        <View style={[styles.resultBanner, isWin ? styles.winBanner : styles.lossBanner]}>
          <MaterialIcons
            name={isWin ? 'check-circle' : 'highlight-off'}
            size={20}
            color={isWin ? '#00D4AA' : '#EF4444'}
          />
          <Text style={[styles.resultBannerText, isWin ? styles.winText : styles.lossText]}>
            {isWin ? 'You won this bet' : 'You lost this bet'}
          </Text>
        </View>
      )}

      {/* Winning Answer - Only for non-participants */}
      {!hasUserParticipated && winningOptionText ? (
        // Did not participate: Just show the winning answer
        <View style={styles.winnerSection}>
          <Text style={styles.sectionLabel}>WINNING ANSWER</Text>
          <View style={styles.winnerCard}>
            <View style={styles.winnerCheckmark}>
              <MaterialIcons name="check" size={20} color="#000" />
            </View>
            <Text style={styles.winnerText}>{winningOptionText}</Text>
          </View>
        </View>
      ) : null}

      {/* All Options List */}
      <View style={styles.allOptionsSection}>
        <Text style={styles.sectionLabel}>ALL OPTIONS</Text>
        <View style={styles.optionsList}>
          {allOptions.map((option, index) => {
            const isWinner = isWinningOption(index);
            const isUserChoice = isUserPick(index);
            const userWonWithThis = isWinner && isUserChoice;
            const userLostWithThis = !isWinner && isUserChoice;

            const voteCount = voteDistribution?.[`OPTION_${index + 1}`] || 0;
            const votePercentage = totalResolvers && totalResolvers > 0 ? (voteCount / totalResolvers) * 100 : 0;
            const hasVoteData = voteDistribution && Object.keys(voteDistribution).length > 0;
            const showVoteBar = totalResolvers && totalResolvers > 1 && hasVoteData;

            return (
              <View
                key={index}
                style={[
                  styles.optionItem,
                  isWinner && styles.winnerOptionItem,
                  userLostWithThis && styles.loserOptionItem,
                ]}
              >
                {/* Top row: indicator, text, badges */}
                <View style={styles.optionTopRow}>
                  {/* Status indicator */}
                  <View
                    style={[
                      styles.optionIndicator,
                      isWinner && styles.winnerIndicator,
                      userLostWithThis && styles.loserIndicator,
                    ]}
                  >
                    {isWinner && <MaterialIcons name="check" size={12} color="#000" />}
                    {userLostWithThis && <MaterialIcons name="close" size={12} color="#fff" />}
                  </View>

                  {/* Option text */}
                  <Text
                    style={[
                      styles.optionText,
                      isWinner && styles.winnerOptionText,
                      userLostWithThis && styles.loserOptionText,
                    ]}
                  >
                    {option}
                  </Text>

                  {/* YOU Badge */}
                  {isUserChoice && hasUserParticipated && (
                    <View style={[styles.youBadge, userWonWithThis ? styles.youBadgeGreen : styles.youBadgeRed]}>
                      <Text style={[styles.youBadgeText, userWonWithThis ? styles.youBadgeTextGreen : styles.youBadgeTextRed]}>
                        YOU
                      </Text>
                    </View>
                  )}
                </View>

                {/* Vote progress bar */}
                {showVoteBar && (
                  <View style={styles.voteBarContainer}>
                    <View style={styles.voteBarBackground}>
                      <View
                        style={[
                          styles.voteBarFill,
                          { width: `${votePercentage}%` },
                          isWinner && styles.voteBarFillWinner,
                        ]}
                      />
                    </View>
                    <Text style={[styles.voteCountText, isWinner && styles.voteCountTextWinner]}>
                      {voteCount}/{totalResolvers} votes
                    </Text>
                  </View>
                )}
              </View>
            );
          })}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderRadius: 18,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },

  // Result Banner
  resultBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 10,
    marginBottom: 16,
    gap: 10,
  },
  winBanner: {
    backgroundColor: 'rgba(0, 212, 170, 0.1)',
  },
  lossBanner: {
    backgroundColor: 'rgba(239, 68, 68, 0.08)',
  },
  resultBannerText: {
    fontSize: 14,
    fontWeight: '600',
  },
  winText: {
    color: '#00D4AA',
  },
  lossText: {
    color: '#EF4444',
  },

  // Cancelled Banner
  cancelledBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 14,
    backgroundColor: 'rgba(156, 163, 175, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(156, 163, 175, 0.2)',
  },
  cancelledIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(156, 163, 175, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  cancelledTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#9ca3af',
    marginBottom: 2,
  },
  cancelledReason: {
    fontSize: 13,
    color: 'rgba(156, 163, 175, 0.8)',
  },

  // Draw Banner - Compact style matching Win/Loss
  drawBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 10,
    backgroundColor: 'rgba(96, 165, 250, 0.1)',
    marginBottom: 16,
    gap: 10,
  },
  drawBannerText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#60a5fa',
  },

  // Comparison Section
  comparisonSection: {
    marginBottom: 20,
  },
  comparisonRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  comparisonCard: {
    flex: 1,
  },
  comparisonLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: 'rgba(255, 255, 255, 0.5)',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  comparisonValueCard: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 10,
    borderWidth: 1.5,
  },
  lossValueCard: {
    backgroundColor: 'rgba(239, 68, 68, 0.08)',
    borderColor: 'rgba(239, 68, 68, 0.3)',
  },
  winValueCard: {
    backgroundColor: 'rgba(0, 212, 170, 0.08)',
    borderColor: 'rgba(0, 212, 170, 0.3)',
  },
  comparisonIcon: {
    marginRight: 8,
  },
  lossValueText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: '#EF4444',
  },
  winValueText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: '#00D4AA',
  },
  comparisonArrow: {
    paddingHorizontal: 8,
  },

  // Winner Section (for wins or non-participants)
  winnerSection: {
    marginBottom: 20,
  },
  winnerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 12,
    backgroundColor: 'rgba(0, 212, 170, 0.1)',
    borderWidth: 1.5,
    borderColor: 'rgba(0, 212, 170, 0.4)',
  },
  winnerCheckmark: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#00D4AA',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  winnerText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: '#00D4AA',
  },
  youBadgeWin: {
    backgroundColor: 'rgba(0, 212, 170, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  youBadgeWinText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#00D4AA',
  },

  // Section Label
  sectionLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: 'rgba(255, 255, 255, 0.5)',
    letterSpacing: 0.5,
    marginBottom: 10,
  },

  // All Options List
  allOptionsSection: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.06)',
    paddingTop: 16,
  },
  optionsList: {
    gap: 8,
  },
  optionItem: {
    padding: 12,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  optionTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  winnerOptionItem: {
    backgroundColor: 'rgba(0, 212, 170, 0.08)',
    borderColor: 'rgba(0, 212, 170, 0.25)',
  },
  loserOptionItem: {
    backgroundColor: 'rgba(239, 68, 68, 0.05)',
    borderColor: 'rgba(239, 68, 68, 0.15)',
  },
  optionIndicator: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  winnerIndicator: {
    backgroundColor: '#00D4AA',
  },
  loserIndicator: {
    backgroundColor: 'rgba(239, 68, 68, 0.5)',
  },
  optionText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.6)',
  },
  winnerOptionText: {
    color: '#00D4AA',
    fontWeight: '600',
  },
  loserOptionText: {
    color: 'rgba(239, 68, 68, 0.8)',
  },
  badgeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flexShrink: 0,
    gap: 8,
  },
  voteBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    gap: 10,
  },
  voteBarBackground: {
    flex: 1,
    height: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 3,
    overflow: 'hidden',
  },
  voteBarFill: {
    height: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 3,
  },
  voteBarFillWinner: {
    backgroundColor: '#00D4AA',
  },
  voteCountText: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.5)',
    minWidth: 55,
  },
  voteCountTextWinner: {
    color: '#00D4AA',
  },
  youBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 5,
  },
  youBadgeGreen: {
    backgroundColor: 'rgba(0, 212, 170, 0.2)',
  },
  youBadgeRed: {
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
  },
  youBadgeText: {
    fontSize: 10,
    fontWeight: '700',
  },
  youBadgeTextGreen: {
    color: '#00D4AA',
  },
  youBadgeTextRed: {
    color: '#EF4444',
  },

  // Draw option items
  drawOptionItem: {
    padding: 12,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  drawOptionIndicator: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    marginRight: 10,
  },
  drawOptionText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.6)',
  },
  youBadgeMuted: {
    backgroundColor: 'rgba(96, 165, 250, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 5,
  },
  youBadgeMutedText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#60a5fa',
  },
});
