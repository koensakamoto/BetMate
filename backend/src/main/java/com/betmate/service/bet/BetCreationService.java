package com.betmate.service.bet;

import com.betmate.entity.betting.Bet;
import com.betmate.entity.betting.BetStakeType;
import com.betmate.entity.group.Group;
import com.betmate.entity.user.User;
import com.betmate.event.betting.BetCreatedEvent;
import com.betmate.exception.betting.BetCreationException;
import com.betmate.service.group.GroupPermissionService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.validation.annotation.Validated;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * Service dedicated to bet creation and validation.
 * Handles bet setup, validation, and initial configuration.
 */
@Service
@Validated
@Transactional
public class BetCreationService {

    private final BetService betService;
    private final BetParticipationService betParticipationService;
    private final GroupPermissionService permissionService;
    private final ApplicationEventPublisher eventPublisher;

    @Autowired
    public BetCreationService(BetService betService, BetParticipationService betParticipationService,
                             GroupPermissionService permissionService,
                             ApplicationEventPublisher eventPublisher) {
        this.betService = betService;
        this.betParticipationService = betParticipationService;
        this.permissionService = permissionService;
        this.eventPublisher = eventPublisher;
    }

    /**
     * Creates a new bet in a group.
     */
    public Bet createBet(@NotNull User creator, @NotNull Group group, @Valid BetCreationRequest request) {
        // Check permissions
        permissionService.requirePermission(creator, group, GroupPermissionService.GroupPermission.CREATE_BET);
        
        // Validate request
        validateBetCreationRequest(request);
        
        // Create bet
        Bet bet = createBetFromRequest(creator, group, request);
        bet = betService.saveBet(bet);

        // Create creator participation so bet appears in "My Bets"
        betParticipationService.createCreatorParticipation(creator, bet);

        // Publish bet created event for notifications
        publishBetCreatedEvent(bet);

        return bet;
    }

    private void validateBetCreationRequest(BetCreationRequest request) {
        // Validate deadline is in the future
        if (request.bettingDeadline().isBefore(LocalDateTime.now().plusMinutes(5))) {
            throw new BetCreationException("Betting deadline must be at least 5 minutes in the future");
        }

        // Validate resolve date is after deadline
        if (request.resolveDate() != null && request.resolveDate().isBefore(request.bettingDeadline())) {
            throw new BetCreationException("Resolve date must be after betting deadline");
        }

        // Validate stake type specific requirements
        BetStakeType stakeType = request.stakeType() != null ? request.stakeType() : BetStakeType.CREDIT;

        if (stakeType == BetStakeType.CREDIT) {
            // CREDIT bets require fixedStakeAmount
            if (request.fixedStakeAmount() == null) {
                throw new BetCreationException("Fixed stake amount is required for credit-based bets");
            }
            if (request.fixedStakeAmount().compareTo(new BigDecimal("0.01")) < 0) {
                throw new BetCreationException("Fixed stake amount must be at least 0.01");
            }
        } else if (stakeType == BetStakeType.SOCIAL) {
            // SOCIAL bets require socialStakeDescription
            if (request.socialStakeDescription() == null || request.socialStakeDescription().trim().isEmpty()) {
                throw new BetCreationException("Social stake description is required for social bets");
            }
            if (request.socialStakeDescription().length() > 500) {
                throw new BetCreationException("Social stake description cannot exceed 500 characters");
            }
        }

        // Validate minimum bet (deprecated, kept for backward compatibility)
        if (request.minimumBet() != null && request.minimumBet().compareTo(new BigDecimal("0.01")) < 0) {
            throw new BetCreationException("Minimum bet must be at least 0.01");
        }

        // Validate maximum bet (deprecated, kept for backward compatibility)
        if (request.maximumBet() != null && request.minimumBet() != null
            && request.maximumBet().compareTo(request.minimumBet()) < 0) {
            throw new BetCreationException("Maximum bet must be greater than minimum bet");
        }

        // Validate bet type and options - multiple choice can have 2-4 options
    }

