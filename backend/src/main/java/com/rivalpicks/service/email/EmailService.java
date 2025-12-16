package com.rivalpicks.service.email;

import com.resend.Resend;
import com.resend.core.exception.ResendException;
import com.resend.services.emails.model.CreateEmailOptions;
import com.resend.services.emails.model.CreateEmailResponse;
import com.rivalpicks.entity.messaging.ContactMessage;
import com.rivalpicks.entity.user.User;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

/**
 * Service for sending emails using Resend.
 */
@Service
public class EmailService {

    private static final Logger logger = LoggerFactory.getLogger(EmailService.class);

    private final Resend resend;

    @Value("${contact.support-email}")
    private String supportEmail;

    @Value("${resend.from-email}")
    private String fromEmail;

    @Value("${resend.reply-to}")
    private String replyTo;

    @Autowired
    public EmailService(Resend resend) {
        this.resend = resend;
    }

    /**
     * Send contact message notification email to support team.
     * Uses @Async to avoid blocking the main thread.
     */
    @Async
    public void sendContactMessageNotification(ContactMessage contactMessage) {
        try {
            String emailBody = buildContactMessageEmail(contactMessage);

            CreateEmailOptions params = CreateEmailOptions.builder()
                    .from(fromEmail)
                    .to(supportEmail)
                    .replyTo(replyTo)
                    .subject(String.format("[%s] %s", contactMessage.getCategory(), contactMessage.getSubject()))
                    .html(emailBody)
                    .build();

            CreateEmailResponse response = resend.emails().send(params);
            logger.info("Contact message notification email sent successfully for message ID: {}, email ID: {}",
                    contactMessage.getId(), response.getId());

        } catch (ResendException e) {
            logger.error("Failed to send contact message notification email for message ID: {}",
                    contactMessage.getId(), e);
            // Don't throw exception - we don't want to fail the request if email fails
            // The message is already saved in the database
        }
    }

    /**
     * Send email change verification email to the NEW email address.
     * Uses @Async to avoid blocking the main thread.
     *
     * @param user        the user requesting email change
     * @param newEmail    the new email address to verify
     * @param token       the verification token
     * @param frontendUrl the frontend URL for the verification link
     */
    @Async
    public void sendEmailChangeVerificationEmail(User user, String newEmail, String token, String frontendUrl) {
        try {
            String verifyLink = frontendUrl + "/auth/verify-email-change?token=" + token;
            String emailBody = buildEmailChangeVerificationEmail(user, newEmail, verifyLink);

            CreateEmailOptions params = CreateEmailOptions.builder()
                    .from(fromEmail)
                    .to(newEmail)
                    .replyTo(replyTo)
                    .subject("Verify Your New Email Address - RivalPicks")
                    .html(emailBody)
                    .build();

            CreateEmailResponse response = resend.emails().send(params);
            logger.info("Email change verification sent to: {}, email ID: {}", newEmail, response.getId());

        } catch (ResendException e) {
            logger.error("Failed to send email change verification to: {}", newEmail, e);
            throw new RuntimeException("Failed to send verification email", e);
        }
    }

    /**
     * Send notification to the OLD email about email change request.
     * Uses @Async to avoid blocking the main thread.
     *
     * @param user     the user requesting email change
     * @param newEmail the new email address being changed to
     */
    @Async
    public void sendEmailChangeNotificationToOldEmail(User user, String newEmail) {
        try {
            String emailBody = buildEmailChangeNotificationEmail(user, newEmail);

            CreateEmailOptions params = CreateEmailOptions.builder()
                    .from(fromEmail)
                    .to(user.getEmail())
                    .replyTo(replyTo)
                    .subject("Email Change Request - RivalPicks")
                    .html(emailBody)
                    .build();

            CreateEmailResponse response = resend.emails().send(params);
            logger.info("Email change notification sent to old email: {}, email ID: {}", user.getEmail(), response.getId());

        } catch (ResendException e) {
            logger.error("Failed to send email change notification to old email: {}", user.getEmail(), e);
            // Don't throw - this is just a notification
        }
    }

