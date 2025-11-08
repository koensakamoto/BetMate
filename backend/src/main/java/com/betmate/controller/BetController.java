package com.betmate.controller;

import com.betmate.dto.betting.request.BetCreationRequestDto;
import java.math.BigDecimal;
import com.betmate.dto.betting.request.PlaceBetRequestDto;
import com.betmate.dto.betting.request.ResolveBetRequestDto;
import com.betmate.dto.betting.request.VoteOnResolutionRequestDto;
import com.betmate.dto.betting.response.BetResponseDto;
import com.betmate.dto.betting.response.BetSummaryResponseDto;
import com.betmate.dto.betting.response.BetParticipationResponseDto;
import com.betmate.dto.group.response.MemberPreviewDto;
import com.betmate.dto.user.response.UserProfileResponseDto;
import com.betmate.dto.common.PagedResponseDto;
import com.betmate.entity.betting.Bet;
import com.betmate.entity.group.Group;
import com.betmate.entity.user.User;
import com.betmate.service.bet.BetService;
import com.betmate.service.bet.BetCreationService;
import com.betmate.service.bet.BetParticipationService;
import com.betmate.service.bet.BetResolutionService;
import com.betmate.entity.betting.BetParticipation;
import com.betmate.service.group.GroupService;
import com.betmate.service.group.GroupMembershipService;
import com.betmate.service.user.UserService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

/**
 * REST controller for bet management operations.
 * Handles bet creation, participation, and resolution.
 */
@RestController
@RequestMapping("/api/bets")
public class BetController {

    private final BetService betService;
    private final BetCreationService betCreationService;
    private final BetParticipationService betParticipationService;
    private final BetResolutionService betResolutionService;
    private final GroupService groupService;
    private final GroupMembershipService groupMembershipService;
    private final UserService userService;

    @Autowired
    public BetController(BetService betService,
                        BetCreationService betCreationService,
                        BetParticipationService betParticipationService,
                        BetResolutionService betResolutionService,
                        GroupService groupService,
                        GroupMembershipService groupMembershipService,
                        UserService userService) {
        this.betService = betService;
        this.betCreationService = betCreationService;
        this.betParticipationService = betParticipationService;
        this.betResolutionService = betResolutionService;
        this.groupService = groupService;
        this.groupMembershipService = groupMembershipService;
        this.userService = userService;
    }

    /**
     * Create a new bet.
     */
    @PostMapping
    public ResponseEntity<BetResponseDto> createBet(
            @Valid @RequestBody BetCreationRequestDto request,
            Authentication authentication) {
        
        try {
            System.out.println("DEBUG: Received bet creation request: " + request.getTitle());
            System.out.println("DEBUG: Group ID: " + request.getGroupId());
            System.out.println("DEBUG: Bet Type: " + request.getBetType());
            
            User currentUser = userService.getUserByUsername(authentication.getName())
                .orElseThrow(() -> new RuntimeException("User not found"));
            System.out.println("DEBUG: Current user: " + currentUser.getUsername());
            
            Group group = groupService.getGroupById(request.getGroupId());
            System.out.println("DEBUG: Group found: " + group.getGroupName());
            
            // Convert DTO to creation request
            BetCreationService.BetCreationRequest creationRequest = new BetCreationService.BetCreationRequest(
                request.getTitle(),
                request.getDescription(),
                request.getBetType(),
                request.getResolutionMethod(),
                request.getOptions() != null && request.getOptions().length > 0 ? request.getOptions()[0] : "Yes",
                request.getOptions() != null && request.getOptions().length > 1 ? request.getOptions()[1] : "No",
                request.getOptions() != null && request.getOptions().length > 2 ? request.getOptions()[2] : null,
                request.getOptions() != null && request.getOptions().length > 3 ? request.getOptions()[3] : null,
                request.getMinimumBet() != null ? BigDecimal.valueOf(request.getMinimumBet()) : null,
                request.getMaximumBet() != null ? BigDecimal.valueOf(request.getMaximumBet()) : null,
                request.getBettingDeadline(),
                request.getResolveDate(),
                request.getMinimumVotesRequired(),
                request.getAllowCreatorVote()
            );
            
            System.out.println("DEBUG: About to call betCreationService");
            Bet bet = betCreationService.createBet(currentUser, group, creationRequest);
            System.out.println("DEBUG: Bet created with ID: " + bet.getId());
            
            BetResponseDto response = convertToDetailedResponse(bet, currentUser);
            
            return ResponseEntity.status(HttpStatus.CREATED).body(response);
        } catch (Exception e) {
            System.err.println("ERROR creating bet: " + e.getMessage());
            e.printStackTrace();
            throw e;
        }
    }

