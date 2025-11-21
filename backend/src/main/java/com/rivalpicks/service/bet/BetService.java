    package com.rivalpicks.service.bet;

import com.rivalpicks.entity.betting.Bet;
import com.rivalpicks.entity.group.Group;
import com.rivalpicks.entity.user.User;
import com.rivalpicks.event.betting.BetCancelledEvent;
import com.rivalpicks.exception.betting.BetNotFoundException;
import com.rivalpicks.exception.betting.BetOperationException;
import com.rivalpicks.repository.betting.BetRepository;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.context.annotation.Lazy;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.validation.annotation.Validated;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

/**
 * Core bet management service handling CRUD operations and basic bet data.
 * Does NOT handle bet placement, resolution, or financial operations.
 */
@Service
@Validated
@Transactional(readOnly = true)
public class BetService {

    private final BetRepository betRepository;
    private final BetParticipationService participationService;
    private final ApplicationEventPublisher eventPublisher;

    @Autowired
    public BetService(BetRepository betRepository,
                     @Lazy BetParticipationService participationService,
                     ApplicationEventPublisher eventPublisher) {
        this.betRepository = betRepository;
        this.participationService = participationService;
        this.eventPublisher = eventPublisher;
    }

    /**
     * Retrieves a bet by ID.
     */
    public Bet getBetById(@NotNull Long betId) {
        return betRepository.findById(betId)
            .filter(bet -> !bet.isDeleted())
            .orElseThrow(() -> new BetNotFoundException("Bet not found: " + betId));
    }

    /**
     * Retrieves all bets for a group.
     */
    public List<Bet> getBetsByGroup(@NotNull Group group) {
        return betRepository.findByGroupOrderByCreatedAtDesc(group);
    }

    /**
     * Retrieves bets by status.
     */
    public List<Bet> getBetsByStatus(@NotNull Bet.BetStatus status) {
        return betRepository.findByStatusAndDeletedAtIsNull(status);
    }

    /**
     * Retrieves bets created by a user.
     */
    public List<Bet> getBetsByCreator(@NotNull User creator) {
        return betRepository.findByCreator(creator);
    }

    /**
     * Retrieves currently active (open) bets.
     */
    public List<Bet> getActiveBets() {
        return betRepository.findActiveBets(LocalDateTime.now());
    }

    /**
     * Retrieves bets that have expired but are still open.
     */
    public List<Bet> getExpiredOpenBets() {
        return betRepository.findExpiredOpenBets(LocalDateTime.now());
    }

    /**
     * Retrieves bets expiring within a time range.
     */
    public List<Bet> getBetsExpiringBetween(@NotNull LocalDateTime start, @NotNull LocalDateTime end) {
        return betRepository.findBetsExpiringBetween(start, end);
    }

    /**
     * Updates bet information (title, description, options).
     */
    @Transactional
    public Bet updateBet(@NotNull Long betId, @NotNull BetUpdateRequest request) {
        Bet bet = getBetById(betId);
        
        // Only allow updates for open bets
        if (bet.getStatus() != Bet.BetStatus.OPEN) {
            throw new BetOperationException("Cannot update bet that is not open");
        }
        
        if (request.title() != null) {
            bet.setTitle(request.title());
        }
        if (request.description() != null) {
            bet.setDescription(request.description());
        }
        if (request.option1() != null) {
            bet.setOption1(request.option1());
        }
        if (request.option2() != null) {
            bet.setOption2(request.option2());
        }
        if (request.option3() != null) {
            bet.setOption3(request.option3());
        }
        if (request.option4() != null) {
            bet.setOption4(request.option4());
        }
        
        return betRepository.save(bet);
    }

    /**
     * Closes a bet (no longer accepting participants).
     */
    @Transactional
    public Bet closeBet(@NotNull Long betId) {
        int updatedRows = betRepository.closeBetAtomically(betId);
        if (updatedRows == 0) {
            // Either bet doesn't exist or wasn't in OPEN status
            Bet bet = getBetById(betId); // This will throw if bet doesn't exist
            throw new BetOperationException("Bet is not open");
        }
        
        return getBetById(betId); // Return updated bet
    }

