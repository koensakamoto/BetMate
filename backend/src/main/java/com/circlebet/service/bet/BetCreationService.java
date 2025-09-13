package com.circlebet.service.bet;

import com.circlebet.entity.betting.Bet;
import com.circlebet.entity.group.Group;
import com.circlebet.entity.user.User;
import com.circlebet.exception.betting.BetCreationException;
import com.circlebet.service.group.GroupPermissionService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import org.springframework.beans.factory.annotation.Autowired;
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
    private final GroupPermissionService permissionService;

    @Autowired
    public BetCreationService(BetService betService, GroupPermissionService permissionService) {
        this.betService = betService;
        this.permissionService = permissionService;
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
        return betService.saveBet(bet);
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
        
        // Validate minimum bet
        if (request.minimumBet().compareTo(new BigDecimal("0.01")) < 0) {
            throw new BetCreationException("Minimum bet must be at least 0.01");
        }
        
        // Validate maximum bet
        if (request.maximumBet() != null && request.maximumBet().compareTo(request.minimumBet()) < 0) {
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
        
        // Financial settings
        bet.setMinimumBet(request.minimumBet());
        bet.setMaximumBet(request.maximumBet());
        
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
        
        @NotNull
        @DecimalMin(value = "0.01", message = "Minimum bet must be at least 0.01")
        BigDecimal minimumBet,
        
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