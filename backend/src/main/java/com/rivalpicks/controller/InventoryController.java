package com.rivalpicks.controller;

import com.rivalpicks.dto.betting.response.InventoryItemWithEligibleBetsResponseDto;
import com.rivalpicks.entity.user.User;
import com.rivalpicks.service.user.UserInventoryService;
import com.rivalpicks.service.user.UserService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

/**
 * REST controller for user inventory operations.
 * Handles viewing inventory items and their applicable bets.
 */
@RestController
@RequestMapping("/api")
public class InventoryController {

    private static final Logger logger = LoggerFactory.getLogger(InventoryController.class);

    private final UserInventoryService userInventoryService;
    private final UserService userService;

    @Autowired
    public InventoryController(UserInventoryService userInventoryService,
                              UserService userService) {
        this.userInventoryService = userInventoryService;
        this.userService = userService;
    }

    /**
     * Get all bets eligible for a specific inventory item.
     * Used when user wants to apply an inventory item (insurance, mulligan token, etc.) to a bet.
     *
     * GET /api/inventory/{inventoryItemId}/eligible-bets
     *
     * Response includes:
     * - Item details (name, type, description, uses remaining)
     * - List of all user's participations with eligibility status
     * - Reason if a bet is not eligible
     *
     * @param inventoryItemId The inventory item ID
     * @param authentication The authenticated user
     * @return Item info and list of eligible bets
     */
    @GetMapping("/inventory/{inventoryItemId}/eligible-bets")
    public ResponseEntity<?> getEligibleBets(
            @PathVariable Long inventoryItemId,
            Authentication authentication) {

        try {
            logger.info("Getting eligible bets for inventory item {}", inventoryItemId);

            User currentUser = userService.getUserByUsername(authentication.getName())
                .orElseThrow(() -> new RuntimeException("User not found"));

            // Get eligible bets for this inventory item
            InventoryItemWithEligibleBetsResponseDto response =
                userInventoryService.getEligibleBetsForInventoryItem(currentUser, inventoryItemId);

            logger.info("Successfully retrieved eligible bets for inventory item {} for user {}",
                inventoryItemId, currentUser.getUsername());

            return ResponseEntity.ok(response);

        } catch (IllegalArgumentException e) {
            logger.error("Error getting eligible bets for inventory item {}: {}", inventoryItemId, e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(new ErrorResponse(e.getMessage()));
        } catch (RuntimeException e) {
            logger.error("Error getting eligible bets for inventory item {}: {}", inventoryItemId, e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(new ErrorResponse(e.getMessage()));
        } catch (Exception e) {
            logger.error("Unexpected error getting eligible bets for inventory item {}", inventoryItemId, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(new ErrorResponse("Failed to get eligible bets"));
        }
    }

    /**
     * Simple error response record.
     */
    private record ErrorResponse(String message) {}
}
