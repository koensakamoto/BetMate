package com.betmate.service.bet;

import com.betmate.entity.betting.Bet;
import com.betmate.entity.betting.enums.BetResolutionMethod;
import com.betmate.entity.betting.enums.BetStatus;
import com.betmate.event.betting.BetDeadlineReachedEvent;
import com.betmate.event.betting.BetAwaitingResolutionEvent;
import com.betmate.repository.betting.BetRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Service for handling scheduled bet operations such as:
 * - Auto-closing bets when betting deadline is reached
 * - Processing bets when resolution deadline is reached
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class BetScheduledTaskService {

    private final BetRepository betRepository;
    private final BetService betService;
    private final BetResolutionService betResolutionService;
    private final ApplicationEventPublisher eventPublisher;

    /**
     * Scheduled task to close bets when their betting deadline has passed.
     * Runs every 2 minutes.
     * Transitions bets from OPEN to CLOSED status.
     */
    @Scheduled(fixedDelayString = "${bet.scheduling.close-expired-interval-ms:120000}") // Default: 2 minutes
    @Transactional
    public void closeExpiredBets() {
        LocalDateTime now = LocalDateTime.now();
        List<Bet> expiredBets = betRepository.findExpiredOpenBets(now);

        if (expiredBets.isEmpty()) {
            log.debug("No expired open bets found at {}", now);
            return;
        }

        log.info("Found {} bets that have passed their betting deadline", expiredBets.size());

        for (Bet bet : expiredBets) {
            try {
                // Close the bet (transition from OPEN to CLOSED)
                betService.closeBet(bet.getId());

                log.info("Successfully closed bet {} (Group: {}) - betting deadline was {}",
                        bet.getId(), bet.getGroup().getId(), bet.getBettingDeadline());

                // Publish event for notifications
                publishBetDeadlineReachedEvent(bet);

            } catch (Exception e) {
                log.error("Failed to close expired bet {}: {}", bet.getId(), e.getMessage(), e);
            }
        }
    }

    /**
     * Scheduled task to process bets when their resolution deadline has been reached.
     * Runs every 5 minutes.
     * Handles different resolution methods:
     * - CONSENSUS_VOTING: Auto-resolve if consensus is reached
     * - CREATOR_ONLY/ASSIGNED_RESOLVER: Publish notification for manual resolution
     */
    @Scheduled(fixedDelayString = "${bet.scheduling.process-resolvable-interval-ms:300000}") // Default: 5 minutes
    @Transactional
    public void processResolvableBets() {
        LocalDateTime now = LocalDateTime.now();
        List<Bet> resolvableBets = betRepository.findBetsReadyForResolution(now);

        if (resolvableBets.isEmpty()) {
            log.debug("No bets ready for resolution at {}", now);
            return;
        }

        log.info("Found {} bets that have reached their resolution deadline", resolvableBets.size());

        for (Bet bet : resolvableBets) {
            try {
                processResolutionDeadline(bet);
            } catch (Exception e) {
                log.error("Failed to process resolution deadline for bet {}: {}", bet.getId(), e.getMessage(), e);
            }
        }
    }

    /**
     * Process a bet that has reached its resolution deadline.
     * Behavior depends on the bet's resolution method.
     */
    private void processResolutionDeadline(Bet bet) {
        BetResolutionMethod method = bet.getResolutionMethod();

        log.info("Processing resolution deadline for bet {} with method {}", bet.getId(), method);

        switch (method) {
            case CONSENSUS_VOTING:
                handleConsensusVotingResolution(bet);
                break;

            case CREATOR_ONLY:
            case ASSIGNED_RESOLVER:
                handleManualResolutionRequired(bet);
                break;

            default:
                log.warn("Unknown resolution method {} for bet {}", method, bet.getId());
        }
    }

    /**
     * Handle consensus voting bets at resolution deadline.
     * Auto-resolve if consensus has been reached, otherwise notify voters.
     */
    private void handleConsensusVotingResolution(Bet bet) {
        try {
            // Check if consensus has been reached and auto-resolve if yes
            boolean resolved = betResolutionService.checkAndResolveIfConsensusReached(bet);

            if (resolved) {
                log.info("Bet {} auto-resolved via consensus voting", bet.getId());
            } else {
                log.info("Bet {} reached resolution deadline but consensus not yet reached. " +
                        "Current votes: {}, Required: {}",
                        bet.getId(),
                        betResolutionService.getVoteCounts(bet.getId()).values().stream().mapToLong(Long::longValue).sum(),
                        bet.getMinimumVotesRequired());

                // Publish event to notify voters that deadline has passed
                publishBetAwaitingResolutionEvent(bet);
            }
        } catch (Exception e) {
            log.error("Failed to handle consensus voting resolution for bet {}: {}", bet.getId(), e.getMessage(), e);
        }
    }

    /**
     * Handle bets that require manual resolution (CREATOR_ONLY or ASSIGNED_RESOLVER).
     * These cannot be auto-resolved, so we publish an event to notify the resolvers.
     */
    private void handleManualResolutionRequired(Bet bet) {
        log.info("Bet {} requires manual resolution (method: {}). Publishing notification event.",
                bet.getId(), bet.getResolutionMethod());

        // Publish event to notify creator/resolvers
        publishBetAwaitingResolutionEvent(bet);
    }

    /**
     * Publish event when a bet's betting deadline is reached.
     */
    private void publishBetDeadlineReachedEvent(Bet bet) {
        try {
            BetDeadlineReachedEvent event = new BetDeadlineReachedEvent(
                    bet.getId(),
                    bet.getTitle(),
                    bet.getGroup().getId(),
                    bet.getBettingDeadline(),
                    bet.getTotalParticipants()
            );
            eventPublisher.publishEvent(event);
            log.debug("Published BetDeadlineReachedEvent for bet {}", bet.getId());
        } catch (Exception e) {
            log.error("Failed to publish BetDeadlineReachedEvent for bet {}: {}", bet.getId(), e.getMessage(), e);
        }
    }

    /**
     * Publish event when a bet needs manual resolution.
     */
    private void publishBetAwaitingResolutionEvent(Bet bet) {
        try {
            BetAwaitingResolutionEvent event = new BetAwaitingResolutionEvent(
                    bet.getId(),
                    bet.getTitle(),
                    bet.getGroup().getId(),
                    bet.getResolveDate(),
                    bet.getResolutionMethod(),
                    bet.getCreator().getId()
            );
            eventPublisher.publishEvent(event);
            log.debug("Published BetAwaitingResolutionEvent for bet {}", bet.getId());
        } catch (Exception e) {
            log.error("Failed to publish BetAwaitingResolutionEvent for bet {}: {}", bet.getId(), e.getMessage(), e);
        }
    }
}
