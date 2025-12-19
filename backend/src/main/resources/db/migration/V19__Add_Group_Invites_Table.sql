-- Create group_invites table for invite link functionality
CREATE TABLE group_invites (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    token VARCHAR(36) NOT NULL UNIQUE,
    group_id BIGINT NOT NULL,
    created_by_id BIGINT NOT NULL,
    expires_at DATETIME NULL,
    max_uses INT NULL,
    use_count INT NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at DATETIME NOT NULL,

    CONSTRAINT fk_group_invite_group FOREIGN KEY (group_id) REFERENCES `groups`(id) ON DELETE CASCADE,
    CONSTRAINT fk_group_invite_user FOREIGN KEY (created_by_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Add indexes for performance
CREATE INDEX idx_group_invite_token ON group_invites(token);
CREATE INDEX idx_group_invite_group ON group_invites(group_id);
CREATE INDEX idx_group_invite_created_by ON group_invites(created_by_id);
CREATE INDEX idx_group_invite_expires ON group_invites(expires_at);
