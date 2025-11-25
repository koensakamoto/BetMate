package com.rivalpicks.service.bet;

import com.rivalpicks.entity.betting.Bet;
import com.rivalpicks.entity.betting.Bet.BetResolutionMethod;
import com.rivalpicks.entity.betting.Bet.BetStatus;
import com.rivalpicks.entity.betting.BetResolver;
import com.rivalpicks.event.betting.BetDeadlineReachedEvent;
import com.rivalpicks.event.betting.BetAwaitingResolutionEvent;
import com.rivalpicks.event.betting.BetResolutionDeadlineApproachingEvent;
import com.rivalpicks.event.betting.BetDeadlineApproachingEvent;
import com.rivalpicks.repository.betting.BetRepository;
import com.rivalpicks.repository.betting.BetResolverRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.ZoneOffset;
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
    private final BetResolverRepository betResolverRepository;
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
        LocalDateTime now = LocalDateTime.now(ZoneOffset.UTC);  // Use UTC to match database/frontend timezone
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
     * - PARTICIPANT_VOTE: Auto-resolve if consensus is reached
     * - SELF/ASSIGNED_RESOLVERS: Publish notification for manual resolution
     */
    @Scheduled(fixedDelayString = "${bet.scheduling.process-resolvable-interval-ms:300000}") // Default: 5 minutes
    @Transactional
    public void processResolvableBets() {
        LocalDateTime now = LocalDateTime.now(ZoneOffset.UTC);  // Use UTC to match database/frontend timezone
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
     * Behavior depends on the bet's type and resolution method.
     */
    private void processResolutionDeadline(Bet bet) {
        log.info("Processing resolution deadline for bet {} (type: {}, method: {})",
                bet.getId(), bet.getBetType(), bet.getResolutionMethod());

        // Handle based on bet type first
        if (bet.getBetType() == Bet.BetType.PREDICTION) {
            handlePredictionBetResolution(bet);
            return;
        }

        // Handle MULTIPLE_CHOICE bets based on resolution method
        BetResolutionMethod method = bet.getResolutionMethod();

        switch (method) {
            case PARTICIPANT_VOTE:
                handleParticipantVoteResolution(bet);
                break;

            case SELF:
            case ASSIGNED_RESOLVERS:
                handleManualResolutionRequired(bet);
                break;

            default:
                log.warn("Unknown resolution method {} for bet {}", method, bet.getId());
        }
    }

    /**
     * Handle PREDICTION bets at resolution deadline.
     * Always resolves based on current votes for each participant:
     * - >50% correct votes → WINNER
     * - =50% correct votes → DRAW
     * - <50% correct votes → LOSER
     * - No votes → DRAW
     */
    private void handlePredictionBetResolution(Bet bet) {
        try {
            // Resolve prediction bet with current votes (deadline reached = always resolve)
            boolean resolved = betResolutionService.resolvePredictionBetWithCurrentVotes(bet, null);

            if (resolved) {
                log.info("Prediction bet {} resolved at deadline", bet.getId());
            } else {
                log.error("Failed to resolve prediction bet {} at deadline", bet.getId());
            }
        } catch (Exception e) {
            log.error("Failed to handle prediction bet resolution for bet {}: {}", bet.getId(), e.getMessage(), e);
        }
    }

    /**
     * Handle MULTIPLE_CHOICE participant vote bets at resolution deadline.
     * Always resolves the bet based on current votes:
     * - No votes → DRAW
     * - One option with highest votes → That option wins
     * - Tie for highest votes → DRAW
     */
    private void handleParticipantVoteResolution(Bet bet) {
        try {
            // Resolve bet with current votes (deadline reached = always resolve)
            // Pass null for triggeringVoter since this is a scheduled task, not a user action
            boolean resolved = betResolutionService.resolveWithCurrentVotes(bet, null);

            if (resolved) {
                log.info("Bet {} resolved at deadline with outcome: {}", bet.getId(), bet.getOutcome());
            } else {
                log.error("Failed to resolve bet {} at deadline", bet.getId());
            }
        } catch (Exception e) {
            log.error("Failed to handle participant vote resolution for bet {}: {}", bet.getId(), e.getMessage(), e);
        }
    }

    /**
     * Handle bets that require manual resolution (SELF or ASSIGNED_RESOLVERS).
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
                    bet.getGroup().getGroupName(),
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

    /**
     * Scheduled task to notify resolvers when resolution deadline is approaching.
     * Sends notifications at 24 hours and 1 hour before deadline.
     * Runs every 15 minutes.
     */
    @Scheduled(fixedDelayString = "${bet.scheduling.notify-resolution-deadline-interval-ms:900000}") // Default: 15 minutes
    @Transactional
    public void notifyApproachingResolutionDeadlines() {
        LocalDateTime now = LocalDateTime.now(ZoneOffset.UTC);  // Use UTC to match database/frontend timezone
        log.info("===== RESOLUTION DEADLINE CHECK =====");
        log.info("Current time (UTC): {}", now);

        // Check for bets needing 24-hour reminder (with precise time window: 23h45m to 24h15m)
        LocalDateTime twentyThreeHours45Minutes = now.plusHours(23).plusMinutes(45);
        LocalDateTime twentyFourHours15Minutes = now.plusHours(24).plusMinutes(15);
        log.info("Query window: {} to {}", twentyThreeHours45Minutes, twentyFourHours15Minutes);
        List<Bet> betsNeeding24HourReminder = betRepository.findBetsNeedingTwentyFourHourResolutionReminder(twentyThreeHours45Minutes, twentyFourHours15Minutes);
        log.info("Query returned {} bets", betsNeeding24HourReminder.size());

        // Log details of each bet found
        if (!betsNeeding24HourReminder.isEmpty()) {
            for (Bet bet : betsNeeding24HourReminder) {
                log.info("  Bet #{}: resolveDate={}, title='{}', group={}",
                    bet.getId(), bet.getResolveDate(), bet.getTitle(), bet.getGroup() != null ? bet.getGroup().getId() : "null");
            }
        }

        if (!betsNeeding24HourReminder.isEmpty()) {
            log.info("Found {} bets needing 24-hour resolution reminder", betsNeeding24HourReminder.size());
            for (Bet bet : betsNeeding24HourReminder) {
                try {
                    // Null check for group to prevent crashes
                    if (bet.getGroup() == null) {
                        log.warn("Bet {} has null group, skipping 24-hour reminder", bet.getId());
                        continue;
                    }

                    // Smart logic: Skip 24h reminder if resolveDate < 2 hours (prevent double notification)
                    long hoursUntilDeadline = java.time.Duration.between(now, bet.getResolveDate()).toHours();
                    if (hoursUntilDeadline < 2) {
                        log.debug("Skipping 24-hour reminder for bet {} (only {} hours until deadline, will send 1-hour reminder instead)",
                                bet.getId(), hoursUntilDeadline);
                        bet.setResolution24HourReminderSentAt(now); // Mark as sent to avoid retrying
                        betRepository.save(bet);
                        continue;
                    }

                    publishResolutionDeadlineApproachingEvent(bet, 24);
                    bet.setResolution24HourReminderSentAt(now);
                    betRepository.save(bet);
                    log.debug("Sent 24-hour reminder for bet {} (resolveDate: {})", bet.getId(), bet.getResolveDate());
                } catch (Exception e) {
                    log.error("Failed to send 24-hour reminder for bet {}: {}", bet.getId(), e.getMessage(), e);
                }
            }
        }

        // Check for bets needing 1-hour reminder (with precise time window: 45m to 1h15m)
        LocalDateTime fortyFiveMinutes = now.plusMinutes(45);
        LocalDateTime oneHour15Minutes = now.plusHours(1).plusMinutes(15);
        List<Bet> betsNeeding1HourReminder = betRepository.findBetsNeedingOneHourResolutionReminder(fortyFiveMinutes, oneHour15Minutes);

        if (!betsNeeding1HourReminder.isEmpty()) {
            log.info("Found {} bets needing 1-hour resolution reminder", betsNeeding1HourReminder.size());
            for (Bet bet : betsNeeding1HourReminder) {
                try {
                    // Null check for group to prevent crashes
                    if (bet.getGroup() == null) {
                        log.warn("Bet {} has null group, skipping 1-hour reminder", bet.getId());
                        continue;
                    }

                    publishResolutionDeadlineApproachingEvent(bet, 1);
                    bet.setResolution1HourReminderSentAt(now);
                    betRepository.save(bet);
                    log.debug("Sent 1-hour reminder for bet {} (resolveDate: {})", bet.getId(), bet.getResolveDate());
                } catch (Exception e) {
                    log.error("Failed to send 1-hour reminder for bet {}: {}", bet.getId(), e.getMessage(), e);
                }
            }
        }

        // Fallback: Check for very urgent bets (< 1 hour, no reminders sent yet)
        checkForUrgentBetsNeedingReminders(now);
    }

    /**
     * Fallback for very urgent bets that missed both reminder windows.
     * Sends a reminder for any bet with resolveDate < 1 hour that hasn't received any reminder yet.
     */
    private void checkForUrgentBetsNeedingReminders(LocalDateTime now) {
        try {
            LocalDateTime oneHourFromNow = now.plusHours(1);

            // Find bets with resolveDate < 1 hour that have no reminders sent
            List<Bet> urgentBets = betRepository.findAll().stream()
                .filter(bet -> bet.getResolveDate() != null)
                .filter(bet -> bet.getResolveDate().isAfter(now))
                .filter(bet -> bet.getResolveDate().isBefore(oneHourFromNow))
                .filter(bet -> bet.getResolution24HourReminderSentAt() == null)
                .filter(bet -> bet.getResolution1HourReminderSentAt() == null)
                .filter(bet -> bet.getStatus() != Bet.BetStatus.CANCELLED)
                .filter(bet -> bet.getStatus() != Bet.BetStatus.RESOLVED)
                .filter(bet -> bet.getDeletedAt() == null)
                .collect(java.util.stream.Collectors.toList());

            if (!urgentBets.isEmpty()) {
                log.info("Found {} urgent bets needing immediate reminders", urgentBets.size());
                for (Bet bet : urgentBets) {
                    try {
                        // Null check for group
                        if (bet.getGroup() == null) {
                            log.warn("Urgent bet {} has null group, skipping", bet.getId());
                            continue;
                        }

                        long minutesUntilDeadline = java.time.Duration.between(now, bet.getResolveDate()).toMinutes();
                        log.info("Sending urgent reminder for bet {} ({} minutes until deadline)",
                                bet.getId(), minutesUntilDeadline);

                        // Send as "1-hour" reminder (close enough)
                        publishResolutionDeadlineApproachingEvent(bet, 1);
                        bet.setResolution1HourReminderSentAt(now);
                        betRepository.save(bet);
                    } catch (Exception e) {
                        log.error("Failed to send urgent reminder for bet {}: {}", bet.getId(), e.getMessage(), e);
                    }
                }
            }
        } catch (Exception e) {
            log.error("Failed to check for urgent bets: {}", e.getMessage(), e);
        }
    }

    /**
     * Publish event for resolution deadline approaching notification.
     */
    private void publishResolutionDeadlineApproachingEvent(Bet bet, int hoursUntilDeadline) {
        try {
            // Get assigned resolver IDs if applicable
            List<Long> assignedResolverIds = java.util.Collections.emptyList();
            if (bet.getResolutionMethod() == BetResolutionMethod.ASSIGNED_RESOLVERS) {
                List<BetResolver> resolvers = betResolverRepository.findByBetAndIsActiveTrue(bet);
                assignedResolverIds = resolvers.stream()
                        .map(resolver -> resolver.getResolver().getId())
                        .collect(java.util.stream.Collectors.toList());
            }

            BetResolutionDeadlineApproachingEvent event = new BetResolutionDeadlineApproachingEvent(
                    bet.getId(),
                    bet.getTitle(),
                    bet.getGroup().getId(),
                    bet.getGroup().getGroupName(),
                    bet.getResolveDate(),
                    bet.getResolutionMethod().name(),
                    bet.getCreator().getId(),
                    assignedResolverIds,
                    hoursUntilDeadline
            );
            eventPublisher.publishEvent(event);
            log.debug("Published BetResolutionDeadlineApproachingEvent for bet {} ({} hours)",
                     bet.getId(), hoursUntilDeadline);
        } catch (Exception e) {
            log.error("Failed to publish BetResolutionDeadlineApproachingEvent for bet {}: {}",
                     bet.getId(), e.getMessage(), e);
        }
    }

    /**
     * Scheduled task to notify group members when betting deadline is approaching.
     * Sends notifications at 24 hours and 1 hour before betting closes.
     * Runs every 15 minutes.
     */
    @Scheduled(fixedDelayString = "${bet.scheduling.notify-betting-deadline-interval-ms:900000}") // Default: 15 minutes
    @Transactional
    public void notifyApproachingBettingDeadlines() {
        LocalDateTime now = LocalDateTime.now(ZoneOffset.UTC);  // Use UTC to match database/frontend timezone
        log.info("===== BETTING DEADLINE CHECK =====");
        log.info("Current time (UTC): {}", now);

        // Check for bets needing 24-hour reminder (with precise time window: 23h45m to 24h15m)
        LocalDateTime twentyThreeHours45Minutes = now.plusHours(23).plusMinutes(45);
        LocalDateTime twentyFourHours15Minutes = now.plusHours(24).plusMinutes(15);
        log.info("Query window: {} to {}", twentyThreeHours45Minutes, twentyFourHours15Minutes);
        List<Bet> betsNeeding24HourReminder = betRepository.findBetsNeedingTwentyFourHourBettingReminder(
                twentyThreeHours45Minutes, twentyFourHours15Minutes);
        log.info("Query returned {} bets", betsNeeding24HourReminder.size());

        // Log details of each bet found
        if (!betsNeeding24HourReminder.isEmpty()) {
            for (Bet bet : betsNeeding24HourReminder) {
                log.info("  Bet #{}: deadline={}, title='{}', group={}",
                    bet.getId(), bet.getBettingDeadline(), bet.getTitle(), bet.getGroup() != null ? bet.getGroup().getId() : "null");
            }
        }

        if (!betsNeeding24HourReminder.isEmpty()) {
            log.info("Found {} bets needing 24-hour betting deadline reminder", betsNeeding24HourReminder.size());
            for (Bet bet : betsNeeding24HourReminder) {
                try {
                    // Null check for group to prevent crashes
                    if (bet.getGroup() == null) {
                        log.warn("Bet {} has null group, skipping 24-hour betting reminder", bet.getId());
                        continue;
                    }

                    // Smart logic: Skip 24h reminder if betting deadline < 2 hours (prevent double notification)
                    long hoursUntilDeadline = java.time.Duration.between(now, bet.getBettingDeadline()).toHours();
                    if (hoursUntilDeadline < 2) {
                        log.debug("Skipping 24-hour betting reminder for bet {} (only {} hours until deadline)",
                                bet.getId(), hoursUntilDeadline);
                        bet.setBetting24HourReminderSentAt(now); // Mark as sent to avoid retrying
                        betRepository.save(bet);
                        continue;
                    }

                    publishBettingDeadlineApproachingEvent(bet, 24);
                    bet.setBetting24HourReminderSentAt(now);
                    betRepository.save(bet);
                } catch (Exception e) {
                    log.error("Failed to send 24-hour betting reminder for bet {}: {}", bet.getId(), e.getMessage(), e);
                }
            }
        }

        // Check for bets needing 1-hour reminder (with precise time window: 45m to 1h15m)
        LocalDateTime fortyFiveMinutes = now.plusMinutes(45);
        LocalDateTime oneHour15Minutes = now.plusHours(1).plusMinutes(15);
        List<Bet> betsNeeding1HourReminder = betRepository.findBetsNeedingOneHourBettingReminder(
                fortyFiveMinutes, oneHour15Minutes);

        if (!betsNeeding1HourReminder.isEmpty()) {
            log.info("Found {} bets needing 1-hour betting deadline reminder", betsNeeding1HourReminder.size());
            for (Bet bet : betsNeeding1HourReminder) {
                try {
                    // Null check for group to prevent crashes
                    if (bet.getGroup() == null) {
                        log.warn("Bet {} has null group, skipping 1-hour betting reminder", bet.getId());
                        continue;
                    }

                    publishBettingDeadlineApproachingEvent(bet, 1);
                    bet.setBetting1HourReminderSentAt(now);
                    betRepository.save(bet);
                    log.debug("Sent 1-hour betting reminder for bet {} (bettingDeadline: {})", bet.getId(), bet.getBettingDeadline());
                } catch (Exception e) {
                    log.error("Failed to send 1-hour betting reminder for bet {}: {}", bet.getId(), e.getMessage(), e);
                }
            }
        }

        // Fallback: Check for very urgent bets (< 1 hour, no reminders sent yet)
        checkForUrgentBetsNeedingBettingReminders(now);
    }

    /**
     * Fallback for very urgent bets that missed both reminder windows.
     * Sends a reminder for any bet with bettingDeadline < 1 hour that hasn't received any reminder yet.
     */
    private void checkForUrgentBetsNeedingBettingReminders(LocalDateTime now) {
        try {
            LocalDateTime oneHourFromNow = now.plusHours(1);

            // Find bets with bettingDeadline < 1 hour that have no reminders sent
            List<Bet> urgentBets = betRepository.findAll().stream()
                .filter(bet -> bet.getBettingDeadline() != null)
                .filter(bet -> bet.getBettingDeadline().isAfter(now))
                .filter(bet -> bet.getBettingDeadline().isBefore(oneHourFromNow))
                .filter(bet -> bet.getBetting24HourReminderSentAt() == null)
                .filter(bet -> bet.getBetting1HourReminderSentAt() == null)
                .filter(bet -> bet.getStatus() == Bet.BetStatus.OPEN)
                .filter(bet -> bet.getDeletedAt() == null)
                .collect(java.util.stream.Collectors.toList());

            if (!urgentBets.isEmpty()) {
                log.info("Found {} urgent bets needing immediate betting reminders", urgentBets.size());
                for (Bet bet : urgentBets) {
                    try {
                        // Null check for group
                        if (bet.getGroup() == null) {
                            log.warn("Urgent bet {} has null group, skipping betting reminder", bet.getId());
                            continue;
                        }

                        long minutesUntilDeadline = java.time.Duration.between(now, bet.getBettingDeadline()).toMinutes();
                        log.info("Sending urgent betting reminder for bet {} ({} minutes until deadline)",
                                bet.getId(), minutesUntilDeadline);

                        // Send as "1-hour" reminder (close enough)
                        publishBettingDeadlineApproachingEvent(bet, 1);
                        bet.setBetting1HourReminderSentAt(now);
                        betRepository.save(bet);
                    } catch (Exception e) {
                        log.error("Failed to send urgent betting reminder for bet {}: {}", bet.getId(), e.getMessage(), e);
                    }
                }
            }
        } catch (Exception e) {
            log.error("Failed to check for urgent betting deadlines: {}", e.getMessage(), e);
        }
    }

    /**
     * Publish event for betting deadline approaching notification.
     */
    private void publishBettingDeadlineApproachingEvent(Bet bet, int hoursUntilDeadline) {
        try {
            BetDeadlineApproachingEvent event = new BetDeadlineApproachingEvent(
                    bet.getId(),
                    bet.getTitle(),
                    bet.getGroup().getId(),
                    bet.getGroup().getGroupName(),
                    bet.getBettingDeadline(),
                    hoursUntilDeadline
            );
            eventPublisher.publishEvent(event);
            log.debug("Published BetDeadlineApproachingEvent for bet {} ({} hours)",
                     bet.getId(), hoursUntilDeadline);
        } catch (Exception e) {
            log.error("Failed to publish BetDeadlineApproachingEvent for bet {}: {}",
                     bet.getId(), e.getMessage(), e);
        }
    }
}
