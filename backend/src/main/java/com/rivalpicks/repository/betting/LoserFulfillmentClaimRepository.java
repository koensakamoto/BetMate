package com.rivalpicks.repository.betting;

import com.rivalpicks.entity.betting.LoserFulfillmentClaim;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface LoserFulfillmentClaimRepository extends JpaRepository<LoserFulfillmentClaim, Long> {

    List<LoserFulfillmentClaim> findByBetId(Long betId);

    Optional<LoserFulfillmentClaim> findByBetIdAndLoserId(Long betId, Long loserId);

    boolean existsByBetIdAndLoserId(Long betId, Long loserId);

    long countByBetId(Long betId);
}