    /**
     * Send password reset email to user.
     * Uses @Async to avoid blocking the main thread.
     *
     * @param user        the user requesting password reset
     * @param resetToken  the password reset token
     * @param frontendUrl the frontend URL for the reset link
     */
    @Async
    public void sendPasswordResetEmail(User user, String resetToken, String frontendUrl) {
        try {
            // Use deep link for mobile app (rivalpicks://auth/reset-password?token=...)
            String resetLink = frontendUrl + "/auth/reset-password?token=" + resetToken;
            String emailBody = buildPasswordResetEmail(user, resetLink);

            CreateEmailOptions params = CreateEmailOptions.builder()
                    .from(fromEmail)
                    .to(user.getEmail())
                    .replyTo(replyTo)
                    .subject("Reset Your Password - RivalPicks")
                    .html(emailBody)
                    .build();

            CreateEmailResponse response = resend.emails().send(params);
            logger.info("Password reset email sent successfully to user: {}, email ID: {}", user.getUsername(), response.getId());

        } catch (ResendException e) {
            logger.error("Failed to send password reset email to user: {}", user.getUsername(), e);
            // Don't throw - the token is still created and user can retry
        }
    }

    /**
     * Build HTML email body for password reset.
     */
    private String buildPasswordResetEmail(User user, String resetLink) {
        StringBuilder html = new StringBuilder();
        html.append("<!DOCTYPE html>");
        html.append("<html>");
        html.append("<head><meta charset='UTF-8'></head>");
        html.append("<body style='font-family: Arial, sans-serif; line-height: 1.6; color: #333;'>");
        html.append("<div style='max-width: 600px; margin: 0 auto; padding: 20px;'>");

        // Header
        html.append("<div style='background-color: #00D4AA; padding: 20px; border-radius: 8px 8px 0 0;'>");
        html.append("<h2 style='margin: 0; color: #000;'>Password Reset Request</h2>");
        html.append("</div>");

        // Content
        html.append("<div style='background-color: #f9f9f9; padding: 20px; border: 1px solid #ddd;'>");

        String displayName = user.getFirstName() != null ? user.getFirstName() : user.getUsername();
        html.append("<p>Hi ").append(displayName).append(",</p>");

        html.append("<p>We received a request to reset your password for your RivalPicks account.</p>");

        html.append("<p>Click the button below to reset your password:</p>");

        // Reset button
        html.append("<div style='text-align: center; margin: 30px 0;'>");
        html.append("<a href='").append(resetLink).append("' ");
        html.append("style='background-color: #00D4AA; color: #000; padding: 15px 30px; ");
        html.append("text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;'>");
        html.append("Reset Password</a>");
        html.append("</div>");

        html.append("<p style='color: #666; font-size: 14px;'>");
        html.append("This link will expire in <strong>1 hour</strong> for security reasons.");
        html.append("</p>");

        html.append("<p style='color: #666; font-size: 14px;'>");
        html.append("If you didn't request this password reset, you can safely ignore this email. ");
        html.append("Your password will remain unchanged.");
        html.append("</p>");

        html.append("<hr style='border: none; border-top: 1px solid #ddd; margin: 20px 0;'>");

        html.append("<p style='color: #999; font-size: 12px;'>");
        html.append("If the button doesn't work, copy and paste this link into your browser:<br>");
        html.append("<a href='").append(resetLink).append("' style='color: #00D4AA; word-break: break-all;'>");
        html.append(resetLink).append("</a>");
        html.append("</p>");

        html.append("</div>");

        // Footer
        html.append("<div style='background-color: #333; color: #fff; padding: 15px; border-radius: 0 0 8px 8px; text-align: center; font-size: 12px;'>");
        html.append("RivalPicks - Bet With Friends");
        html.append("</div>");

        html.append("</div>");
        html.append("</body>");
        html.append("</html>");

        return html.toString();
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
        html.append("RivalPicks Support System");
        html.append("</div>");

        html.append("</div>");
        html.append("</body>");
        html.append("</html>");

        return html.toString();
    }

