package com.rivalpicks.controller;

import com.rivalpicks.dto.betting.request.BetCreationRequestDto;
import com.rivalpicks.dto.betting.request.CancelBetRequestDto;
import java.math.BigDecimal;
import com.rivalpicks.dto.betting.request.PlaceBetRequestDto;
import com.rivalpicks.dto.betting.request.ResolveBetRequestDto;
import com.rivalpicks.dto.betting.request.VoteOnResolutionRequestDto;
import com.rivalpicks.dto.betting.response.BetResponseDto;
import com.rivalpicks.dto.betting.response.BetSummaryResponseDto;
import com.rivalpicks.dto.betting.response.BetParticipationResponseDto;
import com.rivalpicks.dto.betting.response.ResolverInfoDto;
import com.rivalpicks.dto.betting.response.VotingProgressDto;
import com.rivalpicks.dto.group.response.MemberPreviewDto;
import com.rivalpicks.dto.user.response.UserProfileResponseDto;
import com.rivalpicks.dto.common.PagedResponseDto;
import com.rivalpicks.entity.betting.Bet;
import com.rivalpicks.entity.group.Group;
import com.rivalpicks.entity.user.User;
import com.rivalpicks.service.bet.BetService;
import com.rivalpicks.service.bet.BetCreationService;
import com.rivalpicks.service.bet.BetParticipationService;
import com.rivalpicks.service.bet.BetResolutionService;
import com.rivalpicks.service.bet.BetFulfillmentService;
import com.rivalpicks.service.bet.InsuranceService;
import com.rivalpicks.entity.betting.BetParticipation;
import com.rivalpicks.entity.betting.BetPrediction;
import com.rivalpicks.entity.betting.BetResolver;
import com.rivalpicks.entity.betting.BetResolutionVote;
import com.rivalpicks.repository.betting.BetPredictionRepository;
import com.rivalpicks.repository.betting.BetResolverRepository;
import com.rivalpicks.service.group.GroupService;
import com.rivalpicks.service.group.GroupMembershipService;
import com.rivalpicks.service.user.UserService;
import com.rivalpicks.service.FileStorageService;
import com.rivalpicks.repository.betting.LoserFulfillmentClaimRepository;
import com.rivalpicks.repository.betting.BetResolutionVoteRepository;
import com.rivalpicks.repository.betting.BetResolutionVoteWinnerRepository;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * REST controller for bet management operations.
 * Handles bet creation, participation, and resolution.
 */
@RestController
@RequestMapping("/api/bets")
public class BetController {

    private static final Logger logger = LoggerFactory.getLogger(BetController.class);

    private final BetService betService;
    private final BetCreationService betCreationService;
    private final BetParticipationService betParticipationService;
    private final BetResolutionService betResolutionService;
    private final BetFulfillmentService betFulfillmentService;
    private final InsuranceService insuranceService;
    private final GroupService groupService;
    private final GroupMembershipService groupMembershipService;
    private final UserService userService;
    private final FileStorageService fileStorageService;
    private final LoserFulfillmentClaimRepository loserFulfillmentClaimRepository;
    private final BetResolutionVoteRepository betResolutionVoteRepository;
    private final BetResolverRepository betResolverRepository;
    private final BetPredictionRepository betPredictionRepository;
    private final BetResolutionVoteWinnerRepository betResolutionVoteWinnerRepository;

    @Autowired
    public BetController(BetService betService,
                        BetCreationService betCreationService,
                        BetParticipationService betParticipationService,
                        BetResolutionService betResolutionService,
                        BetFulfillmentService betFulfillmentService,
                        InsuranceService insuranceService,
                        GroupService groupService,
                        GroupMembershipService groupMembershipService,
                        UserService userService,
                        FileStorageService fileStorageService,
                        LoserFulfillmentClaimRepository loserFulfillmentClaimRepository,
                        BetResolutionVoteRepository betResolutionVoteRepository,
                        BetResolverRepository betResolverRepository,
                        BetPredictionRepository betPredictionRepository,
                        BetResolutionVoteWinnerRepository betResolutionVoteWinnerRepository) {
        this.betService = betService;
        this.betCreationService = betCreationService;
        this.betParticipationService = betParticipationService;
        this.betResolutionService = betResolutionService;
        this.betFulfillmentService = betFulfillmentService;
        this.insuranceService = insuranceService;
        this.groupService = groupService;
        this.groupMembershipService = groupMembershipService;
        this.userService = userService;
        this.fileStorageService = fileStorageService;
        this.loserFulfillmentClaimRepository = loserFulfillmentClaimRepository;
        this.betResolutionVoteRepository = betResolutionVoteRepository;
        this.betResolverRepository = betResolverRepository;
        this.betPredictionRepository = betPredictionRepository;
        this.betResolutionVoteWinnerRepository = betResolutionVoteWinnerRepository;
    }

