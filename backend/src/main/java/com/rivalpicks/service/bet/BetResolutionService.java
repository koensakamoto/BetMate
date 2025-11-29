package com.rivalpicks.service.bet;

import com.rivalpicks.entity.betting.Bet;
import com.rivalpicks.entity.betting.BetParticipation;
import com.rivalpicks.entity.betting.BetResolver;
import com.rivalpicks.entity.betting.BetResolutionVote;
import com.rivalpicks.entity.betting.BetResolutionVoteWinner;
import com.rivalpicks.entity.betting.PredictionResolutionVote;
import com.rivalpicks.entity.user.User;
import com.rivalpicks.event.betting.BetResolvedEvent;
import com.rivalpicks.exception.betting.BetResolutionException;
import com.rivalpicks.repository.betting.BetParticipationRepository;
import com.rivalpicks.repository.betting.BetRepository;
import com.rivalpicks.repository.betting.BetResolverRepository;
import com.rivalpicks.repository.betting.BetResolutionVoteRepository;
import com.rivalpicks.repository.betting.BetResolutionVoteWinnerRepository;
import com.rivalpicks.repository.betting.PredictionResolutionVoteRepository;
import com.rivalpicks.repository.user.UserRepository;
import jakarta.validation.constraints.NotNull;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.validation.annotation.Validated;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * Service for handling bet resolution through different methods:
 * - SELF: Only the bet creator can resolve
 * - ASSIGNED_RESOLVERS: Creator assigns specific users to resolve
 * - PARTICIPANT_VOTE: Participants vote, highest count wins (tie = draw)
 */
@Service
@Validated
@Transactional
public class BetResolutionService {

    private final BetRepository betRepository;
    private final BetResolverRepository betResolverRepository;
    private final BetResolutionVoteRepository betResolutionVoteRepository;
    private final BetResolutionVoteWinnerRepository betResolutionVoteWinnerRepository;
    private final PredictionResolutionVoteRepository predictionResolutionVoteRepository;
    private final BetParticipationRepository betParticipationRepository;
    private final BetParticipationService betParticipationService;
    private final UserRepository userRepository;
    private final ApplicationEventPublisher eventPublisher;

    @Autowired
    public BetResolutionService(
            BetRepository betRepository,
            BetResolverRepository betResolverRepository,
            BetResolutionVoteRepository betResolutionVoteRepository,
            BetResolutionVoteWinnerRepository betResolutionVoteWinnerRepository,
            PredictionResolutionVoteRepository predictionResolutionVoteRepository,
            BetParticipationRepository betParticipationRepository,
            BetParticipationService betParticipationService,
            UserRepository userRepository,
            ApplicationEventPublisher eventPublisher) {
        this.betRepository = betRepository;
        this.betResolverRepository = betResolverRepository;
        this.betResolutionVoteRepository = betResolutionVoteRepository;
        this.betResolutionVoteWinnerRepository = betResolutionVoteWinnerRepository;
        this.predictionResolutionVoteRepository = predictionResolutionVoteRepository;
        this.betParticipationRepository = betParticipationRepository;
        this.betParticipationService = betParticipationService;
        this.userRepository = userRepository;
        this.eventPublisher = eventPublisher;
    }

    // ==========================================
    // RESOLUTION METHODS
    // ==========================================

    /**
     * Resolves a bet using the configured resolution method.
     * For consensus voting, use voteOnBetResolution() instead.
     */
    public Bet resolveBet(@NotNull Long betId, @NotNull User resolver, @NotNull Bet.BetOutcome outcome, String reasoning) {
        Bet bet = getBetForResolution(betId);

        switch (bet.getResolutionMethod()) {
            case SELF -> {
                return resolveByCreator(bet, resolver, outcome);
            }
            case ASSIGNED_RESOLVERS -> {
                return resolveByAssignedResolver(bet, resolver, outcome, reasoning);
            }
            case PARTICIPANT_VOTE -> {
                throw new BetResolutionException("Use voteOnBetResolution() for participant voting");
            }
            default -> throw new BetResolutionException("Unknown resolution method: " + bet.getResolutionMethod());
        }
    }

