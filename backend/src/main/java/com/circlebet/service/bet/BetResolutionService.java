package com.circlebet.service.bet;

import com.circlebet.entity.betting.Bet;
import com.circlebet.entity.betting.BetResolver;
import com.circlebet.entity.betting.BetResolutionVote;
import com.circlebet.entity.user.User;
import com.circlebet.exception.betting.BetResolutionException;
import com.circlebet.repository.betting.BetRepository;
import com.circlebet.repository.betting.BetResolverRepository;
import com.circlebet.repository.betting.BetResolutionVoteRepository;
import jakarta.validation.constraints.NotNull;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.validation.annotation.Validated;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * Service for handling bet resolution through different methods:
 * - Creator-Only Resolution: Only the bet creator can resolve
 * - Assigned Resolver Resolution: Creator assigns specific users to resolve  
 * - Consensus Voting Resolution: Multiple people vote, majority decides
 */
@Service
@Validated
@Transactional
public class BetResolutionService {

    private final BetRepository betRepository;
    private final BetResolverRepository betResolverRepository;
    private final BetResolutionVoteRepository betResolutionVoteRepository;

    @Autowired
    public BetResolutionService(
            BetRepository betRepository,
            BetResolverRepository betResolverRepository,
            BetResolutionVoteRepository betResolutionVoteRepository) {
        this.betRepository = betRepository;
        this.betResolverRepository = betResolverRepository;
        this.betResolutionVoteRepository = betResolutionVoteRepository;
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
            case CREATOR_ONLY -> {
                return resolveByCreator(bet, resolver, outcome);
            }
            case ASSIGNED_RESOLVER -> {
                return resolveByAssignedResolver(bet, resolver, outcome, reasoning);
            }
            case CONSENSUS_VOTING -> {
                throw new BetResolutionException("Use voteOnBetResolution() for consensus voting");
            }
            default -> throw new BetResolutionException("Unknown resolution method: " + bet.getResolutionMethod());
        }
    }

    /**
     * Creator-Only Resolution: Only the bet creator can resolve.
     */
    private Bet resolveByCreator(Bet bet, User resolver, Bet.BetOutcome outcome) {
        if (!bet.isCreator(resolver)) {
            throw new BetResolutionException("Only the bet creator can resolve this bet");
        }
        
        bet.resolve(outcome);
        return betRepository.save(bet);
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
        return betRepository.save(bet);
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
        
        if (bet.getResolutionMethod() != Bet.BetResolutionMethod.CONSENSUS_VOTING) {
            throw new BetResolutionException("Bet does not use consensus voting");
        }
        
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
            
            // Check if consensus reached
            checkAndResolveIfConsensusReached(bet);
            
            return savedVote;
        } else {
            // Create new vote
            BetResolutionVote vote = new BetResolutionVote();
            vote.setBet(bet);
            vote.setVoter(voter);
            vote.setVotedOutcome(outcome);
            vote.setReasoning(reasoning);
            
            BetResolutionVote savedVote = betResolutionVoteRepository.save(vote);
            
            // Check if consensus reached
            checkAndResolveIfConsensusReached(bet);
            
            return savedVote;
        }
    }

    /**
     * Gets current vote counts for a consensus bet.
     */
    @Transactional(readOnly = true)
    public Map<Bet.BetOutcome, Long> getVoteCounts(@NotNull Long betId) {
        Bet bet = getBetForResolution(betId);
        
        if (bet.getResolutionMethod() != Bet.BetResolutionMethod.CONSENSUS_VOTING) {
            throw new BetResolutionException("Bet does not use consensus voting");
        }
        
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
        
        if (bet.getResolutionMethod() != Bet.BetResolutionMethod.ASSIGNED_RESOLVER) {
            throw new BetResolutionException("Bet does not use assigned resolver method");
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
            case CREATOR_ONLY -> {
                return bet.isCreator(user);
            }
            case ASSIGNED_RESOLVER -> {
                return betResolverRepository.findByBetAndResolverAndIsActiveTrue(bet, user)
                    .map(BetResolver::canResolveIndependently)
                    .orElse(false);
            }
            case CONSENSUS_VOTING -> {
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
        if (bet.isCreator(user) && bet.getAllowCreatorVote()) {
            return true;
        }
        
        // Assigned resolvers can vote
        return betResolverRepository.findByBetAndResolverAndIsActiveTrue(bet, user)
            .map(BetResolver::canVoteInConsensus)
            .orElse(false);
    }

    private void checkAndResolveIfConsensusReached(Bet bet) {
        Map<Bet.BetOutcome, Long> voteCounts = getVoteCounts(bet.getId());
        
        if (voteCounts.isEmpty()) {
            return;
        }
        
        long totalVotes = voteCounts.values().stream().mapToLong(Long::longValue).sum();
        
        // Check if minimum votes requirement met
        if (totalVotes < bet.getMinimumVotesRequired()) {
            return;
        }
        
        // Find outcome with most votes
        Bet.BetOutcome winningOutcome = voteCounts.entrySet().stream()
            .max(Map.Entry.comparingByValue())
            .map(Map.Entry::getKey)
            .orElse(null);
        
        if (winningOutcome == null) {
            return;
        }
        
        long winningVotes = voteCounts.get(winningOutcome);
        
        // Check if majority (more than half of total votes)
        if (winningVotes > totalVotes / 2) {
            bet.resolve(winningOutcome);
            betRepository.save(bet);
        }
    }

    // ==========================================
    // EXCEPTION CLASS
    // ==========================================

}