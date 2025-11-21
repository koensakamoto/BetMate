package com.rivalpicks.service.user;

import com.rivalpicks.entity.user.UserInventory;
import com.rivalpicks.repository.user.UserInventoryRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Service for handling scheduled inventory operations such as:
 * - Deactivating expired boosters
 * - Cleaning up expired time-based consumables
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class InventoryScheduledTaskService {

    private final UserInventoryRepository userInventoryRepository;

    /**
     * Scheduled task to deactivate expired boosters.
     * Runs daily at 1:00 AM to clean up expired time-based items.
     * Sets isActive=false for any boosters where expiresAt < now.
     */
    @Scheduled(cron = "${inventory.scheduling.cleanup-cron:0 0 1 * * ?}") // Default: 1:00 AM daily
    @Transactional
    public void deactivateExpiredBoosters() {
        LocalDateTime now = LocalDateTime.now();
        List<UserInventory> expiredBoosters = userInventoryRepository.findExpiredBoosters(now);

        if (expiredBoosters.isEmpty()) {
            log.debug("No expired boosters found at {}", now);
            return;
        }

        log.info("Found {} expired boosters to deactivate", expiredBoosters.size());

        int deactivatedCount = 0;
        for (UserInventory booster : expiredBoosters) {
            try {
                // Deactivate the booster
                booster.deactivate();
                userInventoryRepository.save(booster);

                log.debug("Deactivated expired booster {} for user {} (expired at: {})",
                        booster.getId(),
                        booster.getUser().getUsername(),
                        booster.getExpiresAt());

                deactivatedCount++;
            } catch (Exception e) {
                log.error("Failed to deactivate expired booster {}: {}", booster.getId(), e.getMessage(), e);
            }
        }

        log.info("Successfully deactivated {} out of {} expired boosters", deactivatedCount, expiredBoosters.size());
    }
}
