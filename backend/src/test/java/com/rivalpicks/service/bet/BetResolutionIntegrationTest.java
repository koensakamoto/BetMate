package com.rivalpicks.service.bet;

import com.rivalpicks.entity.betting.Bet;
import com.rivalpicks.entity.betting.BetParticipation;
import com.rivalpicks.entity.betting.BetStakeType;
import com.rivalpicks.entity.group.Group;
import com.rivalpicks.entity.user.User;
import com.rivalpicks.repository.betting.BetParticipationRepository;
import com.rivalpicks.repository.betting.BetRepository;
import com.rivalpicks.repository.group.GroupRepository;
import com.rivalpicks.repository.user.UserRepository;
import com.rivalpicks.service.user.UserCreditService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Integration test to verify that user statistics are correctly updated
 * when bets are resolved through BetResolutionService.
 *
 * This test ensures the fix for the bug where user statistics (wins, losses, streaks)
 * were not being updated in the users table when bets were resolved.
 */
@SpringBootTest
@ActiveProfiles("test")
@Transactional
@DisplayName("Bet Resolution - User Statistics Integration Test")
class BetResolutionIntegrationTest {

    @Autowired
    private BetResolutionService betResolutionService;

    @Autowired
    private BetService betService;

    @Autowired
    private BetParticipationService betParticipationService;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private GroupRepository groupRepository;

    @Autowired
    private BetRepository betRepository;

    @Autowired
    private BetParticipationRepository participationRepository;

    @Autowired
    private UserCreditService creditService;

    private User creator;
    private User user1;
    private User user2;
    private User user3;
    private Group group;

    @BeforeEach
    void setUp() {
        // Create test users with zero statistics (with unique emails per test)
        long timestamp = System.currentTimeMillis();
        creator = createUser("creator" + timestamp + "@test.com", "creator" + timestamp, BigDecimal.valueOf(1000));
        user1 = createUser("user1" + timestamp + "@test.com", "user1" + timestamp, BigDecimal.valueOf(1000));
        user2 = createUser("user2" + timestamp + "@test.com", "user2" + timestamp, BigDecimal.valueOf(1000));
        user3 = createUser("user3" + timestamp + "@test.com", "user3" + timestamp, BigDecimal.valueOf(1000));

        // Create a test group with unique name
        group = createGroup("Test Group " + timestamp, creator);
    }

    @Test
    @DisplayName("Should update user statistics when bet is resolved by creator")
    void shouldUpdateUserStatisticsWhenBetResolvedByCreator() {
        // Given: A bet with multiple participants
        Bet bet = createBet("Test Bet", group, creator);

        // Users place bets while bet is OPEN
        placeBet(user1, bet, 1, BigDecimal.TEN); // User 1 chooses option 1
        placeBet(user2, bet, 2, BigDecimal.TEN); // User 2 chooses option 2
        placeBet(user3, bet, 1, BigDecimal.TEN); // User 3 chooses option 1

        // Close bet after all participants have placed bets
        bet.setStatus(Bet.BetStatus.CLOSED);
        betRepository.save(bet);

        // Verify initial statistics (should all be 0 wins/losses, 1 active bet each)
        assertUserStats(user1, 0, 0, 0, 0, 1);
        assertUserStats(user2, 0, 0, 0, 0, 1);
        assertUserStats(user3, 0, 0, 0, 0, 1);

        // When: Creator resolves the bet (option 1 wins)
        betResolutionService.resolveBet(bet.getId(), creator, Bet.BetOutcome.OPTION_1, "Option 1 wins");

        // Then: User statistics should be updated correctly
        // User 1 and 3 won (chose option 1), User 2 lost (chose option 2)
        User updatedUser1 = userRepository.findById(user1.getId()).orElseThrow();
        User updatedUser2 = userRepository.findById(user2.getId()).orElseThrow();
        User updatedUser3 = userRepository.findById(user3.getId()).orElseThrow();

        // Verify User 1 (winner)
        assertThat(updatedUser1.getWinCount()).isEqualTo(1);
        assertThat(updatedUser1.getLossCount()).isEqualTo(0);
        assertThat(updatedUser1.getCurrentStreak()).isEqualTo(1);
        assertThat(updatedUser1.getLongestStreak()).isEqualTo(1);
        assertThat(updatedUser1.getActiveBets()).isEqualTo(0); // Decremented after resolution

        // Verify User 2 (loser)
        assertThat(updatedUser2.getWinCount()).isEqualTo(0);
        assertThat(updatedUser2.getLossCount()).isEqualTo(1);
        assertThat(updatedUser2.getCurrentStreak()).isEqualTo(0); // Streak broken
        assertThat(updatedUser2.getLongestStreak()).isEqualTo(0);
        assertThat(updatedUser2.getActiveBets()).isEqualTo(0); // Decremented after resolution

        // Verify User 3 (winner)
        assertThat(updatedUser3.getWinCount()).isEqualTo(1);
        assertThat(updatedUser3.getLossCount()).isEqualTo(0);
        assertThat(updatedUser3.getCurrentStreak()).isEqualTo(1);
        assertThat(updatedUser3.getLongestStreak()).isEqualTo(1);
        assertThat(updatedUser3.getActiveBets()).isEqualTo(0); // Decremented after resolution
    }

