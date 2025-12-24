package com.rivalpicks.dto.group.request;

import com.rivalpicks.entity.group.Group;
import jakarta.validation.constraints.*;

/**
 * Request DTO for updating group information.
 */
public class GroupUpdateRequestDto {
    
    @Size(min = 3, max = 50, message = "Group name must be between 3 and 50 characters")
    @Pattern(regexp = "^[a-zA-Z0-9\\s_-]+$", message = "Group name can only contain letters, numbers, spaces, underscores, and hyphens")
    private String groupName;
    
    @Size(max = 200, message = "Description cannot exceed 200 characters")
    private String description;
    
    @Size(max = 500, message = "Group picture URL cannot exceed 500 characters")
    private String groupPictureUrl;
    
    private Group.Privacy privacy;
    
    @Min(value = 2, message = "Maximum members must be at least 2")
    @Max(value = 1000, message = "Maximum members cannot exceed 1000")
    private Integer maxMembers;

    // Constructors
    public GroupUpdateRequestDto() {}

    public GroupUpdateRequestDto(String groupName, String description, String groupPictureUrl,
                               Group.Privacy privacy, Integer maxMembers) {
        this.groupName = groupName;
        this.description = description;
        this.groupPictureUrl = groupPictureUrl;
        this.privacy = privacy;
        this.maxMembers = maxMembers;
    }

    // Getters and setters
    public String getGroupName() {
        return groupName;
    }

    public void setGroupName(String groupName) {
        this.groupName = groupName;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public String getGroupPictureUrl() {
        return groupPictureUrl;
    }

    public void setGroupPictureUrl(String groupPictureUrl) {
        this.groupPictureUrl = groupPictureUrl;
    }

    public Group.Privacy getPrivacy() {
        return privacy;
    }

    public void setPrivacy(Group.Privacy privacy) {
        this.privacy = privacy;
    }

    public Integer getMaxMembers() {
        return maxMembers;
    }

    public void setMaxMembers(Integer maxMembers) {
        this.maxMembers = maxMembers;
    }
}