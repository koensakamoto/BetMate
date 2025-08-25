package com.circlebet.controller;

import com.circlebet.dto.betting.request.BetCreationRequestDto;
import com.circlebet.dto.betting.request.PlaceBetRequestDto;
import com.circlebet.dto.betting.request.ResolveBetRequestDto;
import com.circlebet.dto.betting.response.BetResponseDto;
import com.circlebet.dto.betting.response.BetSummaryResponseDto;
import com.circlebet.dto.common.PagedResponseDto;
import com.circlebet.entity.betting.Bet;
import com.circlebet.entity.group.Group;
import com.circlebet.entity.user.User;
import com.circlebet.service.bet.BetService;
import com.circlebet.service.group.GroupService;
import com.circlebet.service.user.UserService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * REST controller for bet management operations.
 * Handles bet creation, participation, and resolution.
 */
@RestController
@RequestMapping("/api/bets")
public class BetController {

    private final BetService betService;
    private final GroupService groupService;
    private final UserService userService;

    @Autowired
    public BetController(BetService betService,
                        GroupService groupService,
                        UserService userService) {
        this.betService = betService;
        this.groupService = groupService;
        this.userService = userService;
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
        
        List<Bet> bets = betService.getBetsByGroup(group);
        List<BetSummaryResponseDto> response = bets.stream()
            .map(bet -> convertToSummaryResponse(bet, currentUser))
            .toList();
        
        return ResponseEntity.ok(response);
    }

    /**
     * Get bets created by current user.
     */
    @GetMapping("/my")
    public ResponseEntity<List<BetSummaryResponseDto>> getMyBets(
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
        
        // Set user context - we'll enhance this later when we have participation service methods
        response.setHasUserParticipated(false); // TODO: implement when participation service is complete
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
        
        // Set user context
        response.setHasUserParticipated(false); // TODO: implement when participation service is complete
        
        return response;
    }
}