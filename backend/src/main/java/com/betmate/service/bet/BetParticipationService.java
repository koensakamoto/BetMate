package com.betmate.service.bet;

import com.betmate.entity.betting.Bet;
import com.betmate.entity.betting.BetParticipation;
import com.betmate.entity.betting.BetParticipation.ParticipationStatus;
import com.betmate.entity.betting.BetPrediction;
import com.betmate.entity.user.User;
import com.betmate.exception.betting.BetParticipationException;
import com.betmate.repository.betting.BetParticipationRepository;
import com.betmate.repository.betting.BetPredictionRepository;
import com.betmate.service.user.UserCreditService;
import com.betmate.service.user.UserStatisticsService;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Isolation;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.validation.annotation.Validated;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

/**
 * Service dedicated to bet participation operations.
 * Handles placing bets, managing participations, and bet resolution.
 */
@Service
@Validated
@Transactional(isolation = Isolation.SERIALIZABLE)
public class BetParticipationService {

    private final BetParticipationRepository participationRepository;
    private final BetPredictionRepository predictionRepository;
    private final BetService betService;
    private final UserCreditService creditService;
    private final UserStatisticsService statisticsService;

    @Autowired
    public BetParticipationService(BetParticipationRepository participationRepository,
                                 BetPredictionRepository predictionRepository,
                                 BetService betService,
                                 UserCreditService creditService,
                                 UserStatisticsService statisticsService) {
        this.participationRepository = participationRepository;
        this.predictionRepository = predictionRepository;
        this.betService = betService;
        this.creditService = creditService;
        this.statisticsService = statisticsService;
    }

    /**
     * Places a bet for a user with exact value prediction.
     */
    public BetParticipation placeBetWithPrediction(@NotNull User user, @NotNull Long betId,
                                                 @NotNull @DecimalMin("0.01") BigDecimal betAmount,
                                                 @NotNull String predictionValue) {
        Bet bet = betService.getBetById(betId);

        // Validate this is a prediction bet
        if (bet.getBetType() != Bet.BetType.PREDICTION) {
            throw new BetParticipationException("Predictions can only be placed on prediction bets");
        }

        // Validate bet can accept participations
        validateBetForParticipation(bet, user, betAmount);

        // Check if user already has an ACTIVE participation (creators can upgrade to ACTIVE)
        Optional<BetParticipation> existingParticipation = participationRepository.findByUserAndBet(user, bet);
        if (existingParticipation.isPresent() && existingParticipation.get().getStatus() == ParticipationStatus.ACTIVE) {
            throw new BetParticipationException("User has already placed a bet on this");
        }

        // Deduct credits from user
        creditService.deductCredits(user.getId(), betAmount, "Bet placed on: " + bet.getTitle());

        // Create or update participation (for prediction bets, chosenOption is always 1)
        BetParticipation participation;
        if (existingParticipation.isPresent() && existingParticipation.get().getStatus() == ParticipationStatus.CREATOR) {
            // Upgrade existing creator participation to active
            participation = existingParticipation.get();
            participation.setChosenOption(1);
            participation.setBetAmount(betAmount);
            participation.setStatus(ParticipationStatus.ACTIVE);

            // Calculate potential winnings based on current odds
            double odds = getOddsForOption(bet, 1);
            participation.calculatePotentialWinnings(odds);
        } else {
            // Create new participation
            participation = createParticipation(user, bet, 1, betAmount);
        }
        BetParticipation savedParticipation = participationRepository.save(participation);

        // Create prediction
        BetPrediction prediction = new BetPrediction();
        prediction.setParticipation(savedParticipation);
        prediction.setPredictedValue(predictionValue);
        predictionRepository.save(prediction);

        // Update bet statistics (prediction bets use option 1)
        updateBetStatistics(bet, 1, betAmount);

        // Update user statistics
        statisticsService.incrementActiveBets(user.getId());

        return savedParticipation;
    }