    /**
     * Create a new bet.
     */
    @PostMapping
    public ResponseEntity<BetResponseDto> createBet(
            @Valid @RequestBody BetCreationRequestDto request,
            Authentication authentication) {
        
        try {
            User currentUser = userService.getUserByUsername(authentication.getName())
                .orElseThrow(() -> new RuntimeException("User not found"));

            Group group = groupService.getGroupById(request.getGroupId());
            
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
                request.getStakeType(),
                request.getFixedStakeAmount() != null ? BigDecimal.valueOf(request.getFixedStakeAmount()) : null,
                request.getSocialStakeDescription(),
                request.getMinimumBet() != null ? BigDecimal.valueOf(request.getMinimumBet()) : null,
                request.getMaximumBet() != null ? BigDecimal.valueOf(request.getMaximumBet()) : null,
                request.getBettingDeadline(),
                request.getResolveDate(),
                request.getMinimumVotesRequired(),
                request.getAllowCreatorVote(),
                request.getResolverUserIds()
            );
            
            Bet bet = betCreationService.createBet(currentUser, group, creationRequest);
            
            BetResponseDto response = convertToDetailedResponse(bet, currentUser);
            
            return ResponseEntity.status(HttpStatus.CREATED).body(response);
        } catch (Exception e) {
            logger.error("Error creating bet: {}", e.getMessage(), e);
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
        
        // Get user's participations and extract the bets (including ACTIVE, WON, LOST, etc.)
        List<BetParticipation> participations = betParticipationService.getUserParticipations(currentUser);

        // Include all participation statuses (ACTIVE, WON, LOST) for "My Bets"
        List<Bet> bets = participations.stream()
            .map(BetParticipation::getBet)
            .distinct()
            .toList();

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
     * Get visible bets for a user's profile based on privacy rules.
     * Shows bets from PUBLIC groups (anyone can see), and PRIVATE/SECRET groups (only members can see).
     */
    @GetMapping("/profile/{userId}")
    public ResponseEntity<List<BetSummaryResponseDto>> getProfileBets(
            @PathVariable Long userId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            Authentication authentication) {

        User currentUser = userService.getUserByUsername(authentication.getName())
            .orElseThrow(() -> new RuntimeException("User not found"));

        User profileUser = userService.getUserById(userId);

        List<Bet> bets = betService.getVisibleBetsForProfile(profileUser, currentUser);

        // Apply pagination manually since we're already filtering
        int start = page * size;
        int end = Math.min(start + size, bets.size());
        List<Bet> paginatedBets = start < bets.size()
            ? bets.subList(start, end)
            : new ArrayList<>();

        List<BetSummaryResponseDto> response = paginatedBets.stream()
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

            // Get bet to check type
            Bet bet = betService.getBetById(betId);

            BetParticipation participation;

            // Handle PREDICTION bets differently
            if (bet.getBetType() == Bet.BetType.PREDICTION) {
                // Validate predictedValue is provided
                if (request.getPredictedValue() == null || request.getPredictedValue().trim().isEmpty()) {
                    throw new IllegalArgumentException("Predicted value is required for prediction bets");
                }

                participation = betParticipationService.placeBetWithPrediction(
                    currentUser,
                    betId,
                    request.getAmount(),
                    request.getPredictedValue(),
                    request.getInsuranceItemId()
                );
            } else {
                // Handle regular bets (BINARY, MULTIPLE_CHOICE)
                // Validate chosenOption is provided
                if (request.getChosenOption() == null) {
                    throw new IllegalArgumentException("Chosen option is required for non-prediction bets");
                }

                participation = betParticipationService.placeBet(
                    currentUser,
                    betId,
                    request.getChosenOption(),
                    request.getAmount(),
                    request.getInsuranceItemId()
                );
            }

            // Get updated bet details
            bet = betService.getBetById(betId);
            BetResponseDto response = convertToDetailedResponse(bet, currentUser);

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            logger.error("Error placing bet: {}", e.getMessage(), e);
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
                resolvedBet = betResolutionService.resolveBetByWinners(
                    betId,
                    currentUser,
                    request.getWinnerUserIds(),
                    request.getReasoning()
                );
            } else if (request.getOutcome() != null && !request.getOutcome().trim().isEmpty()) {
                // Option-based resolution (for BINARY/MULTIPLE_CHOICE bets)
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
            logger.error("Error resolving bet: {}", e.getMessage(), e);
            throw e;
        }
    }