    /**
     * Build HTML email body for email change verification (sent to new email).
     */
    private String buildEmailChangeVerificationEmail(User user, String newEmail, String verifyLink) {
        StringBuilder html = new StringBuilder();
        html.append("<!DOCTYPE html>");
        html.append("<html>");
        html.append("<head><meta charset='UTF-8'></head>");
        html.append("<body style='font-family: Arial, sans-serif; line-height: 1.6; color: #333;'>");
        html.append("<div style='max-width: 600px; margin: 0 auto; padding: 20px;'>");

        // Header
        html.append("<div style='background-color: #00D4AA; padding: 20px; border-radius: 8px 8px 0 0;'>");
        html.append("<h2 style='margin: 0; color: #000;'>Verify Your New Email</h2>");
        html.append("</div>");

        // Content
        html.append("<div style='background-color: #f9f9f9; padding: 20px; border: 1px solid #ddd;'>");

        String displayName = user.getFirstName() != null ? user.getFirstName() : user.getUsername();
        html.append("<p>Hi ").append(displayName).append(",</p>");

        html.append("<p>You requested to change your email address on your RivalPicks account to:</p>");
        html.append("<p style='background-color: #e8f5e9; padding: 10px; border-radius: 4px; font-weight: bold;'>");
        html.append(newEmail).append("</p>");

        html.append("<p>Click the button below to verify this email address:</p>");

        // Verify button
        html.append("<div style='text-align: center; margin: 30px 0;'>");
        html.append("<a href='").append(verifyLink).append("' ");
        html.append("style='background-color: #00D4AA; color: #000; padding: 15px 30px; ");
        html.append("text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;'>");
        html.append("Verify Email</a>");
        html.append("</div>");

        html.append("<p style='color: #666; font-size: 14px;'>");
        html.append("This link will expire in <strong>24 hours</strong>.");
        html.append("</p>");

        html.append("<p style='color: #666; font-size: 14px;'>");
        html.append("If you didn't request this change, you can safely ignore this email. ");
        html.append("Your email address will not be changed.");
        html.append("</p>");

        html.append("<hr style='border: none; border-top: 1px solid #ddd; margin: 20px 0;'>");

        html.append("<p style='color: #999; font-size: 12px;'>");
        html.append("If the button doesn't work, copy and paste this link into your browser:<br>");
        html.append("<a href='").append(verifyLink).append("' style='color: #00D4AA; word-break: break-all;'>");
        html.append(verifyLink).append("</a>");
        html.append("</p>");

        html.append("</div>");

        // Footer
        html.append("<div style='background-color: #333; color: #fff; padding: 15px; border-radius: 0 0 8px 8px; text-align: center; font-size: 12px;'>");
        html.append("RivalPicks - Bet With Friends");
        html.append("</div>");

        html.append("</div>");
        html.append("</body>");
        html.append("</html>");

        return html.toString();
    }

    /**
     * Build HTML email body for email change notification (sent to old email).
     */
    private String buildEmailChangeNotificationEmail(User user, String newEmail) {
        StringBuilder html = new StringBuilder();
        html.append("<!DOCTYPE html>");
        html.append("<html>");
        html.append("<head><meta charset='UTF-8'></head>");
        html.append("<body style='font-family: Arial, sans-serif; line-height: 1.6; color: #333;'>");
        html.append("<div style='max-width: 600px; margin: 0 auto; padding: 20px;'>");

        // Header
        html.append("<div style='background-color: #FFA726; padding: 20px; border-radius: 8px 8px 0 0;'>");
        html.append("<h2 style='margin: 0; color: #000;'>Email Change Request</h2>");
        html.append("</div>");

        // Content
        html.append("<div style='background-color: #f9f9f9; padding: 20px; border: 1px solid #ddd;'>");

        String displayName = user.getFirstName() != null ? user.getFirstName() : user.getUsername();
        html.append("<p>Hi ").append(displayName).append(",</p>");

        html.append("<p>We received a request to change the email address associated with your RivalPicks account.</p>");

        html.append("<p><strong>Current email:</strong> ").append(user.getEmail()).append("</p>");
        html.append("<p><strong>New email requested:</strong> ").append(newEmail).append("</p>");

        html.append("<p style='background-color: #fff3e0; padding: 15px; border-radius: 4px; border-left: 4px solid #FFA726;'>");
        html.append("<strong>Important:</strong> If you did not request this change, please secure your account immediately by ");
        html.append("changing your password. Someone may have access to your account.");
        html.append("</p>");

        html.append("<p style='color: #666; font-size: 14px;'>");
        html.append("The email change will only take effect if the new email address is verified.");
        html.append("</p>");

        html.append("</div>");

        // Footer
        html.append("<div style='background-color: #333; color: #fff; padding: 15px; border-radius: 0 0 8px 8px; text-align: center; font-size: 12px;'>");
        html.append("RivalPicks - Bet With Friends");
        html.append("</div>");

        html.append("</div>");
        html.append("</body>");
        html.append("</html>");

        return html.toString();
    }
}