    /**
     * Resolves a bet by selecting specific winner user IDs.
     * Used for PREDICTION bets where resolver picks which users had correct predictions.
     */
    public Bet resolveBetByWinners(@NotNull Long betId, @NotNull User resolver, @NotNull List<Long> winnerUserIds, String reasoning) {
        Bet bet = getBetForResolution(betId);

        // Verify user has permission to resolve
        if (!canUserResolveBet(betId, resolver)) {
            throw new BetResolutionException("User is not authorized to resolve this bet");
        }

        if (winnerUserIds == null || winnerUserIds.isEmpty()) {
            throw new BetResolutionException("At least one winner must be selected");
        }

        // Get all participations for this bet
        List<BetParticipation> allParticipations = betParticipationRepository.findByBetId(betId);

        // Verify all winner IDs correspond to actual participants
        List<Long> participantUserIds = allParticipations.stream()
            .map(BetParticipation::getUserId)
            .toList();

        for (Long winnerId : winnerUserIds) {
            if (!participantUserIds.contains(winnerId)) {
                throw new BetResolutionException("User ID " + winnerId + " is not a participant in this bet");
            }
        }

        // Mark selected users as winners (but don't settle yet - just set the status)
        for (BetParticipation participation : allParticipations) {
            if (winnerUserIds.contains(participation.getUserId())) {
                // This is a winner
                participation.setStatus(BetParticipation.ParticipationStatus.WON);
            } else {
                // This is a loser
                participation.setStatus(BetParticipation.ParticipationStatus.LOST);
            }
            betParticipationRepository.save(participation);
        }

        // Mark bet as resolved (use OPTION_1 as placeholder since there's no specific option)
        bet.resolve(Bet.BetOutcome.OPTION_1);
        bet = betRepository.save(bet);

        // Settle all participations (calculate winnings, update user stats)
        betParticipationService.settleParticipationsForResolvedBet(bet);

        // Publish bet resolved event for notifications
        publishBetResolvedEvent(bet, resolver.getId());

        return bet;
    }

    /**
     * Creator-Only Resolution: Only the bet creator can resolve.
     */
    private Bet resolveByCreator(Bet bet, User resolver, Bet.BetOutcome outcome) {
        if (!bet.isCreator(resolver)) {
            throw new BetResolutionException("Only the bet creator can resolve this bet");
        }

        bet.resolve(outcome);
        bet = betRepository.save(bet);

        // Settle all participations (calculate winnings, update user stats)
        betParticipationService.settleParticipationsForResolvedBet(bet);

        // Publish bet resolved event for notifications
        publishBetResolvedEvent(bet, resolver.getId());

        return bet;
    }

    /**
     * Assigned Resolver Resolution: Only assigned resolvers can resolve.
     */
    private Bet resolveByAssignedResolver(Bet bet, User resolver, Bet.BetOutcome outcome, String reasoning) {
        BetResolver betResolver = betResolverRepository
            .findByBetAndResolverAndIsActiveTrue(bet, resolver)
            .orElseThrow(() -> new BetResolutionException("User is not authorized to resolve this bet"));

        if (!betResolver.canResolveIndependently()) {
            throw new BetResolutionException("Resolver can only vote, cannot resolve independently");
        }

        bet.resolve(outcome);
        bet = betRepository.save(bet);

        // Settle all participations (calculate winnings, update user stats)
        betParticipationService.settleParticipationsForResolvedBet(bet);

        // Publish bet resolved event for notifications
        publishBetResolvedEvent(bet, resolver.getId());

        return bet;
    }

    // ==========================================
    // CONSENSUS VOTING
    // ==========================================

    /**
     * Consensus Voting: Submit a vote for bet resolution.
     */
    public BetResolutionVote voteOnBetResolution(@NotNull Long betId, @NotNull User voter,
                                                @NotNull Bet.BetOutcome outcome, String reasoning) {
        Bet bet = getBetForResolution(betId);

        // Resolution method determines WHO can vote, not whether voting is allowed
        // canUserVoteOnBet() validates if this user is authorized to vote
        if (!canUserVoteOnBet(bet, voter)) {
            throw new BetResolutionException("User is not authorized to vote on this bet");
        }
        
        // Check for existing vote
        BetResolutionVote existingVote = betResolutionVoteRepository
            .findByBetAndVoterAndIsActiveTrue(bet, voter)
            .orElse(null);
        
        if (existingVote != null) {
            // Update existing vote
            existingVote.updateVote(outcome, reasoning);
            BetResolutionVote savedVote = betResolutionVoteRepository.save(existingVote);

            // Check if consensus reached (pass voter so they don't get notified if their vote triggers resolution)
            checkAndResolveIfConsensusReached(bet, voter);

            return savedVote;
        } else {
            // Create new vote
            BetResolutionVote vote = new BetResolutionVote();
            vote.setBet(bet);
            vote.setVoter(voter);
            vote.setVotedOutcome(outcome);
            vote.setReasoning(reasoning);

            BetResolutionVote savedVote = betResolutionVoteRepository.save(vote);

            // Check if consensus reached (pass voter so they don't get notified if their vote triggers resolution)
            checkAndResolveIfConsensusReached(bet, voter);

            return savedVote;
        }
    }

