package com.rivalpicks.mapper;

import com.rivalpicks.dto.store.response.EquippedItemResponseDto;
import com.rivalpicks.dto.store.response.InventoryItemResponseDto;
import com.rivalpicks.dto.store.response.PopularItemResponseDto;
import com.rivalpicks.dto.store.response.UserLoadoutResponseDto;
import com.rivalpicks.entity.store.StoreItem;
import com.rivalpicks.entity.user.UserInventory;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.stream.Collectors;

/**
 * Mapper class for converting entities to DTOs.
 * Handles mapping between UserInventory entities and response DTOs.
 */
@Component
public class InventoryMapper {

    /**
     * Converts UserInventory entity to InventoryItemResponseDto DTO.
     */
    public InventoryItemResponseDto toInventoryItemResponse(UserInventory inventory) {
        if (inventory == null) {
            return null;
        }

        InventoryItemResponseDto response = new InventoryItemResponseDto();
        response.setId(inventory.getId());
        response.setItemName(inventory.getItemName());
        response.setItemType(inventory.getItemType() != null ? inventory.getItemType().name() : null);
        response.setRarity(inventory.getItemRarity() != null ? inventory.getItemRarity().name() : null);
        response.setIconUrl(inventory.getStoreItem() != null ? inventory.getStoreItem().getIconUrl() : null);
        response.setShortDescription(inventory.getStoreItem() != null ? inventory.getStoreItem().getShortDescription() : null);
        response.setDescription(inventory.getStoreItem() != null ? inventory.getStoreItem().getDescription() : null);
        response.setPurchasePrice(inventory.getPurchasePrice());
        response.setPurchasedAt(inventory.getPurchasedAt());
        response.setIsEquipped(inventory.getIsEquipped());
        response.setEquippedAt(inventory.getEquippedAt());
        response.setLastUsedAt(inventory.getLastUsedAt());
        response.setIsActive(inventory.getIsActive());

        // Booster/consumable fields
        response.setActivatedAt(inventory.getActivatedAt());

        // For time-based boosters (null usesRemaining), calculate days from expiresAt
        if (inventory.getUsesRemaining() == null && inventory.getExpiresAt() != null) {
            // Calculate days remaining from expiration date
            java.time.LocalDateTime now = java.time.LocalDateTime.now();
            java.time.LocalDateTime expiresAt = inventory.getExpiresAt();

            if (expiresAt.isAfter(now)) {
                long hoursRemaining = java.time.Duration.between(now, expiresAt).toHours();
                int daysRemaining = (int) Math.ceil(hoursRemaining / 24.0);
                response.setUsesRemaining(daysRemaining);
            } else {
                response.setUsesRemaining(0);
            }
        } else {
            response.setUsesRemaining(inventory.getUsesRemaining());
        }

        response.setExpiresAt(inventory.getExpiresAt());

        return response;
    }

    /**
     * Converts list of UserInventory entities to InventoryItemResponseDto DTOs.
     */
    public List<InventoryItemResponseDto> toInventoryItemResponseList(List<UserInventory> inventories) {
        if (inventories == null) {
            return null;
        }
        
        return inventories.stream()
                .map(this::toInventoryItemResponse)
                .collect(Collectors.toList());
    }

    /**
     * Converts UserInventory entity to EquippedItemResponseDto DTO.
     */
    public EquippedItemResponseDto toEquippedItemResponse(UserInventory inventory) {
        if (inventory == null) {
            return null;
        }

        return new EquippedItemResponseDto(
            inventory.getId(),
            inventory.getItemName(),
            inventory.getStoreItem() != null ? inventory.getStoreItem().getIconUrl() : null,
            inventory.getEquippedAt(),
            inventory.getItemRarity() != null ? inventory.getItemRarity().name() : null
        );
    }

    /**
     * Converts Object[] from repository query to PopularItemResponseDto DTO.
     * Expected Object[] format: [StoreItem, Long count]
     */
    public PopularItemResponseDto toPopularItemResponse(Object[] popularItemData) {
        if (popularItemData == null || popularItemData.length < 2) {
            return null;
        }

        StoreItem storeItem = (StoreItem) popularItemData[0];
        Long count = (Long) popularItemData[1];

        return new PopularItemResponseDto(
            storeItem.getId(),
            storeItem.getName(),
            storeItem.getItemType().name(),
            storeItem.getRarity().name(),
            storeItem.getIconUrl(),
            count
        );
    }

    /**
     * Converts list of Object[] to PopularItemResponseDto DTOs.
     */
    public List<PopularItemResponseDto> toPopularItemResponseList(List<Object[]> popularItemsData) {
        if (popularItemsData == null) {
            return null;
        }

        return popularItemsData.stream()
                .map(this::toPopularItemResponse)
                .collect(Collectors.toList());
    }

    /**
     * Creates UserLoadoutResponseDto from equipped items list.
     */
    public UserLoadoutResponseDto toUserLoadoutResponse(List<UserInventory> equippedItems) {
        if (equippedItems == null) {
            return new UserLoadoutResponseDto();
        }

        UserLoadoutResponseDto loadout = new UserLoadoutResponseDto();

        for (UserInventory item : equippedItems) {
            if (item.getStoreItem() == null || !item.getIsEquipped()) {
                continue;
            }

            StoreItem.ItemType type = item.getStoreItem().getItemType();
            EquippedItemResponseDto equippedResponse = toEquippedItemResponse(item);

            switch (type) {
                case TITLE -> loadout.setEquippedTitle(equippedResponse);
                case AVATAR_SKIN -> loadout.setEquippedAvatar(equippedResponse);
                case BADGE -> loadout.setEquippedBadge(equippedResponse);
                case PROFILE_THEME -> loadout.setEquippedTheme(equippedResponse);
                case PROFILE_FRAME -> loadout.setEquippedFrame(equippedResponse);
                case ROAST_CARD_PACK, TAUNT_COLLECTION, EMOJI_PACK, CHAT_EFFECT -> {
                    // These items are not part of the loadout
                }
            }
        }

        return loadout;
    }
}