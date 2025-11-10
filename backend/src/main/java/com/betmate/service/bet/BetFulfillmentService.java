package com.betmate.service.bet;

import com.betmate.entity.betting.Bet;
import com.betmate.entity.betting.BetFulfillment;
import com.betmate.entity.betting.BetParticipation;
import com.betmate.entity.betting.FulfillmentStatus;
import com.betmate.entity.user.User;
import com.betmate.exception.betting.BetFulfillmentException;
import com.betmate.repository.betting.BetFulfillmentRepository;
import com.betmate.repository.betting.BetParticipationRepository;
import com.betmate.repository.betting.BetRepository;
import com.betmate.repository.user.UserRepository;
import jakarta.validation.constraints.NotNull;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.validation.annotation.Validated;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

/**
 * Service for managing social bet fulfillment tracking.
 * Handles winner confirmations, loser claims, and status updates.
 */
@Service
@Validated
@Transactional
public class BetFulfillmentService {

    private final BetRepository betRepository;
    private final BetParticipationRepository participationRepository;
    private final BetFulfillmentRepository fulfillmentRepository;
    private final UserRepository userRepository;

    @Autowired
    public BetFulfillmentService(BetRepository betRepository,
                                 BetParticipationRepository participationRepository,
                                 BetFulfillmentRepository fulfillmentRepository,
                                 UserRepository userRepository) {
        this.betRepository = betRepository;
        this.participationRepository = participationRepository;
        this.fulfillmentRepository = fulfillmentRepository;
        this.userRepository = userRepository;
    }

    /**
     * Get all winners for a bet (users with status = WON).
     *
     * @param bet the bet
     * @return list of winning participations
     */
    public List<BetParticipation> getWinners(@NotNull Bet bet) {
        return participationRepository.findByBetAndStatus(bet, BetParticipation.ParticipationStatus.WON);
    }

    /**
     * Get all losers for a bet (users with status = LOST).
     *
     * @param bet the bet
     * @return list of losing participations
     */
    public List<BetParticipation> getLosers(@NotNull Bet bet) {
        return participationRepository.findByBetAndStatus(bet, BetParticipation.ParticipationStatus.LOST);
    }

    /**
     * Loser claims they have fulfilled the social stake (optional).
     * This is informational only - fulfillment is complete when all winners confirm.
     *
     * @param betId the bet ID
     * @param userId the loser user ID
     * @param proofUrl optional URL to proof (photo, etc.)
     * @param proofDescription optional text description of the proof
     * @throws BetFulfillmentException if validation fails
     */
    public void loserClaimFulfilled(@NotNull Long betId, @NotNull Long userId, String proofUrl, String proofDescription) {
        Bet bet = betRepository.findById(betId)
                .orElseThrow(() -> new BetFulfillmentException("Bet not found: " + betId));

        // Validate bet is resolved and is social
        validateBetForFulfillment(bet);

        // Validate user is a loser
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new BetFulfillmentException("User not found: " + userId));

        BetParticipation participation = participationRepository.findByUserAndBet(user, bet)
                .orElseThrow(() -> new BetFulfillmentException("User did not participate in this bet"));

        if (participation.getStatus() != BetParticipation.ParticipationStatus.LOST) {
            throw new BetFulfillmentException("User is not a loser of this bet");
        }

        // Record loser's claim (optional, informational)
        bet.setLoserClaimedFulfilledAt(LocalDateTime.now());
        if (proofUrl != null && !proofUrl.trim().isEmpty()) {
            bet.setLoserFulfillmentProofUrl(proofUrl);
        }
        if (proofDescription != null && !proofDescription.trim().isEmpty()) {
            bet.setLoserFulfillmentProofDescription(proofDescription);
        }

