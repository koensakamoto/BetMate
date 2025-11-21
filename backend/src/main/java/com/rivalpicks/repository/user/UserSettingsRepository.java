package com.rivalpicks.repository.user;

import com.rivalpicks.entity.user.UserSettings;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

/**
 * Repository interface for UserSettings entity.
 * Provides database operations for user settings and preferences.
 */
@Repository
public interface UserSettingsRepository extends JpaRepository<UserSettings, Long> {

    /**
     * Find settings by user ID.
     *
     * @param userId the user ID
     * @return Optional containing the user settings if found
     */
    Optional<UserSettings> findByUserId(Long userId);

    /**
     * Check if settings exist for a user.
     *
     * @param userId the user ID
     * @return true if settings exist for the user
     */
    boolean existsByUserId(Long userId);
}
