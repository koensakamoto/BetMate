package com.betmate.repository.betting;

import com.betmate.entity.betting.BetPrediction;
import com.betmate.entity.betting.BetParticipation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

/**
 * Repository interface for managing BetPrediction entities.
 */
@Repository
public interface BetPredictionRepository extends JpaRepository<BetPrediction, Long> {

    /**
     * Finds a prediction by participation.
     *
     * @param participation the bet participation
     * @return optional prediction
     */
    Optional<BetPrediction> findByParticipation(BetParticipation participation);

    /**
     * Checks if a prediction exists for a participation.
     *
     * @param participation the bet participation
     * @return true if prediction exists
     */
    boolean existsByParticipation(BetParticipation participation);
}