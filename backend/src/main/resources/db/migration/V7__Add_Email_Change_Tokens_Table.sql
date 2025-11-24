-- Create email_change_tokens table for email change verification
CREATE TABLE email_change_tokens (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    token VARCHAR(36) NOT NULL UNIQUE,
    user_id BIGINT NOT NULL,
    new_email VARCHAR(254) NOT NULL,
    expires_at DATETIME NOT NULL,
    used BOOLEAN NOT NULL DEFAULT FALSE,
    created_at DATETIME NOT NULL,
    used_at DATETIME,

    CONSTRAINT fk_email_change_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,

    INDEX idx_email_change_token (token),
    INDEX idx_email_change_user (user_id),
    INDEX idx_email_change_expires (expires_at)
);