    /**
     * Gets current vote counts for a bet (works for both pending and resolved bets).
     */
    @Transactional(readOnly = true)
    public Map<Bet.BetOutcome, Long> getVoteCounts(@NotNull Long betId) {
        Bet bet = betRepository.findById(betId)
            .filter(b -> !b.isDeleted())
            .orElseThrow(() -> new BetResolutionException("Bet not found: " + betId));

        List<Object[]> results = betResolutionVoteRepository.getValidVoteDistributionByBet(bet);

        return results.stream()
            .collect(Collectors.toMap(
                row -> (Bet.BetOutcome) row[0],
                row -> (Long) row[1]
            ));
    }

    // ==========================================
    // ASSIGNED RESOLVER MANAGEMENT
    // ==========================================

    /**
     * Assigns a resolver to a bet (Creator-Only operation).
     */
    public BetResolver assignResolver(@NotNull Long betId, @NotNull User assigner, 
                                     @NotNull User resolver, String reason, boolean canVoteOnly) {
        Bet bet = getBetForResolution(betId);
        
        if (!bet.isCreator(assigner)) {
            throw new BetResolutionException("Only the bet creator can assign resolvers");
        }
        
        if (bet.getResolutionMethod() != Bet.BetResolutionMethod.ASSIGNED_RESOLVERS) {
            throw new BetResolutionException("Bet does not use assigned resolvers method");
        }
        
        // Check if already assigned
        if (betResolverRepository.existsByBetAndResolverAndIsActiveTrue(bet, resolver)) {
            throw new BetResolutionException("User is already assigned as resolver");
        }
        
        BetResolver betResolver = new BetResolver();
        betResolver.setBet(bet);
        betResolver.setResolver(resolver);
        betResolver.setAssignedBy(assigner);
        betResolver.setAssignmentReason(reason);
        betResolver.setCanVoteOnly(canVoteOnly);
        
        return betResolverRepository.save(betResolver);
    }

    /**
     * Revokes a resolver assignment.
     */
    public void revokeResolver(@NotNull Long betId, @NotNull User revoker, @NotNull User resolver) {
        Bet bet = getBetForResolution(betId);
        
        if (!bet.isCreator(revoker)) {
            throw new BetResolutionException("Only the bet creator can revoke resolvers");
        }
        
        BetResolver betResolver = betResolverRepository
            .findByBetAndResolverAndIsActiveTrue(bet, resolver)
            .orElseThrow(() -> new BetResolutionException("Resolver assignment not found"));
        
        betResolver.revoke();
        betResolverRepository.save(betResolver);
    }

    // ==========================================
    // QUERY METHODS
    // ==========================================

    /**
     * Gets all active resolvers for a bet.
     */
    @Transactional(readOnly = true)
    public List<BetResolver> getActiveResolvers(@NotNull Long betId) {
        Bet bet = betRepository.findById(betId)
            .filter(b -> !b.isDeleted())
            .orElseThrow(() -> new BetResolutionException("Bet not found: " + betId));
        
        return betResolverRepository.findByBetAndIsActiveTrue(bet);
    }

    /**
     * Gets all active votes for a bet.
     */
    @Transactional(readOnly = true)
    public List<BetResolutionVote> getActiveVotes(@NotNull Long betId) {
        Bet bet = betRepository.findById(betId)
            .filter(b -> !b.isDeleted())
            .orElseThrow(() -> new BetResolutionException("Bet not found: " + betId));
        
        return betResolutionVoteRepository.findByBetAndIsActiveTrue(bet);
    }