    /**
     * Vote on bet resolution (for consensus voting).
     *
     * Supports two vote types:
     * 1. Outcome-based (BINARY/MULTIPLE_CHOICE): Pass 'outcome' field
     * 2. Winner-based (PREDICTION): Pass 'winnerUserIds' field
     */
    @PostMapping("/{betId}/vote")
    public ResponseEntity<BetResponseDto> voteOnResolution(
            @PathVariable Long betId,
            @Valid @RequestBody VoteOnResolutionRequestDto request,
            Authentication authentication) {

        try {
            User currentUser = userService.getUserByUsername(authentication.getName())
                .orElseThrow(() -> new RuntimeException("User not found"));

            // Validate request has either outcome or winnerUserIds
            if (!request.isValid()) {
                throw new RuntimeException("Either outcome or winnerUserIds must be provided");
            }

            if (request.isWinnerBasedVote()) {
                // Winner-based voting for PREDICTION bets
                betResolutionService.voteOnPredictionResolution(
                    betId,
                    currentUser,
                    request.getWinnerUserIds(),
                    request.getReasoning()
                );
            } else {
                // Outcome-based voting for BINARY/MULTIPLE_CHOICE bets
                Bet.BetOutcome outcome = convertStringToOutcome(request.getOutcome());

                betResolutionService.voteOnBetResolution(
                    betId,
                    currentUser,
                    outcome,
                    request.getReasoning()
                );
            }

            // Get updated bet details
            Bet bet = betService.getBetById(betId);

            // Return updated bet details
            BetResponseDto response = convertToDetailedResponse(bet, currentUser);
            return ResponseEntity.ok(response);

        } catch (Exception e) {
            logger.error("Error voting on resolution: {}", e.getMessage(), e);
            throw e;
        }
    }

