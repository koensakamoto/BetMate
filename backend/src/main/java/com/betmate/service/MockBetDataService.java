package com.betmate.service;

import com.betmate.entity.betting.Bet;
import com.betmate.entity.betting.BetParticipation;
import com.betmate.entity.group.Group;
import com.betmate.entity.group.GroupMembership;
import com.betmate.entity.user.User;
import com.betmate.repository.betting.BetRepository;
import com.betmate.repository.betting.BetParticipationRepository;
import com.betmate.repository.group.GroupMembershipRepository;
import com.betmate.repository.group.GroupRepository;
import com.betmate.repository.user.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collections;
import java.util.List;
import java.util.Random;

@Service
public class MockBetDataService {

    private static final Logger logger = LoggerFactory.getLogger(MockBetDataService.class);
    
    @Autowired
    private UserRepository userRepository;
    
    @Autowired
    private GroupRepository groupRepository;
    
    @Autowired
    private GroupMembershipRepository groupMembershipRepository;
    
    @Autowired
    private BetRepository betRepository;
    
    @Autowired
    private BetParticipationRepository betParticipationRepository;

    @Transactional
    public String createMockBets() {
        logger.info("Starting mock bets creation...");
        
        List<Group> allGroups = groupRepository.findAll();
        if (allGroups.isEmpty()) {
            return "Error: No groups found. Please create some groups first.";
        }
        
        List<User> allUsers = userRepository.findAll();
        if (allUsers.size() < 2) {
            return "Error: Need at least 2 users. Please create some users first.";
        }
        
        // Clear existing bets for a clean slate
        long existingBets = betRepository.count();
        if (existingBets > 0) {
            logger.info("Found {} existing bets. Creating additional mock bets...", existingBets);
        }
        
        Random random = new Random();
        
        // Create diverse bet scenarios
        List<MockBetData> mockBets = Arrays.asList(
            new MockBetData("Will the Lakers win their next game?", "Basketball season prediction", 
                Bet.BetType.PREDICTION, "Lakers Win", "Lakers Lose", null, null, 24),
            new MockBetData("Which team will win the World Cup?", "Soccer championship prediction", 
                Bet.BetType.MULTIPLE_CHOICE, "Brazil", "Argentina", "France", "Germany", 72),
            new MockBetData("Will Bitcoin reach $100k this year?", "Cryptocurrency price prediction", 
                Bet.BetType.PREDICTION, "Yes, $100k+", "No, under $100k", null, null, 168),
            new MockBetData("Next major game release winner?", "Gaming industry prediction", 
                Bet.BetType.MULTIPLE_CHOICE, "GTA VI", "Elder Scrolls VI", "Witcher 4", "Cyberpunk sequel", 336),
            new MockBetData("Will it rain tomorrow?", "Weather prediction for fun", 
                Bet.BetType.PREDICTION, "Rain", "No Rain", null, null, 18),
            new MockBetData("Who will win the next presidential election?", "Political prediction", 
                Bet.BetType.MULTIPLE_CHOICE, "Incumbent", "Challenger A", "Challenger B", "Third Party", 8760),
            new MockBetData("Will the stock market go up this week?", "Financial market prediction", 
                Bet.BetType.PREDICTION, "Market Up", "Market Down", null, null, 120),
            new MockBetData("Which movie will win Best Picture?", "Academy Awards prediction", 
                Bet.BetType.MULTIPLE_CHOICE, "Drama A", "Drama B", "Comedy", "Action Film", 2160),
            new MockBetData("Will our group reach 100 members?", "Group growth milestone", 
                Bet.BetType.PREDICTION, "Yes, 100+", "No, under 100", null, null, 720),
            new MockBetData("Next tech company to hit $1T valuation?", "Technology sector prediction", 
                Bet.BetType.MULTIPLE_CHOICE, "Tesla", "Netflix", "AMD", "Other", 4320),
            new MockBetData("Will the temperature exceed 80°F today?", "Daily weather bet", 
                Bet.BetType.PREDICTION, "Above 80°F", "80°F or below", null, null, 12),
            new MockBetData("Which gaming console sells most this holiday?", "Gaming market prediction", 
                Bet.BetType.MULTIPLE_CHOICE, "PlayStation 5", "Xbox Series X", "Nintendo Switch", "Steam Deck", 1440),
            new MockBetData("Will unemployment rate decrease next month?", "Economic indicator prediction", 
                Bet.BetType.PREDICTION, "Rate Decreases", "Rate Increases/Same", null, null, 672),
            new MockBetData("Best streaming service next year?", "Entertainment industry prediction", 
                Bet.BetType.MULTIPLE_CHOICE, "Netflix", "Disney+", "HBO Max", "Amazon Prime", 8760),
            new MockBetData("Will our favorite restaurant add new menu items?", "Local business prediction", 
                Bet.BetType.PREDICTION, "New Items Added", "Menu Stays Same", null, null, 504)
        );
        
        int totalBetsCreated = 0;
        int totalParticipationsCreated = 0;
        
        for (Group group : allGroups) {
            // Get group members
            List<GroupMembership> memberships = groupMembershipRepository.findByGroupAndIsActiveTrue(group);
            if (memberships.isEmpty()) {
                // Create some memberships if the group is empty
                List<User> someUsers = allUsers.subList(0, Math.min(5, allUsers.size()));
                for (User user : someUsers) {
                    GroupMembership membership = new GroupMembership();
                    membership.setUser(user);
                    membership.setGroup(group);
                    membership.setStatus(GroupMembership.MembershipStatus.APPROVED);
                    membership.setIsActive(true);
                    membership.setRole(GroupMembership.MemberRole.MEMBER);
                    membership.setTotalBets(0);
                    membership.setTotalWins(0);
                    membership.setTotalLosses(0);
                    membership.setLastActivityAt(LocalDateTime.now());
                    groupMembershipRepository.save(membership);
                    
                    group.incrementMemberCount();
                }
                groupRepository.save(group);
                memberships = groupMembershipRepository.findByGroupAndIsActiveTrue(group);
            }
            
            // Create 3-5 bets per group
            int betsToCreate = random.nextInt(3) + 3;
            
            for (int i = 0; i < betsToCreate && i < mockBets.size(); i++) {
                MockBetData betData = mockBets.get((int) ((group.getId() * 3 + i) % mockBets.size()));
                
                // Select random creator from group members
                GroupMembership creatorMembership = memberships.get(random.nextInt(memberships.size()));
                User creator = creatorMembership.getUser();
                
                // Create the bet
                Bet bet = new Bet();
                bet.setCreator(creator);
                bet.setGroup(group);
                bet.setTitle(betData.title);
                bet.setDescription(betData.description);
                bet.setBetType(betData.betType);
                bet.setOption1(betData.option1);
                bet.setOption2(betData.option2);
                if (betData.option3 != null) {
                    bet.setOption3(betData.option3);
                }
                if (betData.option4 != null) {
                    bet.setOption4(betData.option4);
                }
                
                // Set financial parameters
                bet.setMinimumBet(new BigDecimal(random.nextInt(10) + 1)); // 1-10 credits
                if (random.nextBoolean()) {
                    bet.setMaximumBet(new BigDecimal(random.nextInt(100) + 50)); // 50-150 credits
                }
                
                // Set timing
                LocalDateTime now = LocalDateTime.now();
                int hoursUntilDeadline = betData.hoursUntilDeadline + random.nextInt(24) - 12; // ±12 hours variance
                bet.setBettingDeadline(now.plusHours(Math.max(1, hoursUntilDeadline)));
                
                if (random.nextBoolean()) {
                    bet.setResolveDate(bet.getBettingDeadline().plusHours(random.nextInt(48) + 1));
                }
                
                // Random status distribution
                if (random.nextInt(10) < 7) { // 70% open
                    bet.setStatus(Bet.BetStatus.OPEN);
                } else if (random.nextInt(10) < 2) { // 20% closed
                    bet.setStatus(Bet.BetStatus.CLOSED);
                } else { // 10% resolved
                    bet.setStatus(Bet.BetStatus.RESOLVED);
                    bet.setResolvedAt(now.minusHours(random.nextInt(168))); // Resolved in past week
                    
                    // Set random outcome for resolved bets
                    if (bet.getBetType() == Bet.BetType.PREDICTION) {
                        bet.setOutcome(random.nextBoolean() ? Bet.BetOutcome.OPTION_1 : Bet.BetOutcome.OPTION_2);
                    } else {
                        Bet.BetOutcome[] outcomes = {Bet.BetOutcome.OPTION_1, Bet.BetOutcome.OPTION_2, 
                                                    Bet.BetOutcome.OPTION_3, Bet.BetOutcome.OPTION_4};
                        bet.setOutcome(outcomes[random.nextInt(bet.getOptionCount())]);
                    }
                }
                
                bet.setIsActive(true);
                bet.setTotalPool(BigDecimal.ZERO);
                bet.setTotalParticipants(0);
                bet.setParticipantsForOption1(0);
                bet.setParticipantsForOption2(0);
                bet.setPoolForOption1(BigDecimal.ZERO);
                bet.setPoolForOption2(BigDecimal.ZERO);
                
                betRepository.save(bet);
                totalBetsCreated++;
                logger.info("Created mock bet '{}' for group '{}'", bet.getTitle(), group.getGroupName());
                
                // Create bet participations for some group members
                int participationsCreated = createBetParticipations(bet, memberships, random);
                totalParticipationsCreated += participationsCreated;
            }
        }
        
        String result = String.format("Successfully created %d mock bets with %d participations across %d groups", 
                                    totalBetsCreated, totalParticipationsCreated, allGroups.size());
        logger.info(result);
        return result;
    }