    /**
     * Get bet details by ID.
     */
    @GetMapping("/{betId}")
    public ResponseEntity<BetResponseDto> getBet(
            @PathVariable Long betId,
            Authentication authentication) {
        
        User currentUser = userService.getUserByUsername(authentication.getName())
            .orElseThrow(() -> new RuntimeException("User not found"));
        Bet bet = betService.getBetById(betId);
        
        BetResponseDto response = convertToDetailedResponse(bet, currentUser);
        return ResponseEntity.ok(response);
    }

    /**
     * Get bets for a specific group.
     */
    @GetMapping("/group/{groupId}")
    public ResponseEntity<List<BetSummaryResponseDto>> getGroupBets(
            @PathVariable Long groupId,
            @RequestParam(defaultValue = "createdAt") String sortBy,
            @RequestParam(defaultValue = "desc") String sortDir,
            Authentication authentication) {
        
        User currentUser = userService.getUserByUsername(authentication.getName())
            .orElseThrow(() -> new RuntimeException("User not found"));
        Group group = groupService.getGroupById(groupId);

        // Check if user is member of the group
        if (!groupMembershipService.isMember(currentUser, group)) {
            throw new RuntimeException("Access denied - not a member of this group");
        }

        List<Bet> bets = betService.getBetsByGroup(group);
        List<BetSummaryResponseDto> response = bets.stream()
            .map(bet -> convertToSummaryResponse(bet, currentUser))
            .toList();
        
        return ResponseEntity.ok(response);
    }

    /**
     * Get bets where current user has participated.
     */
    @GetMapping("/my")
    public ResponseEntity<List<BetSummaryResponseDto>> getMyBets(
            Authentication authentication) {
        
        User currentUser = userService.getUserByUsername(authentication.getName())
            .orElseThrow(() -> new RuntimeException("User not found"));
        
        // Get user's ACTIVE participations and extract the bets
        List<BetParticipation> participations = betParticipationService.getUserParticipations(currentUser);
        System.out.println("DEBUG: User " + currentUser.getUsername() + " has " + participations.size() + " total participations");
        
        // Filter to only ACTIVE participations for "My Bets" 
        List<Bet> bets = participations.stream()
            .filter(p -> p.getStatus() == BetParticipation.ParticipationStatus.ACTIVE)
            .map(BetParticipation::getBet)
            .distinct()
            .toList();
        System.out.println("DEBUG: Found " + bets.size() + " unique bets from participations");
        
        for (Bet bet : bets) {
            System.out.println("DEBUG: Bet ID=" + bet.getId() + ", Title=" + bet.getTitle() + ", Creator=" + bet.getCreator().getUsername());
        }
            
        List<BetSummaryResponseDto> response = bets.stream()
            .map(bet -> convertToSummaryResponse(bet, currentUser))
            .toList();
        
        return ResponseEntity.ok(response);
    }

    /**
     * Get bets created by current user.
     */
    @GetMapping("/created")
    public ResponseEntity<List<BetSummaryResponseDto>> getCreatedBets(
            Authentication authentication) {
        
        User currentUser = userService.getUserByUsername(authentication.getName())
            .orElseThrow(() -> new RuntimeException("User not found"));
        
        List<Bet> bets = betService.getBetsByCreator(currentUser);
        List<BetSummaryResponseDto> response = bets.stream()
            .map(bet -> convertToSummaryResponse(bet, currentUser))
            .toList();
        
        return ResponseEntity.ok(response);
    }

    /**
     * Get bets by status.
     */
    @GetMapping("/status/{status}")
    public ResponseEntity<List<BetSummaryResponseDto>> getBetsByStatus(
            @PathVariable Bet.BetStatus status,
            Authentication authentication) {

        User currentUser = userService.getUserByUsername(authentication.getName())
            .orElseThrow(() -> new RuntimeException("User not found"));

        List<Bet> bets = betService.getBetsByStatus(status);
        List<BetSummaryResponseDto> response = bets.stream()
            .map(bet -> convertToSummaryResponse(bet, currentUser))
            .toList();

        return ResponseEntity.ok(response);
    }