    @Test
    @DisplayName("Should maintain win streak across multiple bet resolutions")
    void shouldMaintainWinStreakAcrossMultipleBets() {
        // Given: User 1 has already won 2 bets
        user1.setWinCount(2);
        user1.setCurrentStreak(2);
        user1.setLongestStreak(2);
        userRepository.save(user1);

        // Create a new bet
        Bet bet = createBet("Streak Test Bet", group, creator);

        // Place bets while OPEN
        placeBet(user1, bet, 1, BigDecimal.TEN);
        placeBet(user2, bet, 2, BigDecimal.TEN);

        // Close bet before resolution
        bet.setStatus(Bet.BetStatus.CLOSED);
        betRepository.save(bet);

        // When: User 1 wins again
        betResolutionService.resolveBet(bet.getId(), creator, Bet.BetOutcome.OPTION_1, "User 1 wins again");

        // Then: User 1's streak should increase
        User updatedUser1 = userRepository.findById(user1.getId()).orElseThrow();
        assertThat(updatedUser1.getWinCount()).isEqualTo(3);
        assertThat(updatedUser1.getCurrentStreak()).isEqualTo(3);
        assertThat(updatedUser1.getLongestStreak()).isEqualTo(3);
    }

    @Test
    @DisplayName("Should break win streak on loss")
    void shouldBreakWinStreakOnLoss() {
        // Given: User 1 has a 3-win streak
        user1.setWinCount(3);
        user1.setCurrentStreak(3);
        user1.setLongestStreak(3);
        userRepository.save(user1);

        // Create a new bet
        Bet bet = createBet("Streak Break Test", group, creator);

        // Place bets while OPEN
        placeBet(user1, bet, 1, BigDecimal.TEN);
        placeBet(user2, bet, 2, BigDecimal.TEN);

        // Close bet before resolution
        bet.setStatus(Bet.BetStatus.CLOSED);
        betRepository.save(bet);

        // When: User 1 loses (option 2 wins)
        betResolutionService.resolveBet(bet.getId(), creator, Bet.BetOutcome.OPTION_2, "User 1 loses");

        // Then: User 1's current streak should reset, but longest streak preserved
        User updatedUser1 = userRepository.findById(user1.getId()).orElseThrow();
        assertThat(updatedUser1.getWinCount()).isEqualTo(3); // No change
        assertThat(updatedUser1.getLossCount()).isEqualTo(1); // Incremented
        assertThat(updatedUser1.getCurrentStreak()).isEqualTo(0); // Reset to 0
        assertThat(updatedUser1.getLongestStreak()).isEqualTo(3); // Preserved
    }

    @Test
    @DisplayName("Should update statistics for social bets (no credits)")
    void shouldUpdateStatisticsForSocialBets() {
        // Given: A social bet (no credit stakes)
        Bet socialBet = createSocialBet("Social Bet", group, creator);

        // Place bets while OPEN (amount doesn't matter for social bets, but must pass validation)
        placeBet(user1, socialBet, 1, BigDecimal.ONE);
        placeBet(user2, socialBet, 2, BigDecimal.ONE);

        // Close bet before resolution
        socialBet.setStatus(Bet.BetStatus.CLOSED);
        betRepository.save(socialBet);

        // When: Bet is resolved
        betResolutionService.resolveBet(socialBet.getId(), creator, Bet.BetOutcome.OPTION_1, "Social bet resolved");

        // Then: Statistics should still be updated even for non-credit bets
        User updatedUser1 = userRepository.findById(user1.getId()).orElseThrow();
        User updatedUser2 = userRepository.findById(user2.getId()).orElseThrow();

        assertThat(updatedUser1.getWinCount()).isEqualTo(1);
        assertThat(updatedUser2.getLossCount()).isEqualTo(1);
    }