    private int createBetParticipations(Bet bet, List<GroupMembership> memberships, Random random) {
        // 30-80% of group members participate in each bet
        int participantCount = Math.max(1, (int) (memberships.size() * (0.3 + random.nextDouble() * 0.5)));
        
        List<GroupMembership> shuffledMemberships = new ArrayList<>(memberships);
        Collections.shuffle(shuffledMemberships, random);
        
        BigDecimal totalPool = BigDecimal.ZERO;
        int totalParticipants = 0;
        int option1Count = 0;
        int option2Count = 0;
        BigDecimal option1Pool = BigDecimal.ZERO;
        BigDecimal option2Pool = BigDecimal.ZERO;
        
        for (int i = 0; i < participantCount; i++) {
            User participant = shuffledMemberships.get(i).getUser();
            
            // Skip creator occasionally to make it realistic
            if (participant.getId().equals(bet.getCreator().getId()) && random.nextInt(3) == 0) {
                continue;
            }
            
            BetParticipation participation = new BetParticipation();
            participation.setUser(participant);
            participation.setBet(bet);
            
            // Choose random option (weighted toward options 1 and 2)
            int chosenOption;
            if (bet.getBetType() == Bet.BetType.PREDICTION || random.nextInt(3) < 2) {
                chosenOption = random.nextBoolean() ? 1 : 2;
            } else {
                chosenOption = random.nextInt(bet.getOptionCount()) + 1;
            }
            participation.setChosenOption(chosenOption);
            
            // Random bet amount within limits
            BigDecimal minBet = bet.getMinimumBet();
            BigDecimal maxBet = bet.getMaximumBet() != null ? bet.getMaximumBet() : new BigDecimal("100");
            BigDecimal betAmount = minBet.add(
                new BigDecimal(random.nextDouble()).multiply(maxBet.subtract(minBet))
            );
            participation.setBetAmount(betAmount.setScale(2, java.math.RoundingMode.HALF_UP));
            
            // Calculate potential winnings (simplified odds calculation)
            double odds = 1.5 + random.nextDouble() * 2.0; // 1.5x to 3.5x multiplier
            participation.setPotentialWinnings(participation.getBetAmount().multiply(BigDecimal.valueOf(odds)));
            
            participation.setStatus(BetParticipation.ParticipationStatus.ACTIVE);
            participation.setIsActive(true);
            
            // Handle resolved bets
            if (bet.getStatus() == Bet.BetStatus.RESOLVED) {
                if (participation.isWinner()) {
                    participation.setActualWinnings(participation.getPotentialWinnings());
                    participation.setStatus(BetParticipation.ParticipationStatus.WON);
                } else {
                    participation.setActualWinnings(BigDecimal.ZERO);
                    participation.setStatus(BetParticipation.ParticipationStatus.LOST);
                }
                participation.setSettledAt(bet.getResolvedAt().plusMinutes(random.nextInt(60)));
            }
            
            betParticipationRepository.save(participation);
            
            // Update bet statistics
            totalPool = totalPool.add(participation.getBetAmount());
            totalParticipants++;
            
            if (chosenOption == 1) {
                option1Count++;
                option1Pool = option1Pool.add(participation.getBetAmount());
            } else if (chosenOption == 2) {
                option2Count++;
                option2Pool = option2Pool.add(participation.getBetAmount());
            }
        }
        
        // Update bet with final statistics
        bet.setTotalPool(totalPool);
        bet.setTotalParticipants(totalParticipants);
        bet.setParticipantsForOption1(option1Count);
        bet.setParticipantsForOption2(option2Count);
        bet.setPoolForOption1(option1Pool);
        bet.setPoolForOption2(option2Pool);
        
        betRepository.save(bet);
        
        return totalParticipants;
    }

    private static class MockBetData {
        final String title;
        final String description;
        final Bet.BetType betType;
        final String option1;
        final String option2;
        final String option3;
        final String option4;
        final int hoursUntilDeadline;

        MockBetData(String title, String description, Bet.BetType betType, 
                   String option1, String option2, String option3, String option4, int hoursUntilDeadline) {
            this.title = title;
            this.description = description;
            this.betType = betType;
            this.option1 = option1;
            this.option2 = option2;
            this.option3 = option3;
            this.option4 = option4;
            this.hoursUntilDeadline = hoursUntilDeadline;
        }
    }
}