    /**
     * Place a bet on an existing bet.
     */
    @PostMapping("/{betId}/participate")
    public ResponseEntity<BetResponseDto> placeBet(
            @PathVariable Long betId,
            @Valid @RequestBody PlaceBetRequestDto request,
            Authentication authentication) {

        try {
            User currentUser = userService.getUserByUsername(authentication.getName())
                .orElseThrow(() -> new RuntimeException("User not found"));

            System.out.println("DEBUG: Placing bet - User: " + currentUser.getUsername() +
                             ", BetId: " + betId + ", Option: " + request.getChosenOption() +
                             ", Amount: " + request.getAmount());

            // Place the bet
            BetParticipation participation = betParticipationService.placeBet(
                currentUser,
                betId,
                request.getChosenOption(),
                request.getAmount()
            );

            // Get updated bet details
            Bet bet = betService.getBetById(betId);
            BetResponseDto response = convertToDetailedResponse(bet, currentUser);

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            System.err.println("ERROR placing bet: " + e.getMessage());
            e.printStackTrace();
            throw e;
        }
    }

    /**
     * Resolve a bet (for creators or assigned resolvers).
     * Supports two resolution modes:
     * 1. Option-based: Pass 'outcome' field for BINARY/MULTIPLE_CHOICE bets
     * 2. Winner-based: Pass 'winnerUserIds' field for PREDICTION bets
     */
    @PostMapping("/{betId}/resolve")
    public ResponseEntity<BetResponseDto> resolveBet(
            @PathVariable Long betId,
            @Valid @RequestBody ResolveBetRequestDto request,
            Authentication authentication) {

        try {
            User currentUser = userService.getUserByUsername(authentication.getName())
                .orElseThrow(() -> new RuntimeException("User not found"));

            Bet resolvedBet;

            // Check which resolution mode to use
            if (request.getWinnerUserIds() != null && !request.getWinnerUserIds().isEmpty()) {
                // Winner-based resolution (for PREDICTION bets)
                System.out.println("DEBUG: Resolving bet by winners - User: " + currentUser.getUsername() +
                                 ", BetId: " + betId + ", Winners: " + request.getWinnerUserIds());

                resolvedBet = betResolutionService.resolveBetByWinners(
                    betId,
                    currentUser,
                    request.getWinnerUserIds(),
                    request.getReasoning()
                );
            } else if (request.getOutcome() != null && !request.getOutcome().trim().isEmpty()) {
                // Option-based resolution (for BINARY/MULTIPLE_CHOICE bets)
                System.out.println("DEBUG: Resolving bet by outcome - User: " + currentUser.getUsername() +
                                 ", BetId: " + betId + ", Outcome: " + request.getOutcome());

                Bet.BetOutcome outcome = convertStringToOutcome(request.getOutcome());

                resolvedBet = betResolutionService.resolveBet(
                    betId,
                    currentUser,
                    outcome,
                    request.getReasoning()
                );
            } else {
                throw new RuntimeException("Either outcome or winnerUserIds must be provided");
            }

            // Return updated bet details
            BetResponseDto response = convertToDetailedResponse(resolvedBet, currentUser);
            return ResponseEntity.ok(response);

        } catch (Exception e) {
            System.err.println("ERROR resolving bet: " + e.getMessage());
            e.printStackTrace();
            throw e;
        }
    }

    /**
     * Vote on bet resolution (for consensus voting).
     */
    @PostMapping("/{betId}/vote")
    public ResponseEntity<BetResponseDto> voteOnResolution(
            @PathVariable Long betId,
            @Valid @RequestBody VoteOnResolutionRequestDto request,
            Authentication authentication) {

        try {
            User currentUser = userService.getUserByUsername(authentication.getName())
                .orElseThrow(() -> new RuntimeException("User not found"));

            System.out.println("DEBUG: Voting on resolution - User: " + currentUser.getUsername() +
                             ", BetId: " + betId + ", Vote: " + request.getOutcome());

            // Convert string outcome to BetOutcome enum
            Bet.BetOutcome outcome = convertStringToOutcome(request.getOutcome());

            // Submit vote
            betResolutionService.voteOnBetResolution(
                betId,
                currentUser,
                outcome,
                request.getReasoning()
            );

            // Get updated bet details
            Bet bet = betService.getBetById(betId);

            // Return updated bet details
            BetResponseDto response = convertToDetailedResponse(bet, currentUser);
            return ResponseEntity.ok(response);

        } catch (Exception e) {
            System.err.println("ERROR voting on resolution: " + e.getMessage());
            e.printStackTrace();
            throw e;
        }
    }

