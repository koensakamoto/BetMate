package com.betmate.controller;

import com.betmate.dto.common.ApiResponse;
import com.betmate.dto.contact.ContactMessageRequestDto;
import com.betmate.dto.contact.ContactMessageResponseDto;
import com.betmate.entity.user.User;
import com.betmate.service.contact.ContactService;
import com.betmate.service.security.UserDetailsServiceImpl.UserPrincipal;
import jakarta.validation.Valid;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

/**
 * REST controller for contact/support message operations.
 * Handles submission and retrieval of contact messages.
 */
@RestController
@RequestMapping("/api/contact")
public class ContactController {

    private static final Logger logger = LoggerFactory.getLogger(ContactController.class);

    private final ContactService contactService;

    @Autowired
    public ContactController(ContactService contactService) {
        this.contactService = contactService;
    }

    /**
     * Submit a new contact/support message.
     * Authentication is optional - anonymous users can also submit messages.
     *
     * POST /api/contact/submit
     *
     * @param requestDto Contact message request data
     * @param authentication Optional authentication (can be null for anonymous)
     * @return ResponseEntity with ContactMessageResponseDto
     */
    @PostMapping("/submit")
    public ResponseEntity<ApiResponse<ContactMessageResponseDto>> submitContactMessage(
            @Valid @RequestBody ContactMessageRequestDto requestDto,
            Authentication authentication) {

        logger.info("Received contact message submission - Category: {}, Authenticated: {}",
                   requestDto.getCategory(),
                   authentication != null);

        // Get current user if authenticated, null otherwise
        User currentUser = null;
        if (authentication != null && authentication.isAuthenticated()) {
            try {
                Object principal = authentication.getPrincipal();
                if (principal instanceof UserPrincipal) {
                    currentUser = ((UserPrincipal) principal).getUser();
                }
            } catch (Exception e) {
                logger.warn("Failed to get user from authentication: {}", e.getMessage());
            }
        }

        // Submit contact message
        ContactMessageResponseDto responseDto = contactService.submitContactMessage(requestDto, currentUser);

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(ApiResponse.success(
                        responseDto,
                        "Your message has been submitted successfully. We'll get back to you within 24 hours."
                ));
    }
}