    /**
     * Checks if a user can resolve a bet using any method.
     */
    @Transactional(readOnly = true)
    public boolean canUserResolveBet(@NotNull Long betId, @NotNull User user) {
        Bet bet = betRepository.findById(betId)
            .filter(b -> !b.isDeleted())
            .orElse(null);
        
        if (bet == null || bet.isResolved()) {
            return false;
        }
        
        switch (bet.getResolutionMethod()) {
            case SELF -> {
                return bet.isCreator(user);
            }
            case ASSIGNED_RESOLVERS -> {
                return betResolverRepository.findByBetAndResolverAndIsActiveTrue(bet, user)
                    .map(BetResolver::canResolveIndependently)
                    .orElse(false);
            }
            case PARTICIPANT_VOTE -> {
                return canUserVoteOnBet(bet, user);
            }
            default -> {
                return false;
            }
        }
    }

    // ==========================================
    // PRIVATE HELPER METHODS
    // ==========================================

    private Bet getBetForResolution(Long betId) {
        Bet bet = betRepository.findById(betId)
            .filter(b -> !b.isDeleted())
            .orElseThrow(() -> new BetResolutionException("Bet not found: " + betId));
        
        if (bet.isResolved()) {
            throw new BetResolutionException("Bet is already resolved");
        }
        
        if (bet.getStatus() == Bet.BetStatus.CANCELLED) {
            throw new BetResolutionException("Cannot resolve cancelled bet");
        }
        
        return bet;
    }

    private boolean canUserVoteOnBet(Bet bet, User user) {
        // Creator can vote if allowed
        if (bet.isCreator(user) && bet.getAllowCreatorVote() != null && bet.getAllowCreatorVote()) {
            return true;
        }

        // Assigned resolvers can vote (participants are auto-added as resolvers for PARTICIPANT_VOTE bets)
        return betResolverRepository.findByBetAndResolverAndIsActiveTrue(bet, user)
            .map(BetResolver::canVoteInConsensus)
            .orElse(false);
    }

    /**
     * Checks if all resolvers have voted on a CONSENSUS_VOTING bet
     * and automatically resolves it if all votes are in.
     *
     * Resolution logic:
     * - Wait for ALL resolvers to vote
     * - Option with highest vote count wins
     * - If tie for highest votes → DRAW
     *
     * @param bet The bet to check for resolution
     * @param triggeringVoter The user whose vote may have triggered the resolution (used to skip notification)
     * @return true if the bet was resolved, false otherwise
     */
    public boolean checkAndResolveIfConsensusReached(Bet bet, User triggeringVoter) {
        // Get total number of resolvers who can vote
        long totalResolvers = getTotalResolverCount(bet);

        // Get current vote count
        Map<Bet.BetOutcome, Long> voteCounts = getVoteCounts(bet.getId());
        long totalVotes = voteCounts.values().stream().mapToLong(Long::longValue).sum();

        // Only resolve if ALL resolvers have voted
        if (totalVotes < totalResolvers) {
            return false;
        }

        // All resolvers voted - resolve the bet
        return resolveWithCurrentVotes(bet, voteCounts, triggeringVoter);
    }

    /**
     * Resolves a bet based on current votes, used when:
     * - All resolvers have voted, OR
     * - Resolution deadline has been reached
     *
     * @param bet The bet to resolve
     * @param triggeringVoter The user whose action triggered resolution (can be null for deadline)
     * @return true if resolved, false otherwise
     */
    public boolean resolveWithCurrentVotes(Bet bet, User triggeringVoter) {
        Map<Bet.BetOutcome, Long> voteCounts = getVoteCounts(bet.getId());
        return resolveWithCurrentVotes(bet, voteCounts, triggeringVoter);
    }

    /**
     * Internal method to resolve bet with given vote counts.
     *
     * Logic:
     * - No votes → DRAW
     * - One option with highest votes → That option wins
     * - Tie for highest votes → DRAW
     */
    private boolean resolveWithCurrentVotes(Bet bet, Map<Bet.BetOutcome, Long> voteCounts, User triggeringVoter) {
        Bet.BetOutcome outcome;

        if (voteCounts.isEmpty()) {
            // No votes cast → DRAW
            outcome = Bet.BetOutcome.DRAW;
        } else {
            // Find the highest vote count
            long maxVotes = voteCounts.values().stream()
                .mapToLong(Long::longValue)
                .max()
                .orElse(0);

            // Find all outcomes with the highest vote count
            List<Bet.BetOutcome> topOutcomes = voteCounts.entrySet().stream()
                .filter(e -> e.getValue() == maxVotes)
                .map(Map.Entry::getKey)
                .toList();

            if (topOutcomes.size() == 1) {
                // Single winner
                outcome = topOutcomes.get(0);
            } else {
                // Tie for highest votes → DRAW
                outcome = Bet.BetOutcome.DRAW;
            }
        }

        bet.resolve(outcome);
        bet = betRepository.save(bet);

        // Settle all participations (calculate winnings, update user stats)
        betParticipationService.settleParticipationsForResolvedBet(bet);

        // Publish bet resolved event for notifications
        Long triggeringVoterId = triggeringVoter != null ? triggeringVoter.getId() : null;
        publishBetResolvedEvent(bet, triggeringVoterId);

        return true;
    }

