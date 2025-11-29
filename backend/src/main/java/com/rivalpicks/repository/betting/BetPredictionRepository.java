package com.rivalpicks.repository.betting;

import com.rivalpicks.entity.betting.BetPrediction;
import com.rivalpicks.entity.betting.BetParticipation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
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
     * Finds all predictions for a list of participations.
     *
     * @param participations the list of bet participations
     * @return list of predictions
     */
    List<BetPrediction> findByParticipationIn(List<BetParticipation> participations);

    /**
     * Checks if a prediction exists for a participation.
     *
     * @param participation the bet participation
     * @return true if prediction exists
     */
    boolean existsByParticipation(BetParticipation participation);
}