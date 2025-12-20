package com.rivalpicks.service.user;

import com.rivalpicks.dto.export.*;
import com.rivalpicks.entity.betting.Bet;
import com.rivalpicks.entity.betting.BetParticipation;
import com.rivalpicks.entity.group.GroupMembership;
import com.rivalpicks.entity.messaging.Notification;
import com.rivalpicks.entity.user.Transaction;
import com.rivalpicks.entity.user.User;
import com.rivalpicks.entity.user.UserSettings;
import com.rivalpicks.repository.betting.BetParticipationRepository;
import com.rivalpicks.repository.betting.BetRepository;
import com.rivalpicks.repository.group.GroupMembershipRepository;
import com.rivalpicks.repository.messaging.NotificationRepository;
import com.rivalpicks.repository.user.TransactionRepository;
import com.rivalpicks.repository.user.UserSettingsRepository;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.util.List;

/**
 * Service for exporting user data.
 * Aggregates all user-related data from various repositories.
 */
@Service
public class DataExportService {

    private static final String EXPORT_VERSION = "1.0";

    private final UserService userService;
    private final UserSettingsRepository userSettingsRepository;
    private final BetRepository betRepository;
    private final BetParticipationRepository betParticipationRepository;
    private final TransactionRepository transactionRepository;
    private final GroupMembershipRepository groupMembershipRepository;
    private final NotificationRepository notificationRepository;

    public DataExportService(
            UserService userService,
            UserSettingsRepository userSettingsRepository,
            BetRepository betRepository,
            BetParticipationRepository betParticipationRepository,
            TransactionRepository transactionRepository,
            GroupMembershipRepository groupMembershipRepository,
            NotificationRepository notificationRepository) {
        this.userService = userService;
        this.userSettingsRepository = userSettingsRepository;
        this.betRepository = betRepository;
        this.betParticipationRepository = betParticipationRepository;
        this.transactionRepository = transactionRepository;
        this.groupMembershipRepository = groupMembershipRepository;
        this.notificationRepository = notificationRepository;
    }

    /**
     * Export all data for a user.
     *
     * @param userId The ID of the user to export data for
     * @return DataExportDto containing all user data
     */
    @Transactional(readOnly = true)
    public DataExportDto exportUserData(Long userId) {
        User user = userService.getUserById(userId);

        return new DataExportDto(
            createMetadata(user),
            exportProfile(user),
            exportSettings(user),
            exportBetsCreated(user),
            exportBetParticipations(user),
            exportTransactions(user),
            exportGroupMemberships(user),
            exportNotifications(user)
        );
    }

    private DataExportDto.ExportMetadata createMetadata(User user) {
        return new DataExportDto.ExportMetadata(
            user.getId(),
            user.getUsername(),
            LocalDateTime.now(ZoneOffset.UTC),
            EXPORT_VERSION
        );
    }

    private ProfileExportDto exportProfile(User user) {
        return ProfileExportDto.fromUser(user);
    }

    private SettingsExportDto exportSettings(User user) {
        UserSettings settings = userSettingsRepository.findByUserId(user.getId()).orElse(null);
        return SettingsExportDto.fromUserSettings(settings);
    }

    private List<BetExportDto> exportBetsCreated(User user) {
        List<Bet> bets = betRepository.findByCreator(user);
        return bets.stream()
            .map(BetExportDto::fromBet)
            .toList();
    }

    private List<BetParticipationExportDto> exportBetParticipations(User user) {
        List<BetParticipation> participations = betParticipationRepository.findByUserWithRelations(user);
        return participations.stream()
            .map(BetParticipationExportDto::fromBetParticipation)
            .toList();
    }

    private List<TransactionExportDto> exportTransactions(User user) {
        // Get all transactions (using a large page size to get all)
        var transactions = transactionRepository.findByUserOrderByCreatedAtDesc(user, PageRequest.of(0, Integer.MAX_VALUE));
        return transactions.getContent().stream()
            .map(TransactionExportDto::fromTransaction)
            .toList();
    }

    private List<GroupMembershipExportDto> exportGroupMemberships(User user) {
        List<GroupMembership> memberships = groupMembershipRepository.findByUser(user);
        return memberships.stream()
            .map(GroupMembershipExportDto::fromGroupMembership)
            .toList();
    }

    private List<NotificationExportDto> exportNotifications(User user) {
        List<Notification> notifications = notificationRepository.findByUserOrderByCreatedAtDesc(user);
        return notifications.stream()
            .filter(n -> n.getDeletedAt() == null) // Only include non-deleted notifications
            .map(NotificationExportDto::fromNotification)
            .toList();
    }
}