    /**
     * Gets the total number of users who can vote on a consensus bet.
     * Everyone who can vote is a BetResolver (participants are auto-added when they place a bet).
     */
    private long getTotalResolverCount(Bet bet) {
        return betResolverRepository.countActiveResolversByBet(bet);
    }

    /**
     * Publishes a bet resolved event for notification processing.
     * @param bet The bet that was resolved
     * @param resolvedById The user ID of the resolver, or null for consensus voting
     */
    private void publishBetResolvedEvent(Bet bet, Long resolvedById) {
        try {
            // Get all bet participations to determine winners, losers, and draws
            List<BetParticipation> participations = betParticipationRepository.findByBetId(bet.getId());

            List<Long> winnerIds = participations.stream()
                .filter(BetParticipation::isWinner)
                .map(BetParticipation::getUserId)
                .toList();

            List<Long> loserIds = participations.stream()
                .filter(BetParticipation::isLoser)
                .map(BetParticipation::getUserId)
                .toList();

            List<Long> drawIds = participations.stream()
                .filter(BetParticipation::isDraw)
                .map(BetParticipation::getUserId)
                .toList();

            // Calculate payouts for winners
            Map<Long, BigDecimal> payouts = participations.stream()
                .filter(p -> winnerIds.contains(p.getUserId()))
                .collect(Collectors.toMap(
                    BetParticipation::getUserId,
                    p -> p.getPotentialWinnings() != null ? p.getPotentialWinnings() : BigDecimal.ZERO
                ));

            // Add negative amounts for losers
            participations.stream()
                .filter(p -> loserIds.contains(p.getUserId()))
                .forEach(p -> payouts.put(p.getUserId(), p.getBetAmount().negate()));

            // Draws get their stake back (zero net change)
            participations.stream()
                .filter(p -> drawIds.contains(p.getUserId()))
                .forEach(p -> payouts.put(p.getUserId(), BigDecimal.ZERO));

            String resolution = bet.getOutcome() != null ? bet.getOutcome().name() : "Unknown";

            BetResolvedEvent event = new BetResolvedEvent(
                bet.getId(),
                bet.getTitle(),
                bet.getGroup().getId(),
                bet.getGroup().getName(),
                winnerIds,
                loserIds,
                drawIds,
                payouts,
                resolution,
                resolvedById
            );

            eventPublisher.publishEvent(event);
        } catch (Exception e) {
            // Don't fail bet resolution if event publishing fails
            // Silent failure - event publishing is not critical
        }
    }

    // ==========================================
    // PREDICTION BET RESOLUTION
    // ==========================================

