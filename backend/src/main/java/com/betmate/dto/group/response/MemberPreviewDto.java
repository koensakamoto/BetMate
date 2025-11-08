package com.betmate.dto.group.response;

/**
 * Lightweight DTO for member preview information.
 * Used to show member avatars in group cards/lists.
 */
public class MemberPreviewDto {

    private Long id;
    private String username;
    private String firstName;
    private String lastName;
    private String profileImageUrl;

    // Constructors
    public MemberPreviewDto() {}

    public MemberPreviewDto(Long id, String username, String firstName, String lastName, String profileImageUrl) {
        this.id = id;
        this.username = username;
        this.firstName = firstName;
        this.lastName = lastName;
        this.profileImageUrl = profileImageUrl;
    }

    // Getters and setters
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getUsername() {
        return username;
    }

    public void setUsername(String username) {
        this.username = username;
    }

    public String getFirstName() {
        return firstName;
    }

    public void setFirstName(String firstName) {
        this.firstName = firstName;
    }

    public String getLastName() {
        return lastName;
    }

    public void setLastName(String lastName) {
        this.lastName = lastName;
    }

    public String getProfileImageUrl() {
        return profileImageUrl;
    }

    public void setProfileImageUrl(String profileImageUrl) {
        this.profileImageUrl = profileImageUrl;
    }
}