    @Test
    @DisplayName("Should correctly update active bets count")
    void shouldCorrectlyUpdateActiveBetsCount() {
        // Given: User 1 has 3 active bets
        Bet bet1 = createBet("Bet 1", group, creator);
        Bet bet2 = createBet("Bet 2", group, creator);
        Bet bet3 = createBet("Bet 3", group, creator);

        placeBet(user1, bet1, 1, BigDecimal.TEN);
        placeBet(user1, bet2, 1, BigDecimal.TEN);
        placeBet(user1, bet3, 1, BigDecimal.TEN);

        User user = userRepository.findById(user1.getId()).orElseThrow();
        assertThat(user.getActiveBets()).isEqualTo(3);

        // When: Two bets are resolved
        bet1.setStatus(Bet.BetStatus.CLOSED);
        bet2.setStatus(Bet.BetStatus.CLOSED);
        betRepository.save(bet1);
        betRepository.save(bet2);

        betResolutionService.resolveBet(bet1.getId(), creator, Bet.BetOutcome.OPTION_1, "Resolved");
        betResolutionService.resolveBet(bet2.getId(), creator, Bet.BetOutcome.OPTION_1, "Resolved");

        // Then: Active bets count should decrease to 1
        User updatedUser = userRepository.findById(user1.getId()).orElseThrow();
        assertThat(updatedUser.getActiveBets()).isEqualTo(1);
    }

    // ==========================================
    // Helper Methods
    // ==========================================

    private User createUser(String email, String username, BigDecimal credits) {
        User user = new User();
        user.setEmail(email);
        user.setUsername(username);
        user.setPasswordHash("hashed_password");
        user.setFirstName(username);
        user.setLastName("Test");
        user.setCreditBalance(credits);
        user.setWinCount(0);
        user.setLossCount(0);
        user.setCurrentStreak(0);
        user.setLongestStreak(0);
        user.setActiveBets(0);
        return userRepository.save(user);
    }

    private Group createGroup(String name, User creator) {
        Group g = new Group();
        g.setGroupName(name);
        g.setCreator(creator);
        g.setPrivacy(Group.Privacy.PRIVATE);
        g.setIsActive(true);
        return groupRepository.save(g);
    }

    private Bet createBet(String title, Group g, User c) {
        Bet bet = new Bet();
        bet.setTitle(title);
        bet.setGroup(g);
        bet.setCreator(c);
        bet.setBetType(Bet.BetType.MULTIPLE_CHOICE);
        bet.setStakeType(BetStakeType.CREDIT);
        bet.setFixedStakeAmount(BigDecimal.TEN);
        bet.setStatus(Bet.BetStatus.OPEN);
        bet.setResolutionMethod(Bet.BetResolutionMethod.SELF);
        bet.setBettingDeadline(LocalDateTime.now().plusDays(7));
        bet.setResolveDate(LocalDateTime.now().plusDays(14));
        bet.setOption1("Option 1");
        bet.setOption2("Option 2");
        bet.setTotalPool(BigDecimal.ZERO);
        bet.setPoolForOption1(BigDecimal.ZERO);
        bet.setPoolForOption2(BigDecimal.ZERO);
        bet.setTotalParticipants(0);
        bet.setParticipantsForOption1(0);
        bet.setParticipantsForOption2(0);
        return betRepository.save(bet);
    }

    private Bet createSocialBet(String title, Group g, User c) {
        Bet bet = createBet(title, g, c);
        bet.setStakeType(BetStakeType.SOCIAL);
        bet.setFixedStakeAmount(null);
        return betRepository.save(bet);
    }

    private void placeBet(User user, Bet bet, Integer option, BigDecimal amount) {
        betParticipationService.placeBet(user, bet.getId(), option, amount, null);
    }

    private void assertUserStats(User user, int winCount, int lossCount,
                                  int currentStreak, int longestStreak, int activeBets) {
        User u = userRepository.findById(user.getId()).orElseThrow();
        assertThat(u.getWinCount()).isEqualTo(winCount);
        assertThat(u.getLossCount()).isEqualTo(lossCount);
        assertThat(u.getCurrentStreak()).isEqualTo(currentStreak);
        assertThat(u.getLongestStreak()).isEqualTo(longestStreak);
        assertThat(u.getActiveBets()).isEqualTo(activeBets);
    }
}