    /**
     * Get all participations for a bet (for resolvers to see who participated).
     */
    @GetMapping("/{betId}/participations")
    public ResponseEntity<List<BetParticipationResponseDto>> getBetParticipations(
            @PathVariable Long betId,
            Authentication authentication) {

        try {
            User currentUser = userService.getUserByUsername(authentication.getName())
                .orElseThrow(() -> new RuntimeException("User not found"));

            Bet bet = betService.getBetById(betId);

            // Check if user is authorized to view participations
            // For now, allow bet creator, group members, and participants
            if (!groupMembershipService.isMember(currentUser, bet.getGroup())) {
                throw new RuntimeException("Access denied - not a member of this group");
            }

            // Get all participations for this bet
            List<BetParticipation> participations = betParticipationService.getBetParticipations(betId);

            // Convert to DTOs
            List<BetParticipationResponseDto> response = participations.stream()
                .filter(p -> p.getStatus() == BetParticipation.ParticipationStatus.ACTIVE ||
                           p.getStatus() == BetParticipation.ParticipationStatus.WON ||
                           p.getStatus() == BetParticipation.ParticipationStatus.LOST)
                .map(p -> BetParticipationResponseDto.fromParticipation(p, bet))
                .toList();

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            System.err.println("ERROR getting bet participations: " + e.getMessage());
            e.printStackTrace();
            throw e;
        }
    }

    // Helper methods for DTO conversion
    private BetResponseDto convertToDetailedResponse(Bet bet, User currentUser) {
        BetResponseDto response = new BetResponseDto();
        response.setId(bet.getId());
        response.setTitle(bet.getTitle());
        response.setDescription(bet.getDescription());
        response.setBetType(bet.getBetType());
        response.setStatus(bet.getStatus());
        response.setOutcome(bet.getOutcome());
        response.setResolutionMethod(bet.getResolutionMethod());
        response.setCreator(UserProfileResponseDto.fromUser(bet.getCreator()));
        response.setGroupId(bet.getGroup().getId());
        response.setGroupName(bet.getGroup().getGroupName());
        response.setBettingDeadline(bet.getBettingDeadline());
        response.setResolveDate(bet.getResolveDate());
        response.setResolvedAt(bet.getResolvedAt());
        response.setMinimumBet(bet.getMinimumBet());
        response.setMaximumBet(bet.getMaximumBet());
        response.setTotalPool(bet.getTotalPool());
        response.setTotalParticipants(bet.getTotalParticipants());
        response.setMinimumVotesRequired(bet.getMinimumVotesRequired());
        response.setAllowCreatorVote(bet.getAllowCreatorVote());
        response.setCreatedAt(bet.getCreatedAt());
        response.setUpdatedAt(bet.getUpdatedAt());

        // Set bet options
        List<String> options = new ArrayList<>();
        System.out.println("DEBUG: Building options for bet " + bet.getId());
        System.out.println("DEBUG: option1 = '" + bet.getOption1() + "'");
        System.out.println("DEBUG: option2 = '" + bet.getOption2() + "'");
        System.out.println("DEBUG: option3 = '" + bet.getOption3() + "'");
        System.out.println("DEBUG: option4 = '" + bet.getOption4() + "'");

        if (bet.getOption1() != null && !bet.getOption1().trim().isEmpty()) {
            options.add(bet.getOption1());
            System.out.println("DEBUG: Added option1: " + bet.getOption1());
        }
        if (bet.getOption2() != null && !bet.getOption2().trim().isEmpty()) {
            options.add(bet.getOption2());
            System.out.println("DEBUG: Added option2: " + bet.getOption2());
        }
        if (bet.getOption3() != null && !bet.getOption3().trim().isEmpty()) {
            options.add(bet.getOption3());
            System.out.println("DEBUG: Added option3: " + bet.getOption3());
        }
        if (bet.getOption4() != null && !bet.getOption4().trim().isEmpty()) {
            options.add(bet.getOption4());
            System.out.println("DEBUG: Added option4: " + bet.getOption4());
        }
        System.out.println("DEBUG: Final options list: " + options);
        response.setOptions(options.toArray(new String[0]));

        // Set user context
        boolean hasParticipated = betParticipationService.hasUserParticipated(currentUser, bet.getId());
        response.setHasUserParticipated(hasParticipated);

        // If user has participated, get their choice and amount
        if (hasParticipated) {
            betParticipationService.getUserParticipation(currentUser, bet.getId())
                .ifPresent(participation -> {
                    // Convert integer option (1,2,3,4) to BetOutcome enum
                    Bet.BetOutcome userChoice = switch (participation.getChosenOption()) {
                        case 1 -> Bet.BetOutcome.OPTION_1;
                        case 2 -> Bet.BetOutcome.OPTION_2;
                        case 3 -> Bet.BetOutcome.OPTION_3;
                        case 4 -> Bet.BetOutcome.OPTION_4;
                        default -> null;
                    };
                    response.setUserChoice(userChoice);
                    response.setUserAmount(participation.getBetAmount());
                });
        }

        response.setCanUserResolve(bet.getCreator().getId().equals(currentUser.getId()));

        return response;
    }