    /**
     * Places a bet for a user.
     */
    public BetParticipation placeBet(@NotNull User user, @NotNull Long betId,
                                   @Min(1) @Max(4) Integer chosenOption,
                                   @NotNull @DecimalMin("0.01") BigDecimal betAmount) {
        Bet bet = betService.getBetById(betId);

        // Validate bet can accept participations
        validateBetForParticipation(bet, user, betAmount);

        // Check if user already has an ACTIVE participation (creators can upgrade to ACTIVE)
        Optional<BetParticipation> existingParticipation = participationRepository.findByUserAndBet(user, bet);
        if (existingParticipation.isPresent() && existingParticipation.get().getStatus() == ParticipationStatus.ACTIVE) {
            throw new BetParticipationException("User has already placed a bet on this");
        }
        
        // Validate chosen option
        validateChosenOption(bet, chosenOption);
        
        // Deduct credits from user
        creditService.deductCredits(user.getId(), betAmount, "Bet placed on: " + bet.getTitle());

        // Create or update participation
        BetParticipation participation;
        if (existingParticipation.isPresent() && existingParticipation.get().getStatus() == ParticipationStatus.CREATOR) {
            // Upgrade existing creator participation to active
            participation = existingParticipation.get();
            participation.setChosenOption(chosenOption);
            participation.setBetAmount(betAmount);
            participation.setStatus(ParticipationStatus.ACTIVE);

            // Calculate potential winnings based on current odds
            double odds = getOddsForOption(bet, chosenOption);
            participation.calculatePotentialWinnings(odds);
        } else {
            // Create new participation
            participation = createParticipation(user, bet, chosenOption, betAmount);
        }
        BetParticipation savedParticipation = participationRepository.save(participation);
        
        // Update bet statistics
        updateBetStatistics(bet, chosenOption, betAmount);
        
        // Update user statistics
        statisticsService.incrementActiveBets(user.getId());
        
        return savedParticipation;
    }

    /**
     * Cancels a user's participation (if bet allows).
     */
    public void cancelParticipation(@NotNull User user, @NotNull Long betId) {
        Bet bet = betService.getBetById(betId);
        
        BetParticipation participation = participationRepository.findByUserAndBet(user, bet)
            .orElseThrow(() -> new BetParticipationException("No participation found for this bet"));
        
        if (!bet.isOpenForBetting()) {
            throw new BetParticipationException("Cannot cancel participation after betting deadline");
        }
        
        // Refund credits
        creditService.addCredits(user.getId(), participation.getBetAmount(), 
            "Bet cancellation refund: " + bet.getTitle());
        
        // Mark participation as cancelled
        participation.setStatus(BetParticipation.ParticipationStatus.CANCELLED);
        participationRepository.save(participation);
        
        // Update bet statistics
        updateBetStatisticsRemoval(bet, participation.getChosenOption(), participation.getBetAmount());
        
        // Update user statistics
        statisticsService.decrementActiveBets(user.getId());
    }

    /**
     * Resolves all participations for a bet.
     */
    public void resolveBetParticipations(@NotNull Long betId, @NotNull Bet.BetOutcome outcome) {
        Bet bet = betService.getBetById(betId);
        
        if (bet.getStatus() != Bet.BetStatus.CLOSED) {
            throw new BetParticipationException("Bet must be closed before resolving participations");
        }
        
        List<BetParticipation> participations = participationRepository.findByBet(bet);
        
        for (BetParticipation participation : participations) {
            if (participation.getStatus() == BetParticipation.ParticipationStatus.ACTIVE) {
                resolveParticipation(participation, bet, outcome);
            }
        }
        
        // Mark bet as resolved
        bet.resolve(outcome);
        betService.saveBet(bet);
    }

    /**
     * Gets all participations for a bet.
     */
    @Transactional(readOnly = true)
    public List<BetParticipation> getBetParticipations(@NotNull Long betId) {
        Bet bet = betService.getBetById(betId);
        return participationRepository.findByBet(bet);
    }

    /**
     * Gets user's participation in a bet.
     */
    @Transactional(readOnly = true)
    public Optional<BetParticipation> getUserParticipation(@NotNull User user, @NotNull Long betId) {
        Bet bet = betService.getBetById(betId);
        return participationRepository.findByUserAndBet(user, bet);
    }

    /**
     * Gets all participations for a user.
     */
    @Transactional(readOnly = true)
    public List<BetParticipation> getUserParticipations(@NotNull User user) {
        return participationRepository.findByUser(user);
    }

    /**
     * Creates a creator participation record when a bet is created.
     * This ensures the bet creator appears in "My Bets" without placing an actual bet.
     */
    public BetParticipation createCreatorParticipation(@NotNull User creator, @NotNull Bet bet) {
        BetParticipation participation = new BetParticipation();
        participation.setUser(creator);
        participation.setBet(bet);
        participation.setChosenOption(1);
        participation.setBetAmount(BigDecimal.ZERO);
        participation.setStatus(BetParticipation.ParticipationStatus.CREATOR);
        participation.setPotentialWinnings(BigDecimal.ZERO);

        return participationRepository.save(participation);
    }

    /**
     * Checks if user has an ACTIVE participation in a bet.
     */
    @Transactional(readOnly = true)
    public boolean hasUserParticipated(@NotNull User user, @NotNull Long betId) {
        Bet bet = betService.getBetById(betId);
        // Only check for ACTIVE participations - cancelled/resolved participations don't count as "joined"
        Optional<BetParticipation> participation = participationRepository.findByUserAndBet(user, bet);
        return participation.isPresent() && participation.get().getStatus() == ParticipationStatus.ACTIVE;
    }