    /**
     * Cancels a bet, refunds all participants, and publishes cancellation event.
     *
     * @param betId the ID of the bet to cancel
     * @param reason optional reason for cancellation
     * @param cancelledBy the user who cancelled the bet (typically the creator)
     * @return the cancelled bet
     * @throws BetOperationException if bet cannot be cancelled
     */
    @Transactional
    public Bet cancelBet(@NotNull Long betId, String reason, @NotNull User cancelledBy) {
        // Load bet before cancellation to validate
        Bet bet = getBetById(betId);

        // Validate bet can be cancelled
        if (bet.getStatus() == Bet.BetStatus.RESOLVED) {
            throw new BetOperationException("Cannot cancel resolved bet");
        }

        // Atomically update bet status to CANCELLED
        int updatedRows = betRepository.cancelBetAtomically(betId);
        if (updatedRows == 0) {
            throw new BetOperationException("Bet cannot be cancelled");
        }

        // Reload bet to get updated status
        Bet cancelledBet = getBetById(betId);

        // Refund all active participations and collect refund amounts
        Map<Long, BigDecimal> refunds = participationService.refundAllParticipations(cancelledBet);

        // Store cancellation reason if provided
        if (reason != null && !reason.trim().isEmpty()) {
            cancelledBet.setCancellationReason(reason);
            betRepository.save(cancelledBet);
        }

        // Publish BetCancelledEvent for notifications
        BetCancelledEvent event = new BetCancelledEvent(
            cancelledBet.getId(),
            cancelledBet.getTitle(),
            cancelledBet.getGroup().getId(),
            cancelledBet.getGroup().getName(),
            cancelledBy.getId(),
            cancelledBy.getUsername(),
            reason,
            refunds
        );
        eventPublisher.publishEvent(event);

        return cancelledBet;
    }

    /**
     * Soft deletes a bet.
     */
    @Transactional
    public void deleteBet(@NotNull Long betId) {
        Bet bet = getBetById(betId);
        bet.setDeletedAt(LocalDateTime.now());
        betRepository.save(bet);
    }

    /**
     * Checks if a bet is currently open for betting.
     */
    public boolean isBetOpenForBetting(@NotNull Long betId) {
        Bet bet = getBetById(betId);
        return bet.isOpenForBetting();
    }

    /**
     * Checks if a bet has been resolved.
     */
    public boolean isBetResolved(@NotNull Long betId) {
        Bet bet = getBetById(betId);
        return bet.isResolved();
    }

    /**
     * Checks if a bet deadline has passed.
     */
    public boolean isBetPastDeadline(@NotNull Long betId) {
        Bet bet = getBetById(betId);
        return bet.isPastDeadline();
    }

    /**
     * Gets bet statistics.
     */
    public BetStats getBetStats(@NotNull Long betId) {
        Bet bet = getBetById(betId);
        return new BetStats(
            bet.getTotalParticipants(),
            bet.getTotalPool(),
            bet.getParticipantsForOption1(),
            bet.getParticipantsForOption2(),
            bet.getPoolForOption1(),
            bet.getPoolForOption2(),
            bet.getStatus(),
            bet.getOutcome()
        );
    }

    /**
     * Internal method for other services to save bet updates.
     */
    @Transactional
    public Bet saveBet(@Valid Bet bet) {
        return betRepository.save(bet);
    }

    // DTO for bet updates
    public record BetUpdateRequest(
        String title,
        String description,
        String option1,
        String option2,
        String option3,
        String option4
    ) {}

    /**
     * Get visible bets for a user's profile based on privacy rules.
     * Shows bets from PUBLIC groups and PRIVATE/SECRET groups where viewer is a member.
     */
    public List<Bet> getVisibleBetsForProfile(@NotNull User profileUser, @NotNull User viewerUser) {
        return betRepository.findVisibleBetsForProfile(profileUser, viewerUser);
    }

    // DTO for bet statistics
    public record BetStats(
        int totalParticipants,
        java.math.BigDecimal totalPool,
        int participantsForOption1,
        int participantsForOption2,
        java.math.BigDecimal poolForOption1,
        java.math.BigDecimal poolForOption2,
        Bet.BetStatus status,
        Bet.BetOutcome outcome
    ) {}

}