    /**
     * Submit a vote on whether a participant's prediction was correct.
     * Used for PREDICTION bets with multiple resolvers.
     *
     * @param betId The bet ID
     * @param resolver The user casting the vote
     * @param participationId The participation being voted on
     * @param isCorrect Whether the prediction was correct
     * @return The created or updated vote
     */
    public PredictionResolutionVote voteOnPrediction(@NotNull Long betId, @NotNull User resolver,
                                                      @NotNull Long participationId, @NotNull Boolean isCorrect) {
        Bet bet = getBetForResolution(betId);

        // Verify bet is a PREDICTION type
        if (bet.getBetType() != Bet.BetType.PREDICTION) {
            throw new BetResolutionException("This method is only for PREDICTION bets");
        }

        // Verify user can vote on this bet
        if (!canUserVoteOnBet(bet, resolver)) {
            throw new BetResolutionException("User is not authorized to vote on this bet");
        }

        // Get the participation
        BetParticipation participation = betParticipationRepository.findById(participationId)
            .orElseThrow(() -> new BetResolutionException("Participation not found: " + participationId));

        // Verify participation belongs to this bet
        if (!participation.getBet().getId().equals(betId)) {
            throw new BetResolutionException("Participation does not belong to this bet");
        }

        // Prevent self-voting
        if (participation.getUserId().equals(resolver.getId())) {
            throw new BetResolutionException("Resolvers cannot vote on their own prediction");
        }

        // Check for existing vote
        PredictionResolutionVote existingVote = predictionResolutionVoteRepository
            .findByBetAndResolverAndParticipationAndIsActiveTrue(bet, resolver, participation)
            .orElse(null);

        if (existingVote != null) {
            // Update existing vote
            existingVote.updateVote(isCorrect);
            PredictionResolutionVote savedVote = predictionResolutionVoteRepository.save(existingVote);

            // Check if all votes are in and resolve if so
            checkAndResolvePredictionBet(bet, resolver);

            return savedVote;
        } else {
            // Create new vote
            PredictionResolutionVote vote = new PredictionResolutionVote();
            vote.setBet(bet);
            vote.setResolver(resolver);
            vote.setParticipation(participation);
            vote.setIsCorrect(isCorrect);

            PredictionResolutionVote savedVote = predictionResolutionVoteRepository.save(vote);

            // Check if all votes are in and resolve if so
            checkAndResolvePredictionBet(bet, resolver);

            return savedVote;
        }
    }

    /**
     * Check if all resolvers have voted on all participants and resolve if so.
     *
     * @param bet The bet to check
     * @param triggeringVoter The voter who triggered this check
     * @return true if bet was resolved
     */
    public boolean checkAndResolvePredictionBet(Bet bet, User triggeringVoter) {
        // Get all participations (excluding creator participation if they can't be voted on)
        List<BetParticipation> participations = betParticipationRepository.findByBetId(bet.getId());

        // Get total resolvers
        long totalResolvers = getTotalResolverCount(bet);

        // For each participation, calculate expected votes
        // Each resolver votes on each participation EXCEPT their own
        long totalExpectedVotes = 0;
        for (BetParticipation participation : participations) {
            // Count resolvers who can vote on this participation (all except the participant themselves)
            long resolversForThisParticipation = totalResolvers;

            // If participant is a resolver, they can't vote on themselves
            if (isUserAResolver(bet, participation.getUser())) {
                resolversForThisParticipation--;
            }

            totalExpectedVotes += resolversForThisParticipation;
        }

        // Get actual vote count
        long actualVotes = predictionResolutionVoteRepository.countActiveVotesByBet(bet);

        // Only resolve if all expected votes are in
        if (actualVotes < totalExpectedVotes) {
            return false;
        }

        // All votes are in - resolve the bet
        return resolvePredictionBetWithCurrentVotes(bet, triggeringVoter);
    }

    /**
     * Resolve a prediction bet based on current votes.
     * Used when all votes are in OR deadline is reached.
     *
     * Logic per participant:
     * - >50% correct votes → WINNER
     * - =50% correct votes → DRAW
     * - <50% correct votes → LOSER
     * - No votes → DRAW
     *
     * @param bet The bet to resolve
     * @param triggeringVoter The user who triggered resolution (null for deadline)
     * @return true if resolved
     */
    public boolean resolvePredictionBetWithCurrentVotes(Bet bet, User triggeringVoter) {
        List<BetParticipation> participations = betParticipationRepository.findByBetId(bet.getId());

        // Get vote distribution for all participations
        List<Object[]> voteDistribution = predictionResolutionVoteRepository.getVoteDistributionByBet(bet);

        // Create map of participationId -> [correctCount, incorrectCount]
        Map<Long, long[]> voteCounts = voteDistribution.stream()
            .collect(Collectors.toMap(
                row -> (Long) row[0],
                row -> new long[] {
                    ((Number) row[1]).longValue(),  // correct count
                    ((Number) row[2]).longValue()   // incorrect count
                }
            ));

        // Determine outcome for each participant
        for (BetParticipation participation : participations) {
            long[] counts = voteCounts.get(participation.getId());

            BetParticipation.ParticipationStatus status;

            if (counts == null || (counts[0] == 0 && counts[1] == 0)) {
                // No votes → DRAW
                status = BetParticipation.ParticipationStatus.DRAW;
            } else {
                long correctVotes = counts[0];
                long totalVotes = counts[0] + counts[1];
                double correctPercentage = (double) correctVotes / totalVotes * 100;

                if (correctPercentage > 50) {
                    status = BetParticipation.ParticipationStatus.WON;
                } else if (correctPercentage == 50) {
                    status = BetParticipation.ParticipationStatus.DRAW;
                } else {
                    status = BetParticipation.ParticipationStatus.LOST;
                }
            }

            participation.setStatus(status);
            betParticipationRepository.save(participation);
        }

        // Mark bet as resolved
        bet.resolve(Bet.BetOutcome.OPTION_1); // Use OPTION_1 as placeholder for prediction bets
        bet = betRepository.save(bet);

        // Settle all participations (calculate winnings, update user stats)
        betParticipationService.settleParticipationsForResolvedBet(bet);

        // Publish bet resolved event
        Long triggeringVoterId = triggeringVoter != null ? triggeringVoter.getId() : null;
        publishBetResolvedEvent(bet, triggeringVoterId);

        return true;
    }

