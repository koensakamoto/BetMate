package com.rivalpicks.service.contact;

import com.rivalpicks.dto.contact.ContactMessageRequestDto;
import com.rivalpicks.dto.contact.ContactMessageResponseDto;
import com.rivalpicks.entity.messaging.ContactMessage;
import com.rivalpicks.entity.user.User;
import com.rivalpicks.repository.messaging.ContactMessageRepository;
import com.rivalpicks.service.email.EmailService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

/**
 * Service for handling contact/support messages.
 */
@Service
public class ContactService {

    private static final Logger logger = LoggerFactory.getLogger(ContactService.class);

    private final ContactMessageRepository contactMessageRepository;
    private final EmailService emailService;

    @Autowired
    public ContactService(ContactMessageRepository contactMessageRepository,
                         EmailService emailService) {
        this.contactMessageRepository = contactMessageRepository;
        this.emailService = emailService;
    }

    /**
     * Submit a new contact message.
     * Saves the message to database and sends email notification.
     *
     * @param requestDto Contact message request data
     * @param user Current user (optional - can be null for anonymous submissions)
     * @return ContactMessageResponseDto
     */
    @Transactional
    public ContactMessageResponseDto submitContactMessage(ContactMessageRequestDto requestDto, User user) {
        logger.info("Submitting contact message - Category: {}, User: {}",
                   requestDto.getCategory(),
                   user != null ? user.getUsername() : "Anonymous");

        // Create and save contact message
        ContactMessage contactMessage = new ContactMessage();
        contactMessage.setUser(user);
        contactMessage.setCategory(requestDto.getCategory());
        contactMessage.setSubject(requestDto.getSubject());
        contactMessage.setMessage(requestDto.getMessage());
        contactMessage.setEmail(requestDto.getEmail());
        contactMessage.setStatus("PENDING");

        ContactMessage savedMessage = contactMessageRepository.save(contactMessage);
        logger.info("Contact message saved with ID: {}", savedMessage.getId());

        // Send email notification asynchronously
        try {
            emailService.sendContactMessageNotification(savedMessage);
        } catch (Exception e) {
            logger.error("Failed to send email notification for contact message ID: {}",
                        savedMessage.getId(), e);
            // Continue - we don't want to fail the request if email fails
        }

        // Return response DTO
        return mapToResponseDto(savedMessage);
    }

    /**
     * Get all contact messages by user.
     */
    public List<ContactMessageResponseDto> getContactMessagesByUser(User user) {
        List<ContactMessage> messages = contactMessageRepository.findByUserOrderByCreatedAtDesc(user);
        return messages.stream()
                      .map(this::mapToResponseDto)
                      .collect(Collectors.toList());
    }

    /**
     * Get all contact messages by status.
     */
    public List<ContactMessageResponseDto> getContactMessagesByStatus(String status) {
        List<ContactMessage> messages = contactMessageRepository.findByStatusOrderByCreatedAtDesc(status);
        return messages.stream()
                      .map(this::mapToResponseDto)
                      .collect(Collectors.toList());
    }

    /**
     * Map ContactMessage entity to ResponseDto.
     */
    private ContactMessageResponseDto mapToResponseDto(ContactMessage message) {
        return new ContactMessageResponseDto(
            message.getId(),
            message.getCategory(),
            message.getSubject(),
            message.getStatus(),
            message.getCreatedAt()
        );
    }
}