        betRepository.save(bet);
    }

    /**
     * Winner confirms they received the social stake.
     * All winners must confirm for fulfillment to be complete.
     *
     * @param betId the bet ID
     * @param winnerId the winner user ID
     * @param notes optional notes from the winner
     * @throws BetFulfillmentException if validation fails
     */
    public void winnerConfirmFulfilled(@NotNull Long betId, @NotNull Long winnerId, String notes) {
        Bet bet = betRepository.findById(betId)
                .orElseThrow(() -> new BetFulfillmentException("Bet not found: " + betId));

        // Validate bet is resolved and is social
        validateBetForFulfillment(bet);

        // Validate user is a winner
        User winner = userRepository.findById(winnerId)
                .orElseThrow(() -> new BetFulfillmentException("User not found: " + winnerId));

        BetParticipation participation = participationRepository.findByUserAndBet(winner, bet)
                .orElseThrow(() -> new BetFulfillmentException("User did not participate in this bet"));

        if (participation.getStatus() != BetParticipation.ParticipationStatus.WON) {
            throw new BetFulfillmentException("User is not a winner of this bet");
        }

        // Check if already confirmed
        if (fulfillmentRepository.existsByBetIdAndWinnerId(betId, winnerId)) {
            throw new BetFulfillmentException("Winner has already confirmed fulfillment");
        }

        // Create fulfillment record
        BetFulfillment fulfillment = new BetFulfillment(betId, winnerId, notes);
        fulfillmentRepository.save(fulfillment);

        // Recalculate fulfillment status
        recalculateFulfillmentStatus(bet);
    }

    /**
     * Recalculates and updates the bet's fulfillment status based on winner confirmations.
     *
     * @param bet the bet
     */
    public void recalculateFulfillmentStatus(@NotNull Bet bet) {
        List<BetParticipation> winners = getWinners(bet);
        long totalWinners = winners.size();

        if (totalWinners == 0) {
            // No winners (shouldn't happen for resolved bets, but handle gracefully)
            bet.setFulfillmentStatus(FulfillmentStatus.FULFILLED);
            bet.setAllWinnersConfirmedAt(LocalDateTime.now());
        } else {
            long confirmationCount = fulfillmentRepository.countByBetId(bet.getId());

            if (confirmationCount == 0) {
                bet.setFulfillmentStatus(FulfillmentStatus.PENDING);
                bet.setAllWinnersConfirmedAt(null);
            } else if (confirmationCount < totalWinners) {
                bet.setFulfillmentStatus(FulfillmentStatus.PARTIALLY_FULFILLED);
                bet.setAllWinnersConfirmedAt(null);
            } else {
                // All winners confirmed
                bet.setFulfillmentStatus(FulfillmentStatus.FULFILLED);
                bet.setAllWinnersConfirmedAt(LocalDateTime.now());
            }
        }

        betRepository.save(bet);
    }

    /**
     * Gets comprehensive fulfillment details for a bet.
     *
     * @param betId the bet ID
     * @return fulfillment details
     * @throws BetFulfillmentException if bet not found
     */
    public FulfillmentDetails getFulfillmentDetails(@NotNull Long betId) {
        Bet bet = betRepository.findById(betId)
                .orElseThrow(() -> new BetFulfillmentException("Bet not found: " + betId));

        if (!bet.getStakeFulfillmentRequired()) {
            throw new BetFulfillmentException("Bet does not have fulfillment tracking enabled");
        }

        List<BetParticipation> winners = getWinners(bet);
        List<BetParticipation> losers = getLosers(bet);
        List<BetFulfillment> confirmations = fulfillmentRepository.findByBetId(betId);

        // Map winner IDs for easy lookup
        List<Long> confirmedWinnerIds = confirmations.stream()
                .map(BetFulfillment::getWinnerId)
                .collect(Collectors.toList());

        return new FulfillmentDetails(
                bet.getId(),
                bet.getTitle(),
                bet.getSocialStakeDescription(),
                bet.getFulfillmentStatus(),
                winners.size(),
                losers.size(),
                confirmations.size(),
                bet.getLoserClaimedFulfilledAt(),
                bet.getLoserFulfillmentProofUrl(),
                bet.getAllWinnersConfirmedAt(),
                winners.stream()
                        .map(p -> new WinnerInfo(
                                p.getUser().getId(),
                                p.getUser().getDisplayName(),
                                p.getUser().getProfileImageUrl(),
                                confirmedWinnerIds.contains(p.getUser().getId())
                        ))
                        .collect(Collectors.toList()),
                losers.stream()
                        .map(p -> new LoserInfo(
                                p.getUser().getId(),
                                p.getUser().getDisplayName(),
                                p.getUser().getProfileImageUrl()
                        ))
                        .collect(Collectors.toList()),
                confirmations.stream()
                        .map(c -> new WinnerConfirmation(
                                c.getWinnerId(),
                                c.getConfirmedAt(),
                                c.getNotes()
                        ))
                        .collect(Collectors.toList())
        );
    }

    /**
     * Validates that a bet is eligible for fulfillment tracking.
     *
     * @param bet the bet to validate
     * @throws BetFulfillmentException if validation fails
     */
    private void validateBetForFulfillment(@NotNull Bet bet) {
        if (bet.getStatus() != Bet.BetStatus.RESOLVED) {
            throw new BetFulfillmentException("Bet must be resolved before fulfillment can be tracked");
        }

        if (!bet.getStakeFulfillmentRequired()) {
            throw new BetFulfillmentException("Bet does not have fulfillment tracking enabled");
        }

        if (bet.getOutcome() == null) {
            throw new BetFulfillmentException("Bet outcome is not set");
        }
    }

    // ==========================================
    // DTOs
    // ==========================================

    /**
     * Comprehensive fulfillment details for a bet.
     */
    public record FulfillmentDetails(
            Long betId,
            String betTitle,
            String socialStakeDescription,
            FulfillmentStatus status,
            int totalWinners,
            int totalLosers,
            int confirmationCount,
            LocalDateTime loserClaimedAt,
            String loserProofUrl,
            LocalDateTime allWinnersConfirmedAt,
            List<WinnerInfo> winners,
            List<LoserInfo> losers,
            List<WinnerConfirmation> confirmations
    ) {}

    /**
     * Information about a winner.
     */
    public record WinnerInfo(
            Long userId,
            String displayName,
            String profilePhotoUrl,
            boolean hasConfirmed
    ) {}

    /**
     * Information about a loser.
     */
    public record LoserInfo(
            Long userId,
            String displayName,
            String profilePhotoUrl
    ) {}

    /**
     * A winner's confirmation record.
     */
    public record WinnerConfirmation(
            Long winnerId,
            LocalDateTime confirmedAt,
            String notes
    ) {}
}