    /**
     * Check if a user is a resolver for a bet (either assigned or creator with vote permission).
     */
    private boolean isUserAResolver(Bet bet, User user) {
        if (user == null) {
            return false;
        }

        // Check if creator with vote permission
        if (bet.isCreator(user) && bet.getAllowCreatorVote() != null && bet.getAllowCreatorVote()) {
            return true;
        }

        // Check if assigned resolver
        return betResolverRepository.existsByBetAndResolverAndIsActiveTrue(bet, user);
    }

    // ==========================================
    // WINNER-BASED PREDICTION VOTING
    // ==========================================

    /**
     * Submit a vote for PREDICTION bet resolution by selecting winners.
     * Each resolver selects which participants they believe are winners.
     * When all resolvers have voted, consensus determines final winners.
     *
     * @param betId The bet ID
     * @param voter The user casting the vote
     * @param winnerUserIds List of user IDs selected as winners
     * @param reasoning Optional reasoning for the vote
     * @return The created or updated vote
     */
    public BetResolutionVote voteOnPredictionResolution(@NotNull Long betId, @NotNull User voter,
                                                        @NotNull List<Long> winnerUserIds, String reasoning) {
        Bet bet = getBetForResolution(betId);

        // Verify bet is a PREDICTION type
        if (bet.getBetType() != Bet.BetType.PREDICTION) {
            throw new BetResolutionException("This method is only for PREDICTION bets");
        }
        // Resolution method determines WHO can vote, not whether voting is allowed
        // canUserVoteOnBet() validates if this user is authorized to vote

        // Verify user can vote on this bet
        if (!canUserVoteOnBet(bet, voter)) {
            throw new BetResolutionException("User is not authorized to vote on this bet");
        }

        // Validate winner IDs are actual participants
        List<BetParticipation> participations = betParticipationRepository.findByBetId(betId);
        List<Long> participantUserIds = participations.stream()
            .map(BetParticipation::getUserId)
            .toList();

        for (Long winnerId : winnerUserIds) {
            if (!participantUserIds.contains(winnerId)) {
                throw new BetResolutionException("User ID " + winnerId + " is not a participant in this bet");
            }
        }

        // Check for existing vote
        BetResolutionVote existingVote = betResolutionVoteRepository
            .findByBetAndVoterAndIsActiveTrue(bet, voter)
            .orElse(null);

        BetResolutionVote savedVote;

        if (existingVote != null) {
            // Update existing vote - clear old winner selections
            existingVote.clearWinnerVotes();
            existingVote.setReasoning(reasoning);
            savedVote = betResolutionVoteRepository.save(existingVote);

            // Delete old winner entries from join table
            betResolutionVoteWinnerRepository.deleteByVote(existingVote);
        } else {
            // Create new vote
            BetResolutionVote vote = new BetResolutionVote();
            vote.setBet(bet);
            vote.setVoter(voter);
            vote.setVotedOutcome(null);  // No outcome for prediction bets
            vote.setReasoning(reasoning);
            savedVote = betResolutionVoteRepository.save(vote);
        }

        // Add winner selections to join table
        for (Long winnerId : winnerUserIds) {
            User winnerUser = userRepository.findById(winnerId)
                .orElseThrow(() -> new BetResolutionException("Winner user not found: " + winnerId));

            BetResolutionVoteWinner winnerVote = new BetResolutionVoteWinner(savedVote, winnerUser);
            betResolutionVoteWinnerRepository.save(winnerVote);
        }

        // Check if consensus reached
        checkAndResolveIfPredictionWinnerConsensusReached(bet, voter);

        return savedVote;
    }

