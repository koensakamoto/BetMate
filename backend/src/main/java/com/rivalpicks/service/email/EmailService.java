package com.rivalpicks.service.email;

import com.rivalpicks.entity.messaging.ContactMessage;
import com.rivalpicks.entity.user.User;
import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

/**
 * Service for sending emails.
 */
@Service
public class EmailService {

    private static final Logger logger = LoggerFactory.getLogger(EmailService.class);

    private final JavaMailSender mailSender;

    @Value("${contact.support-email}")
    private String supportEmail;

    @Value("${spring.mail.username}")
    private String fromEmail;

    @Autowired
    public EmailService(JavaMailSender mailSender) {
        this.mailSender = mailSender;
    }

    /**
     * Send contact message notification email to support team.
     * Uses @Async to avoid blocking the main thread.
     */
    @Async
    public void sendContactMessageNotification(ContactMessage contactMessage) {
        try {
            MimeMessage mimeMessage = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(mimeMessage, true, "UTF-8");

            // Email details
            helper.setFrom(fromEmail);
            helper.setTo(supportEmail);
            helper.setSubject(String.format("[%s] %s", contactMessage.getCategory(), contactMessage.getSubject()));

            // Build email body
            String emailBody = buildContactMessageEmail(contactMessage);
            helper.setText(emailBody, true); // true = HTML content

            // Send email
            mailSender.send(mimeMessage);
            logger.info("Contact message notification email sent successfully for message ID: {}", contactMessage.getId());

        } catch (MessagingException e) {
            logger.error("Failed to send contact message notification email for message ID: {}",
                        contactMessage.getId(), e);
            // Don't throw exception - we don't want to fail the request if email fails
            // The message is already saved in the database
        }
    }

    /**
     * Build HTML email body for contact message notification.
     */
    private String buildContactMessageEmail(ContactMessage contactMessage) {
        StringBuilder html = new StringBuilder();
        html.append("<!DOCTYPE html>");
        html.append("<html>");
        html.append("<head><meta charset='UTF-8'></head>");
        html.append("<body style='font-family: Arial, sans-serif; line-height: 1.6; color: #333;'>");
        html.append("<div style='max-width: 600px; margin: 0 auto; padding: 20px;'>");

        // Header
        html.append("<div style='background-color: #00D4AA; padding: 20px; border-radius: 8px 8px 0 0;'>");
        html.append("<h2 style='margin: 0; color: #000;'>New Contact Message</h2>");
        html.append("</div>");

        // Content
        html.append("<div style='background-color: #f9f9f9; padding: 20px; border: 1px solid #ddd;'>");

        html.append("<p><strong>Category:</strong> ").append(contactMessage.getCategory()).append("</p>");
        html.append("<p><strong>Subject:</strong> ").append(contactMessage.getSubject()).append("</p>");

        if (contactMessage.getUser() != null) {
            User user = contactMessage.getUser();
            html.append("<p><strong>From User:</strong> ")
                .append(user.getUsername())
                .append(" (").append(user.getEmail()).append(")")
                .append("</p>");
        } else if (contactMessage.getEmail() != null) {
            html.append("<p><strong>From Email:</strong> ").append(contactMessage.getEmail()).append("</p>");
        }

        html.append("<p><strong>Message:</strong></p>");
        html.append("<div style='background-color: #fff; padding: 15px; border-radius: 4px; margin: 10px 0;'>");
        html.append(contactMessage.getMessage().replace("\n", "<br>"));
        html.append("</div>");

        html.append("<p style='color: #666; font-size: 12px; margin-top: 20px;'>");
        html.append("<strong>Submitted:</strong> ").append(contactMessage.getCreatedAt().toString());
        html.append("</p>");

        html.append("</div>");

        // Footer
        html.append("<div style='background-color: #333; color: #fff; padding: 15px; border-radius: 0 0 8px 8px; text-align: center; font-size: 12px;'>");
        html.append("BetMate Support System");
        html.append("</div>");

        html.append("</div>");
        html.append("</body>");
        html.append("</html>");

        return html.toString();
    }
}