    private void validateBetForParticipation(Bet bet, User user, BigDecimal betAmount) {
        if (!bet.isOpenForBetting()) {
            throw new BetParticipationException("Bet is not open for betting");
        }
        
        if (betAmount.compareTo(bet.getMinimumBet()) < 0) {
            throw new BetParticipationException("Bet amount is below minimum: " + bet.getMinimumBet());
        }
        
        if (bet.getMaximumBet() != null && betAmount.compareTo(bet.getMaximumBet()) > 0) {
            throw new BetParticipationException("Bet amount exceeds maximum: " + bet.getMaximumBet());
        }
        
        if (!creditService.hasSufficientAvailableCredits(user.getId(), betAmount)) {
            throw new BetParticipationException("Insufficient available credits for bet");
        }
    }

    private void validateChosenOption(Bet bet, Integer chosenOption) {
        if (chosenOption < 1 || chosenOption > 4) {
            throw new BetParticipationException("Invalid option: must be between 1 and 4");
        }
        
        int availableOptions = bet.getOptionCount();
        if (chosenOption > availableOptions) {
            throw new BetParticipationException("Invalid option: only " + availableOptions + " options available");
        }
    }

    private BetParticipation createParticipation(User user, Bet bet, Integer chosenOption, BigDecimal betAmount) {
        BetParticipation participation = new BetParticipation();
        participation.setUser(user);
        participation.setBet(bet);
        participation.setChosenOption(chosenOption);
        participation.setBetAmount(betAmount);
        participation.setStatus(BetParticipation.ParticipationStatus.ACTIVE);
        
        // Calculate potential winnings based on current odds
        double odds = getOddsForOption(bet, chosenOption);
        participation.calculatePotentialWinnings(odds);
        
        return participation;
    }

    private void updateBetStatistics(Bet bet, Integer chosenOption, BigDecimal betAmount) {
        bet.addBetToOption(chosenOption, betAmount);
        betService.saveBet(bet);
    }

    private void updateBetStatisticsRemoval(Bet bet, Integer chosenOption, BigDecimal betAmount) {
        // Subtract from totals
        bet.setTotalPool(bet.getTotalPool().subtract(betAmount));
        bet.setTotalParticipants(bet.getTotalParticipants() - 1);
        
        // Subtract from option-specific totals
        if (chosenOption == 1) {
            bet.setPoolForOption1(bet.getPoolForOption1().subtract(betAmount));
            bet.setParticipantsForOption1(bet.getParticipantsForOption1() - 1);
        } else if (chosenOption == 2) {
            bet.setPoolForOption2(bet.getPoolForOption2().subtract(betAmount));
            bet.setParticipantsForOption2(bet.getParticipantsForOption2() - 1);
        }
        
        betService.saveBet(bet);
    }

    private void resolveParticipation(BetParticipation participation, Bet bet, Bet.BetOutcome outcome) {
        User user = participation.getUser();
        
        if (participation.isWinner()) {
            // Calculate winnings based on final pool distribution
            BigDecimal winnings = calculateWinnings(participation, bet);
            participation.settle(winnings);
            
            // Credit winnings to user
            creditService.addCredits(user.getId(), winnings, 
                "Bet winnings: " + bet.getTitle());
            
            // Update user statistics
            statisticsService.recordWin(user.getId());
        } else {
            // User lost - no payout
            participation.settle(BigDecimal.ZERO);
            statisticsService.recordLoss(user.getId());
        }
        
        // Decrement active bets count
        statisticsService.decrementActiveBets(user.getId());
        
        participationRepository.save(participation);
    }

    private BigDecimal calculateWinnings(BetParticipation participation, Bet bet) {
        // Simple proportional payout based on bet amount and total pool
        double winningPercentage = participation.getBetAmount()
            .divide(getPoolForWinningOption(bet, participation.getChosenOption()), 4, java.math.RoundingMode.HALF_UP)
            .doubleValue();
        
        return bet.getTotalPool().multiply(BigDecimal.valueOf(winningPercentage));
    }

    private BigDecimal getPoolForWinningOption(Bet bet, Integer option) {
        return switch (option) {
            case 1 -> bet.getPoolForOption1();
            case 2 -> bet.getPoolForOption2();
            default -> BigDecimal.ONE; // Avoid division by zero
        };
    }

    private double getOddsForOption(Bet bet, Integer option) {
        return switch (option) {
            case 1 -> bet.getOddsForOption1();
            case 2 -> bet.getOddsForOption2();
            default -> 1.0;
        };
    }

}