    private Bet createBetFromRequest(User creator, Group group, BetCreationRequest request) {
        Bet bet = new Bet();

        // Basic info
        bet.setCreator(creator);
        bet.setGroup(group);
        bet.setTitle(request.title());
        bet.setDescription(request.description());
        bet.setBetType(request.betType());
        bet.setResolutionMethod(request.resolutionMethod());

        // Options
        bet.setOption1(request.option1());
        bet.setOption2(request.option2());
        if (request.option3() != null) {
            bet.setOption3(request.option3());
        }
        if (request.option4() != null) {
            bet.setOption4(request.option4());
        }

        // Stake type settings
        BetStakeType stakeType = request.stakeType() != null ? request.stakeType() : BetStakeType.CREDIT;
        bet.setStakeType(stakeType);

        if (stakeType == BetStakeType.CREDIT) {
            // Credit-based bet: set fixed stake amount
            bet.setFixedStakeAmount(request.fixedStakeAmount());
        } else if (stakeType == BetStakeType.SOCIAL) {
            // Social bet: set social stake description
            bet.setSocialStakeDescription(request.socialStakeDescription());
        }

        // Financial settings (deprecated for backward compatibility)
        if (request.minimumBet() != null) {
            bet.setMinimumBet(request.minimumBet());
        }
        if (request.maximumBet() != null) {
            bet.setMaximumBet(request.maximumBet());
        }

        // Timing
        bet.setBettingDeadline(request.bettingDeadline());
        bet.setResolveDate(request.resolveDate());

        // Resolution settings
        if (request.minimumVotesRequired() != null) {
            bet.setMinimumVotesRequired(request.minimumVotesRequired());
        }
        if (request.allowCreatorVote() != null) {
            bet.setAllowCreatorVote(request.allowCreatorVote());
        }

        // Defaults
        bet.setStatus(Bet.BetStatus.OPEN);
        bet.setIsActive(true);
        bet.setTotalPool(BigDecimal.ZERO);
        bet.setTotalParticipants(0);
        bet.setParticipantsForOption1(0);
        bet.setParticipantsForOption2(0);
        bet.setPoolForOption1(BigDecimal.ZERO);
        bet.setPoolForOption2(BigDecimal.ZERO);

        return bet;
    }

    /**
     * Publishes a bet created event for notification processing.
     */
    private void publishBetCreatedEvent(Bet bet) {
        try {
            BetCreatedEvent event = new BetCreatedEvent(
                bet.getId(),
                bet.getTitle(),
                bet.getDescription(),
                bet.getGroup().getId(),
                bet.getGroup().getName(),
                bet.getCreator().getId(),
                bet.getCreator().getDisplayName(),
                bet.getMinimumBet(),
                bet.getBettingDeadline(),
                bet.getResolveDate()
            );

            eventPublisher.publishEvent(event);
        } catch (Exception e) {
            // Don't fail bet creation if event publishing fails
            // Just log the error and continue
            System.err.println("Failed to publish bet created event for bet " + bet.getId() + ": " + e.getMessage());
        }
    }

    // Bet creation request DTO
    public record BetCreationRequest(
        @NotBlank
        @Size(min = 3, max = 200, message = "Bet title must be between 3 and 200 characters")
        String title,

        @Size(max = 2000, message = "Description cannot exceed 2000 characters")
        String description,

        @NotNull
        Bet.BetType betType,

        @NotNull
        Bet.BetResolutionMethod resolutionMethod,

        @NotBlank
        @Size(min = 1, max = 100, message = "Option 1 must be between 1 and 100 characters")
        String option1,

        @NotBlank
        @Size(min = 1, max = 100, message = "Option 2 must be between 1 and 100 characters")
        String option2,

        @Size(max = 100, message = "Option 3 cannot exceed 100 characters")
        String option3,

        @Size(max = 100, message = "Option 4 cannot exceed 100 characters")
        String option4,

        // STAKE TYPE FIELDS
        // Stake type (CREDIT or SOCIAL) - defaults to CREDIT if not provided
        BetStakeType stakeType,

        // For CREDIT bets: Fixed stake amount (everyone bets exactly this amount)
        // Required when stakeType = CREDIT
        BigDecimal fixedStakeAmount,

        // For SOCIAL bets: Description of the social stake (e.g., "Loser buys pizza")
        // Required when stakeType = SOCIAL
        @Size(max = 500, message = "Social stake description cannot exceed 500 characters")
        String socialStakeDescription,

        // DEPRECATED: For backward compatibility with variable-stake bets
        BigDecimal minimumBet,

        // DEPRECATED: For backward compatibility with variable-stake bets
        BigDecimal maximumBet,

        @NotNull
        @Future(message = "Betting deadline must be in the future")
        LocalDateTime bettingDeadline,

        LocalDateTime resolveDate,

        @Min(value = 1, message = "Minimum votes required must be at least 1")
        Integer minimumVotesRequired,

        Boolean allowCreatorVote
    ) {}

}