    /**
     * Check if all resolvers have submitted winner votes for a PREDICTION bet.
     * If all votes are in, resolve the bet using majority consensus.
     *
     * @param bet The bet to check
     * @param triggeringVoter The voter who triggered this check
     * @return true if bet was resolved
     */
    public boolean checkAndResolveIfPredictionWinnerConsensusReached(Bet bet, User triggeringVoter) {
        // Get total number of resolvers
        long totalResolvers = getTotalResolverCount(bet);

        // Count how many resolvers have submitted winner votes
        // A vote counts if it has winner selections in the join table
        long votesWithWinners = betResolutionVoteWinnerRepository.countVotesWithWinnerSelectionsForBet(bet);

        // Only resolve if ALL resolvers have voted
        if (votesWithWinners < totalResolvers) {
            return false;
        }

        // All resolvers voted - resolve using consensus
        return resolvePredictionBetWithWinnerVotes(bet, triggeringVoter);
    }

    /**
     * Resolve a PREDICTION bet based on winner vote consensus.
     * Used when all resolvers have voted OR deadline is reached.
     *
     * Consensus Logic per participant:
     * - >50% of resolvers voted for them → WINNER
     * - =50% of resolvers voted for them → DRAW (neither won nor lost)
     * - <50% of resolvers voted for them → LOSER
     *
     * @param bet The bet to resolve
     * @param triggeringVoter The user who triggered resolution (null for deadline)
     * @return true if resolved
     */
    public boolean resolvePredictionBetWithWinnerVotes(Bet bet, User triggeringVoter) {
        // Get total number of resolvers who actually voted (with winner selections)
        long totalVoters = betResolutionVoteWinnerRepository.countVotesWithWinnerSelectionsForBet(bet);

        // Get vote distribution: userId -> number of resolvers who selected them
        List<Object[]> voteDistribution = betResolutionVoteWinnerRepository.getWinnerVoteDistributionForBet(bet);

        // Convert to map for easy lookup
        Map<Long, Long> userVoteCounts = voteDistribution.stream()
            .collect(java.util.stream.Collectors.toMap(
                row -> (Long) row[0],
                row -> ((Number) row[1]).longValue()
            ));

        // Get all participations
        List<BetParticipation> participations = betParticipationRepository.findByBetId(bet.getId());

        // Calculate half for comparison (for 2 voters, half = 1)
        // Winner: votes > half (e.g., 2 > 1)
        // Draw: votes == half (e.g., 1 == 1) - only possible with even number of voters
        // Loser: votes < half (e.g., 0 < 1)
        double half = totalVoters / 2.0;

        boolean hasAnyWinner = false;

        for (BetParticipation participation : participations) {
            long votesForUser = userVoteCounts.getOrDefault(participation.getUserId(), 0L);

            if (votesForUser > half) {
                // >50% voted for them → WINNER
                participation.setStatus(BetParticipation.ParticipationStatus.WON);
                hasAnyWinner = true;
            } else if (votesForUser == half && totalVoters > 0 && totalVoters % 2 == 0) {
                // Exactly 50% (only possible with even number of voters) → DRAW
                participation.setStatus(BetParticipation.ParticipationStatus.DRAW);
            } else {
                // <50% → LOSER
                participation.setStatus(BetParticipation.ParticipationStatus.LOST);
            }
            betParticipationRepository.save(participation);
        }

        // Set bet outcome based on whether any winners exist
        if (hasAnyWinner) {
            bet.resolve(Bet.BetOutcome.OPTION_1);  // Placeholder outcome for prediction bets with winners
        } else {
            bet.resolve(Bet.BetOutcome.DRAW);  // No majority winners
        }

        bet = betRepository.save(bet);

        // Settle all participations (calculate winnings, update user stats)
        betParticipationService.settleParticipationsForResolvedBet(bet);

        // Publish bet resolved event
        Long triggeringVoterId = triggeringVoter != null ? triggeringVoter.getId() : null;
        publishBetResolvedEvent(bet, triggeringVoterId);

        return true;
    }

}