    /**
     * Cancel a bet and refund all participants.
     * Only the bet creator can cancel a bet, and only if it's not resolved.
     */
    @PostMapping("/{betId}/cancel")
    public ResponseEntity<BetResponseDto> cancelBet(
            @PathVariable Long betId,
            @RequestBody(required = false) CancelBetRequestDto request,
            Authentication authentication) {

        try {
            User currentUser = userService.getUserByUsername(authentication.getName())
                .orElseThrow(() -> new RuntimeException("User not found"));

            Bet bet = betService.getBetById(betId);

            // Verify current user is the bet creator
            if (!bet.isCreator(currentUser)) {
                logger.warn("User {} attempted to cancel bet {} but is not the creator",
                    currentUser.getUsername(), betId);
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .build();
            }

            // Verify bet is not already resolved
            if (bet.getStatus() == Bet.BetStatus.RESOLVED) {
                logger.warn("User {} attempted to cancel already resolved bet {}",
                    currentUser.getUsername(), betId);
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .build();
            }

            logger.info("User {} is cancelling bet {}", currentUser.getUsername(), betId);

            // Cancel the bet with optional reason
            String reason = request != null ? request.getReason() : null;
            Bet cancelledBet = betService.cancelBet(betId, reason, currentUser);

            // Return updated bet details
            BetResponseDto response = convertToDetailedResponse(cancelledBet, currentUser);
            return ResponseEntity.ok(response);

        } catch (Exception e) {
            logger.error("ERROR cancelling bet: " + e.getMessage(), e);
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

            // Filter participations (include DRAW status for three-state resolution)
            List<BetParticipation> filteredParticipations = participations.stream()
                .filter(p -> p.getStatus() == BetParticipation.ParticipationStatus.ACTIVE ||
                           p.getStatus() == BetParticipation.ParticipationStatus.WON ||
                           p.getStatus() == BetParticipation.ParticipationStatus.LOST ||
                           p.getStatus() == BetParticipation.ParticipationStatus.DRAW)
                .toList();

            // For prediction bets, fetch all predictions and create a lookup map
            Map<Long, String> predictionMap = Map.of();
            if (bet.getBetType() == Bet.BetType.PREDICTION && !filteredParticipations.isEmpty()) {
                List<BetPrediction> predictions = betPredictionRepository.findByParticipationIn(filteredParticipations);
                predictionMap = predictions.stream()
                    .collect(Collectors.toMap(
                        p -> p.getParticipation().getId(),
                        BetPrediction::getPredictedValue
                    ));
            }

            // For resolved PREDICTION bets, get vote counts for transparency
            Map<Long, Long> voteCountMap = Map.of();
            int totalVoters = 0;
            if (bet.getBetType() == Bet.BetType.PREDICTION && bet.getStatus() == Bet.BetStatus.RESOLVED) {
                List<Object[]> voteDistribution = betResolutionVoteWinnerRepository.getWinnerVoteDistributionForBet(bet);
                voteCountMap = voteDistribution.stream()
                    .collect(Collectors.toMap(
                        row -> (Long) row[0],
                        row -> ((Number) row[1]).longValue()
                    ));
                Long totalVotersLong = betResolutionVoteWinnerRepository.countVotesWithWinnerSelectionsForBet(bet);
                totalVoters = totalVotersLong != null ? totalVotersLong.intValue() : 0;
            }

            // Convert to DTOs with predictions and vote counts
            final Map<Long, String> finalPredictionMap = predictionMap;
            final Map<Long, Long> finalVoteCountMap = voteCountMap;
            final int finalTotalVoters = totalVoters;
            List<BetParticipationResponseDto> response = filteredParticipations.stream()
                .map(p -> {
                    BetParticipationResponseDto dto = BetParticipationResponseDto.fromParticipation(
                        p,
                        bet,
                        finalPredictionMap.get(p.getId())
                    );
                    // Add vote counts for resolved PREDICTION bets
                    if (bet.getBetType() == Bet.BetType.PREDICTION && bet.getStatus() == Bet.BetStatus.RESOLVED) {
                        Long votesReceived = finalVoteCountMap.getOrDefault(p.getUser().getId(), 0L);
                        dto.setVotesReceived(votesReceived.intValue());
                        dto.setTotalVoters(finalTotalVoters);
                    }
                    return dto;
                })
                .toList();

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            logger.error("Error getting bet participations: {}", e.getMessage(), e);
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
        response.setCancellationReason(bet.getCancellationReason());
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
        response.setFixedStakeAmount(bet.getFixedStakeAmount());  // NEW: Fixed-stake betting
        response.setStakeType(bet.getStakeType());  // NEW: Stake type (CREDIT/SOCIAL)
        response.setSocialStakeDescription(bet.getSocialStakeDescription());  // NEW: Social stake description

        // Fulfillment tracking fields
        response.setFulfillmentStatus(bet.getFulfillmentStatus());
        response.setLoserClaimedFulfilledAt(bet.getLoserClaimedFulfilledAt());
        response.setLoserFulfillmentProofUrl(bet.getLoserFulfillmentProofUrl());
        response.setLoserFulfillmentProofDescription(bet.getLoserFulfillmentProofDescription());
        response.setAllWinnersConfirmedAt(bet.getAllWinnersConfirmedAt());

        response.setTotalPool(bet.getTotalPool());
        response.setTotalParticipants(bet.getTotalParticipants());
        response.setMinimumVotesRequired(bet.getMinimumVotesRequired());
        response.setAllowCreatorVote(bet.getAllowCreatorVote());
        response.setCreatedAt(bet.getCreatedAt());
        response.setUpdatedAt(bet.getUpdatedAt());

        // Set bet options
        List<String> options = new ArrayList<>();
        if (bet.getOption1() != null && !bet.getOption1().trim().isEmpty()) {
            options.add(bet.getOption1());
        }
        if (bet.getOption2() != null && !bet.getOption2().trim().isEmpty()) {
            options.add(bet.getOption2());
        }
        if (bet.getOption3() != null && !bet.getOption3().trim().isEmpty()) {
            options.add(bet.getOption3());
        }
        if (bet.getOption4() != null && !bet.getOption4().trim().isEmpty()) {
            options.add(bet.getOption4());
        }
        response.setOptions(options.toArray(new String[0]));

        // Set user context
        boolean hasParticipated = betParticipationService.hasUserParticipated(currentUser, bet.getId());
        response.setHasUserParticipated(hasParticipated);

        // If user has participated, get their choice and amount
        if (hasParticipated) {
            betParticipationService.getUserParticipation(currentUser, bet.getId())
                .ifPresent(participation -> {
                    // Convert integer option (1,2,3,4) to BetOutcome enum (1-indexed)
                    Bet.BetOutcome userChoice = switch (participation.getChosenOption()) {
                        case 1 -> Bet.BetOutcome.OPTION_1;
                        case 2 -> Bet.BetOutcome.OPTION_2;
                        case 3 -> Bet.BetOutcome.OPTION_3;
                        case 4 -> Bet.BetOutcome.OPTION_4;
                        default -> null;
                    };
                    response.setUserChoice(userChoice);
                    response.setUserAmount(participation.getBetAmount());

                    // Set insurance information if user has insurance on this bet
                    if (participation.hasInsurance()) {
                        response.setHasInsurance(true);
                        response.setInsuranceRefundPercentage(participation.getInsuranceRefundPercentage());
                        if (participation.getInsuranceItem() != null &&
                            participation.getInsuranceItem().getStoreItem() != null) {
                            String tierName = insuranceService.getInsuranceTierName(
                                participation.getInsuranceItem().getStoreItem().getItemType()
                            );
                            response.setInsuranceTier(tierName);
                        }
                        // Calculate refund amount
                        if (participation.getInsuranceRefundPercentage() != null) {
                            BigDecimal refundAmount = insuranceService.calculateRefundAmount(
                                participation.getBetAmount(),
                                participation.getInsuranceRefundPercentage()
                            );
                            response.setInsuranceRefundAmount(refundAmount);
                        }
                    } else {
                        response.setHasInsurance(false);
                    }
                });
        }

        // Check if user can resolve/vote using the resolution service
        response.setCanUserResolve(betResolutionService.canUserResolveBet(bet.getId(), currentUser));

        // Check if user has already voted on resolution (for PARTICIPANT_VOTE bets)
        boolean hasVoted = betResolutionVoteRepository.existsByBetAndVoterAndIsActiveTrue(bet, currentUser);
        response.setHasUserVoted(hasVoted);

        // Populate resolver information based on resolution method
        populateResolverInfo(response, bet);

        return response;
    }

    /**
     * Populates resolver information in the response DTO based on the bet's resolution method.
     */
    private void populateResolverInfo(BetResponseDto response, Bet bet) {
        // Set human-readable resolution method display
        String methodDisplay = switch (bet.getResolutionMethod()) {
            case SELF -> "Creator";
            case ASSIGNED_RESOLVERS -> "Assigned Resolvers";
            case PARTICIPANT_VOTE -> "Participant Vote";
        };
        response.setResolutionMethodDisplay(methodDisplay);

        // Populate resolvers list based on method
        List<ResolverInfoDto> resolvers = new ArrayList<>();

        // Pre-fetch all votes for this bet in ONE query to avoid N+1
        Map<Long, BetResolutionVote> votesByVoterId = bet.getStatus() != Bet.BetStatus.OPEN
            ? betResolutionVoteRepository.findByBetAndIsActiveTrue(bet).stream()
                .collect(Collectors.toMap(v -> v.getVoter().getId(), v -> v, (a, b) -> a))
            : Map.of();

        switch (bet.getResolutionMethod()) {
            case SELF -> {
                // Creator is the sole resolver
                ResolverInfoDto dto = ResolverInfoDto.fromUser(bet.getCreator());
                // For CLOSED/RESOLVED bets, include the creator's vote details
                if (bet.getStatus() != Bet.BetStatus.OPEN) {
                    BetResolutionVote vote = votesByVoterId.get(bet.getCreator().getId());
                    dto.setHasVoted(vote != null || bet.getStatus() == Bet.BetStatus.RESOLVED);
                    if (vote != null) {
                        // For MCQ bets: get the option text they voted for
                        if (bet.getBetType() == Bet.BetType.MULTIPLE_CHOICE && vote.getVotedOutcome() != null) {
                            String optionText = switch (vote.getVotedOutcome()) {
                                case OPTION_1 -> bet.getOption1();
                                case OPTION_2 -> bet.getOption2();
                                case OPTION_3 -> bet.getOption3();
                                case OPTION_4 -> bet.getOption4();
                                default -> null;
                            };
                            dto.setVotedOutcome(optionText);
                        }
                        // For Prediction bets: get the winner user IDs they voted for
                        if (bet.getBetType() == Bet.BetType.PREDICTION && vote.hasWinnerVotes()) {
                            dto.setVotedWinnerUserIds(vote.getWinnerUserIds());
                        }
                        // Include reasoning if present
                        dto.setReasoning(vote.getReasoning());
                    }
                }
                resolvers.add(dto);
            }
            case ASSIGNED_RESOLVERS -> {
                // Fetch assigned resolvers
                List<BetResolver> activeResolvers = betResolverRepository.findByBetAndIsActiveTrue(bet);
                for (BetResolver resolver : activeResolvers) {
                    ResolverInfoDto dto = ResolverInfoDto.fromBetResolver(resolver);
                    // Add vote status and details for CLOSED/RESOLVED bets
                    if (bet.getStatus() != Bet.BetStatus.OPEN) {
                        BetResolutionVote vote = votesByVoterId.get(resolver.getResolver().getId());
                        dto.setHasVoted(vote != null);
                        if (vote != null) {
                            // For MCQ bets: get the option text they voted for
                            if (bet.getBetType() == Bet.BetType.MULTIPLE_CHOICE && vote.getVotedOutcome() != null) {
                                String optionText = switch (vote.getVotedOutcome()) {
                                    case OPTION_1 -> bet.getOption1();
                                    case OPTION_2 -> bet.getOption2();
                                    case OPTION_3 -> bet.getOption3();
                                    case OPTION_4 -> bet.getOption4();
                                    default -> null;
                                };
                                dto.setVotedOutcome(optionText);
                            }
                            // For Prediction bets: get the winner user IDs they voted for
                            if (bet.getBetType() == Bet.BetType.PREDICTION && vote.hasWinnerVotes()) {
                                dto.setVotedWinnerUserIds(vote.getWinnerUserIds());
                            }
                            // Include reasoning if present
                            dto.setReasoning(vote.getReasoning());
                        }
                    }
                    resolvers.add(dto);
                }

            }
            case PARTICIPANT_VOTE -> {
                // For OPEN bets, resolvers list is empty (participants become resolvers when joining)
                // For CLOSED/RESOLVED, fetch all resolvers with their vote status
                if (bet.getStatus() != Bet.BetStatus.OPEN) {
                    List<BetResolver> activeResolvers = betResolverRepository.findByBetAndIsActiveTrue(bet);
                    for (BetResolver resolver : activeResolvers) {
                        ResolverInfoDto dto = ResolverInfoDto.fromBetResolver(resolver);
                        BetResolutionVote vote = votesByVoterId.get(resolver.getResolver().getId());
                        dto.setHasVoted(vote != null);
                        if (vote != null) {
                            // For MCQ bets: get the option text they voted for
                            if (bet.getBetType() == Bet.BetType.MULTIPLE_CHOICE && vote.getVotedOutcome() != null) {
                                String optionText = switch (vote.getVotedOutcome()) {
                                    case OPTION_1 -> bet.getOption1();
                                    case OPTION_2 -> bet.getOption2();
                                    case OPTION_3 -> bet.getOption3();
                                    case OPTION_4 -> bet.getOption4();
                                    default -> null;
                                };
                                dto.setVotedOutcome(optionText);
                            }
                            // For Prediction bets: get the winner user IDs they voted for
                            if (bet.getBetType() == Bet.BetType.PREDICTION && vote.hasWinnerVotes()) {
                                dto.setVotedWinnerUserIds(vote.getWinnerUserIds());
                            }
                            // Include reasoning if present
                            dto.setReasoning(vote.getReasoning());
                        }
                        resolvers.add(dto);
                    }
                }
            }
        }

        response.setResolvers(resolvers);

        // Always set voting progress for CLOSED/RESOLVED bets - frontend decides based on totalResolvers > 1
        if (bet.getStatus() != Bet.BetStatus.OPEN) {
            VotingProgressDto votingProgress = new VotingProgressDto();
            long totalResolvers = betResolverRepository.countActiveResolversByBet(bet);
            long votesSubmitted = betResolutionVoteRepository.countActiveVotesByBet(bet);
            votingProgress.setTotalResolvers((int) totalResolvers);
            votingProgress.setVotesSubmitted((int) votesSubmitted);

            // Always try to get vote distribution
            try {
                var voteCounts = betResolutionService.getVoteCounts(bet.getId());
                if (voteCounts != null && !voteCounts.isEmpty()) {
                    votingProgress.setVoteDistribution(
                        voteCounts.entrySet().stream()
                            .collect(java.util.stream.Collectors.toMap(
                                e -> e.getKey().name(),
                                java.util.Map.Entry::getValue
                            ))
                    );
                }
            } catch (Exception e) {
                logger.error("Error getting vote counts for bet {}: {}", bet.getId(), e.getMessage());
            }

            response.setVotingProgress(votingProgress);
        }
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

        // Set stake information
        response.setStakeType(bet.getStakeType());
        response.setFixedStakeAmount(bet.getFixedStakeAmount());
        response.setSocialStakeDescription(bet.getSocialStakeDescription());
        response.setFulfillmentStatus(bet.getFulfillmentStatus());

        // Check if current user has claimed fulfillment (for losers)
        boolean hasClaimedFulfillment = loserFulfillmentClaimRepository.existsByBetIdAndLoserId(
            bet.getId(), currentUser.getId());
        response.setHasCurrentUserClaimedFulfillment(hasClaimedFulfillment);

        // Set user context - check if current user has participated in this bet
        boolean hasParticipated = betParticipationService.hasUserParticipated(currentUser, bet.getId());
        response.setHasUserParticipated(hasParticipated);

        // If user has participated, get their choice, amount, and insurance
        if (hasParticipated) {
            betParticipationService.getUserParticipation(currentUser, bet.getId())
                .ifPresent(participation -> {
                    // Convert integer option (1,2,3,4) to BetOutcome enum (1-indexed)
                    Bet.BetOutcome userChoice = switch (participation.getChosenOption()) {
                        case 1 -> Bet.BetOutcome.OPTION_1;
                        case 2 -> Bet.BetOutcome.OPTION_2;
                        case 3 -> Bet.BetOutcome.OPTION_3;
                        case 4 -> Bet.BetOutcome.OPTION_4;
                        default -> null;
                    };
                    response.setUserChoice(userChoice);
                    response.setUserAmount(participation.getBetAmount());
                    response.setUserParticipationStatus(participation.getStatus());

                    // Set insurance information if user has insurance on this bet
                    if (participation.hasInsurance()) {
                        response.setHasInsurance(true);
                        response.setInsuranceRefundPercentage(participation.getInsuranceRefundPercentage());
                    } else {
                        response.setHasInsurance(false);
                    }
                });
        }

        // Fetch first 3 participants for preview avatars
        List<BetParticipation> participations = betParticipationService.getBetParticipations(bet.getId());

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

        response.setParticipantPreviews(participantPreviews);

        return response;
    }

    // ==========================================
    // FULFILLMENT TRACKING ENDPOINTS
    // ==========================================

    /**
     * Get fulfillment details for a social bet.
     */
    @GetMapping("/{betId}/fulfillment")
    public ResponseEntity<BetFulfillmentService.FulfillmentDetails> getFulfillmentDetails(
            @PathVariable Long betId,
            Authentication authentication) {
        User currentUser = userService.getUserByUsername(authentication.getName())
                .orElseThrow(() -> new RuntimeException("User not found"));

        BetFulfillmentService.FulfillmentDetails details = betFulfillmentService.getFulfillmentDetails(betId);
        return ResponseEntity.ok(details);
    }

    /**
     * Upload fulfillment proof photo.
     */
    @PostMapping("/{betId}/fulfillment/upload-proof")
    public ResponseEntity<?> uploadFulfillmentProof(
            @PathVariable Long betId,
            @RequestParam("file") MultipartFile file,
            Authentication authentication) {
        try {
            User currentUser = userService.getUserByUsername(authentication.getName())
                    .orElseThrow(() -> new RuntimeException("User not found"));

            logger.info("Uploading fulfillment proof for bet {} by user {}", betId, currentUser.getId());
            logger.debug("File details - Name: {}, Size: {}, Type: {}",
                file.getOriginalFilename(), file.getSize(), file.getContentType());

            String fileName = fileStorageService.storeFulfillmentProof(file, betId, currentUser.getId());
            String proofUrl = "/api/files/profile-pictures/" + fileName;

            logger.info("Successfully uploaded fulfillment proof for bet {} - URL: {}", betId, proofUrl);
            return ResponseEntity.ok(proofUrl);
        } catch (Exception e) {
            logger.error("Failed to upload fulfillment proof for bet {} by user {}: {}",
                betId, authentication.getName(), e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Failed to upload proof photo: " + e.getMessage());
        }
    }

    /**
     * Loser claims they have fulfilled the social stake (optional).
     */
    @PostMapping("/{betId}/fulfillment/loser-claim")
    public ResponseEntity<String> loserClaimFulfilled(
            @PathVariable Long betId,
            @RequestBody(required = false) LoserClaimRequest request,
            Authentication authentication) {
        try {
            User currentUser = userService.getUserByUsername(authentication.getName())
                    .orElseThrow(() -> new RuntimeException("User not found"));

            String proofUrl = request != null ? request.proofUrl() : null;
            String proofDescription = request != null ? request.proofDescription() : null;

            logger.info("Processing loser claim for bet {} by user {} - Has proof URL: {}, Has description: {}",
                betId, currentUser.getId(), proofUrl != null, proofDescription != null);

            betFulfillmentService.loserClaimFulfilled(betId, currentUser.getId(), proofUrl, proofDescription);

            logger.info("Successfully recorded loser claim for bet {} by user {}", betId, currentUser.getId());
            return ResponseEntity.ok("Fulfillment claimed successfully");
        } catch (Exception e) {
            logger.error("Failed to record loser claim for bet {} by user {}: {}",
                betId, authentication.getName(), e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Failed to record fulfillment claim: " + e.getMessage());
        }
    }

    /**
     * Winner confirms they received the social stake.
     */
    @PostMapping("/{betId}/fulfillment/winner-confirm")
    public ResponseEntity<String> winnerConfirmFulfilled(
            @PathVariable Long betId,
            @RequestBody(required = false) WinnerConfirmRequest request,
            Authentication authentication) {
        User currentUser = userService.getUserByUsername(authentication.getName())
                .orElseThrow(() -> new RuntimeException("User not found"));

        String notes = request != null ? request.notes() : null;
        betFulfillmentService.winnerConfirmFulfilled(betId, currentUser.getId(), notes);

        return ResponseEntity.ok("Fulfillment confirmed successfully");
    }

    // Request DTOs for fulfillment endpoints
    public record LoserClaimRequest(String proofUrl, String proofDescription) {}
    public record WinnerConfirmRequest(String notes) {}

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
                return Bet.BetOutcome.OPTION_1;
        }
    }
}