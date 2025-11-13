package com.betmate.controller;

import com.betmate.dto.betting.request.ApplyInsuranceRequestDto;
import com.betmate.dto.betting.response.AvailableInsuranceResponseDto;
import com.betmate.dto.betting.response.InsuranceStatusResponseDto;
import com.betmate.entity.betting.BetParticipation;
import com.betmate.entity.store.StoreItem;
import com.betmate.entity.user.User;
import com.betmate.entity.user.UserInventory;
import com.betmate.service.bet.BetParticipationService;
import com.betmate.service.bet.InsuranceService;
import com.betmate.service.user.UserService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.List;
import java.util.stream.Collectors;

/**
 * REST controller for insurance management operations.
 * Handles applying insurance to bets and viewing insurance status.
 */
@RestController
@RequestMapping("/api")
public class InsuranceController {

    private static final Logger logger = LoggerFactory.getLogger(InsuranceController.class);

    private final InsuranceService insuranceService;
    private final BetParticipationService betParticipationService;
    private final UserService userService;

    @Autowired
    public InsuranceController(InsuranceService insuranceService,
                              BetParticipationService betParticipationService,
                              UserService userService) {
        this.insuranceService = insuranceService;
        this.betParticipationService = betParticipationService;
        this.userService = userService;
    }

    /**
     * Apply insurance to a bet participation.
     * POST /api/bets/{betId}/insurance
     */
    @PostMapping("/bets/{betId}/insurance")
    public ResponseEntity<?> applyInsurance(
            @PathVariable Long betId,
            @Valid @RequestBody ApplyInsuranceRequestDto request,
            Authentication authentication) {

        try {
            logger.info("Applying insurance to bet {} with insurance item {}", betId, request.getInsuranceItemId());

            User currentUser = userService.getUserByUsername(authentication.getName())
                .orElseThrow(() -> new RuntimeException("User not found"));

            // Get the user's participation in this bet
            BetParticipation participation = betParticipationService
                .getUserParticipation(currentUser, betId)
                .orElseThrow(() -> new RuntimeException("Bet participation not found"));

            // Get the insurance item from user's inventory
            UserInventory insurance = insuranceService.getActiveInsuranceById(currentUser, request.getInsuranceItemId())
                .orElseThrow(() -> new RuntimeException("Insurance item not found or not active"));

            // Apply insurance to the bet
            insuranceService.applyInsuranceToBet(currentUser, participation, request.getInsuranceItemId());

            // Return updated insurance status
            InsuranceStatusResponseDto status = InsuranceStatusResponseDto.fromParticipation(participation);

            logger.info("Successfully applied insurance to bet {} for user {}", betId, currentUser.getUsername());
            return ResponseEntity.ok(status);

        } catch (RuntimeException e) {
            logger.error("Error applying insurance to bet {}: {}", betId, e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(new ErrorResponse(e.getMessage()));
        } catch (Exception e) {
            logger.error("Unexpected error applying insurance to bet {}", betId, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(new ErrorResponse("Failed to apply insurance"));
        }
    }

    /**
     * Get insurance status for a bet participation.
     * GET /api/bets/{betId}/insurance/status
     */
    @GetMapping("/bets/{betId}/insurance/status")
    public ResponseEntity<?> getInsuranceStatus(
            @PathVariable Long betId,
            Authentication authentication) {

        try {
            User currentUser = userService.getUserByUsername(authentication.getName())
                .orElseThrow(() -> new RuntimeException("User not found"));

            // Get the user's participation in this bet
            BetParticipation participation = betParticipationService
                .getUserParticipation(currentUser, betId)
                .orElseThrow(() -> new RuntimeException("Bet participation not found"));

            // Convert to DTO
            InsuranceStatusResponseDto status = InsuranceStatusResponseDto.fromParticipation(participation);

            return ResponseEntity.ok(status);

        } catch (RuntimeException e) {
            logger.error("Error getting insurance status for bet {}: {}", betId, e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(new ErrorResponse(e.getMessage()));
        } catch (Exception e) {
            logger.error("Unexpected error getting insurance status for bet {}", betId, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(new ErrorResponse("Failed to get insurance status"));
        }
    }

    /**
     * Get all available insurance items in user's inventory.
     * GET /api/insurance/available
     */
    @GetMapping("/insurance/available")
    public ResponseEntity<?> getAvailableInsurance(Authentication authentication) {

        try {
            User currentUser = userService.getUserByUsername(authentication.getName())
                .orElseThrow(() -> new RuntimeException("User not found"));

            // Get all active insurance items from user's inventory
            List<UserInventory> insuranceItems = insuranceService.getAllActiveInsuranceItems(currentUser);

            // Convert to DTOs
            List<AvailableInsuranceResponseDto> response = insuranceItems.stream()
                .map(inventory -> {
                    StoreItem.ItemType itemType = inventory.getStoreItem().getItemType();
                    Integer refundPercentage = insuranceService.getRefundPercentage(itemType);
                    String tier = insuranceService.getInsuranceTierName(itemType);
                    return AvailableInsuranceResponseDto.fromInventory(inventory, refundPercentage, tier);
                })
                .collect(Collectors.toList());

            logger.info("Found {} available insurance items for user {}",
                response.size(), currentUser.getUsername());

            return ResponseEntity.ok(response);

        } catch (RuntimeException e) {
            logger.error("Error getting available insurance: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(new ErrorResponse(e.getMessage()));
        } catch (Exception e) {
            logger.error("Unexpected error getting available insurance", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(new ErrorResponse("Failed to get available insurance"));
        }
    }

    /**
     * Simple error response record.
     */
    private record ErrorResponse(String message) {}
}