    private BetSummaryResponseDto convertToSummaryResponse(Bet bet, User currentUser) {
        BetSummaryResponseDto response = new BetSummaryResponseDto();
        response.setId(bet.getId());
        response.setTitle(bet.getTitle());
        response.setBetType(bet.getBetType());
        response.setStatus(bet.getStatus());
        response.setOutcome(bet.getOutcome());
        response.setCreatorUsername(bet.getCreator().getUsername());
        response.setGroupId(bet.getGroup().getId());
        response.setGroupName(bet.getGroup().getGroupName());
        response.setBettingDeadline(bet.getBettingDeadline());
        response.setResolveDate(bet.getResolveDate());
        response.setTotalPool(bet.getTotalPool());
        response.setTotalParticipants(bet.getTotalParticipants());
        response.setCreatedAt(bet.getCreatedAt());
        
        // Set user context - check if current user has participated in this bet
        boolean hasParticipated = betParticipationService.hasUserParticipated(currentUser, bet.getId());
        response.setHasUserParticipated(hasParticipated);

        // If user has participated, get their choice and amount
        if (hasParticipated) {
            betParticipationService.getUserParticipation(currentUser, bet.getId())
                .ifPresent(participation -> {
                    // Convert integer option (1,2,3,4) to BetOutcome enum
                    Bet.BetOutcome userChoice = switch (participation.getChosenOption()) {
                        case 1 -> Bet.BetOutcome.OPTION_1;
                        case 2 -> Bet.BetOutcome.OPTION_2;
                        case 3 -> Bet.BetOutcome.OPTION_3;
                        case 4 -> Bet.BetOutcome.OPTION_4;
                        default -> null;
                    };
                    response.setUserChoice(userChoice);
                    response.setUserAmount(participation.getBetAmount());
                });
        }

        // Fetch first 3 participants for preview avatars
        List<BetParticipation> participations = betParticipationService.getBetParticipations(bet.getId());
        System.out.println("🔍 [BetController] Bet: " + bet.getTitle() +
                          ", Total participants fetched: " + participations.size());

        List<MemberPreviewDto> participantPreviews = participations.stream()
            .limit(3)
            .map(participation -> {
                User user = participation.getUser();
                return new MemberPreviewDto(
                    user.getId(),
                    user.getUsername(),
                    user.getFirstName(),
                    user.getLastName(),
                    user.getProfileImageUrl()
                );
            })
            .collect(Collectors.toList());

        System.out.println("🔍 [BetController] Participant previews created: " + participantPreviews.size());
        participantPreviews.forEach(pp ->
            System.out.println("   - Participant: " + pp.getUsername() +
                              ", firstName: " + pp.getFirstName() +
                              ", lastName: " + pp.getLastName() +
                              ", profileImageUrl: " + pp.getProfileImageUrl())
        );

        response.setParticipantPreviews(participantPreviews);

        return response;
    }

    /**
     * Helper method to convert string outcomes to BetOutcome enum.
     * Handles both simple option strings (OPTION_1, OPTION_2) and exact value predictions.
     */
    private Bet.BetOutcome convertStringToOutcome(String outcomeString) {
        if (outcomeString == null || outcomeString.trim().isEmpty()) {
            throw new IllegalArgumentException("Outcome string cannot be null or empty");
        }

        // Handle standard option outcomes
        switch (outcomeString.toUpperCase()) {
            case "OPTION_1":
                return Bet.BetOutcome.OPTION_1;
            case "OPTION_2":
                return Bet.BetOutcome.OPTION_2;
            case "OPTION_3":
                return Bet.BetOutcome.OPTION_3;
            case "OPTION_4":
                return Bet.BetOutcome.OPTION_4;
            case "DRAW":
                return Bet.BetOutcome.DRAW;
            case "CANCELLED":
                return Bet.BetOutcome.CANCELLED;
            default:
                // For exact value bets, the outcome might be a JSON string with winners
                // or a specific prediction value. For now, we'll treat these as OPTION_1
                // The actual resolution logic will be handled by the service layer
                System.out.println("DEBUG: Converting non-standard outcome: " + outcomeString + " -> OPTION_1");
                return Bet.BetOutcome.OPTION_1;
        }
    }
}