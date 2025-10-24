package com.betmate.service.security;

import com.betmate.entity.user.User;
import com.betmate.service.user.UserService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UsernameNotFoundException;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class UserDetailsServiceImplTest {

    @Mock
    private UserService userService;

    @InjectMocks
    private UserDetailsServiceImpl userDetailsService;

    private User activeUser;
    private User inactiveUser;
    private User lockedUser;

    @BeforeEach
    void setUp() {
        // Active user
        activeUser = new User();
        activeUser.setId(1L);
        activeUser.setUsername("activeuser");
        activeUser.setEmail("active@test.com");
        activeUser.setPasswordHash("$2a$10$hashedPassword");
        activeUser.setIsActive(true);
        activeUser.setFailedLoginAttempts(0);
        activeUser.setAccountLockedUntil(null);

        // Inactive user
        inactiveUser = new User();
        inactiveUser.setId(2L);
        inactiveUser.setUsername("inactiveuser");
        inactiveUser.setEmail("inactive@test.com");
        inactiveUser.setPasswordHash("$2a$10$hashedPassword");
        inactiveUser.setIsActive(false);
        inactiveUser.setFailedLoginAttempts(0);
        inactiveUser.setAccountLockedUntil(null);

        // Locked user
        lockedUser = new User();
        lockedUser.setId(3L);
        lockedUser.setUsername("lockeduser");
        lockedUser.setEmail("locked@test.com");
        lockedUser.setPasswordHash("$2a$10$hashedPassword");
        lockedUser.setIsActive(true);
        lockedUser.setFailedLoginAttempts(5);
        lockedUser.setAccountLockedUntil(LocalDateTime.now().plusMinutes(15));
    }

    // ===== loadUserByUsername Tests =====

    @Test
    @DisplayName("Should successfully load active user by username")
    void loadUserByUsername_ActiveUser_Success() {
        when(userService.getUserByUsernameOrEmail("activeuser")).thenReturn(Optional.of(activeUser));

        UserDetails userDetails = userDetailsService.loadUserByUsername("activeuser");

        assertNotNull(userDetails);
        assertEquals("activeuser", userDetails.getUsername());
        assertEquals("$2a$10$hashedPassword", userDetails.getPassword());
        assertTrue(userDetails.isEnabled());
        assertTrue(userDetails.isAccountNonLocked());
        assertTrue(userDetails.isAccountNonExpired());
        assertTrue(userDetails.isCredentialsNonExpired());
    }

    @Test
    @DisplayName("Should successfully load active user by email")
    void loadUserByUsername_ActiveUserByEmail_Success() {
        when(userService.getUserByUsernameOrEmail("active@test.com")).thenReturn(Optional.of(activeUser));

        UserDetails userDetails = userDetailsService.loadUserByUsername("active@test.com");

        assertNotNull(userDetails);
        assertEquals("activeuser", userDetails.getUsername());
        assertEquals("$2a$10$hashedPassword", userDetails.getPassword());
        assertTrue(userDetails.isEnabled());
        assertTrue(userDetails.isAccountNonLocked());
    }

    @Test
    @DisplayName("Should load inactive user but mark as disabled")
    void loadUserByUsername_InactiveUser_DisabledUserDetails() {
        when(userService.getUserByUsernameOrEmail("inactiveuser")).thenReturn(Optional.of(inactiveUser));

        UserDetails userDetails = userDetailsService.loadUserByUsername("inactiveuser");

        assertNotNull(userDetails);
        assertEquals("inactiveuser", userDetails.getUsername());
        assertFalse(userDetails.isEnabled()); // Should be disabled
        assertTrue(userDetails.isAccountNonLocked());
        assertTrue(userDetails.isAccountNonExpired());
        assertTrue(userDetails.isCredentialsNonExpired());
    }

    @Test
    @DisplayName("Should load locked user but mark as locked")
    void loadUserByUsername_LockedUser_LockedUserDetails() {
        when(userService.getUserByUsernameOrEmail("lockeduser")).thenReturn(Optional.of(lockedUser));

        UserDetails userDetails = userDetailsService.loadUserByUsername("lockeduser");

        assertNotNull(userDetails);
        assertEquals("lockeduser", userDetails.getUsername());
        assertTrue(userDetails.isEnabled());
        assertFalse(userDetails.isAccountNonLocked()); // Should be locked
        assertTrue(userDetails.isAccountNonExpired());
        assertTrue(userDetails.isCredentialsNonExpired());
    }

    @Test
    @DisplayName("Should throw UsernameNotFoundException when user not found")
    void loadUserByUsername_UserNotFound_ThrowsException() {
        when(userService.getUserByUsernameOrEmail("nonexistent")).thenReturn(Optional.empty());

        UsernameNotFoundException exception = assertThrows(UsernameNotFoundException.class, () ->
            userDetailsService.loadUserByUsername("nonexistent"));

        assertEquals("Authentication failed", exception.getMessage());
    }

    @Test
    @DisplayName("Should throw UsernameNotFoundException when username is empty")
    void loadUserByUsername_EmptyUsername_ThrowsException() {
        UsernameNotFoundException exception = assertThrows(UsernameNotFoundException.class, () ->
            userDetailsService.loadUserByUsername(""));

        assertEquals("Username cannot be empty", exception.getMessage());
        verify(userService, never()).getUserByUsernameOrEmail(anyString());
    }

    @Test
    @DisplayName("Should throw UsernameNotFoundException when username is null")
    void loadUserByUsername_NullUsername_ThrowsException() {
        UsernameNotFoundException exception = assertThrows(UsernameNotFoundException.class, () ->
            userDetailsService.loadUserByUsername(null));

        assertEquals("Username cannot be empty", exception.getMessage());
        verify(userService, never()).getUserByUsernameOrEmail(anyString());
    }

    @Test
    @DisplayName("Should throw UsernameNotFoundException when username is whitespace only")
    void loadUserByUsername_WhitespaceUsername_ThrowsException() {
        UsernameNotFoundException exception = assertThrows(UsernameNotFoundException.class, () ->
            userDetailsService.loadUserByUsername("   "));

        assertEquals("Username cannot be empty", exception.getMessage());
        verify(userService, never()).getUserByUsernameOrEmail(anyString());
    }

    // ===== UserPrincipal Tests =====

    @Test
    @DisplayName("Should create UserPrincipal with correct user data")
    void userPrincipal_CreatedCorrectly() {
        UserDetailsServiceImpl.UserPrincipal userPrincipal = 
            new UserDetailsServiceImpl.UserPrincipal(activeUser);

        assertEquals(1L, userPrincipal.getUserId());
        assertEquals("activeuser", userPrincipal.getUsername());
        assertEquals("$2a$10$hashedPassword", userPrincipal.getPassword());
        assertEquals(activeUser, userPrincipal.getUser());
    }

    @Test
    @DisplayName("Should handle null password gracefully")
    void userPrincipal_NullPassword_ReturnsEmptyString() {
        User userWithNullPassword = new User();
        userWithNullPassword.setUsername("testuser");
        userWithNullPassword.setPasswordHash(null);

        UserDetailsServiceImpl.UserPrincipal userPrincipal = 
            new UserDetailsServiceImpl.UserPrincipal(userWithNullPassword);

        assertEquals("", userPrincipal.getPassword());
    }

    @Test
    @DisplayName("Should return empty authorities list")
    void userPrincipal_GetAuthorities_ReturnsEmptyList() {
        UserDetailsServiceImpl.UserPrincipal userPrincipal = 
            new UserDetailsServiceImpl.UserPrincipal(activeUser);

        List<SimpleGrantedAuthority> authorities = userPrincipal.getAuthorities();

        assertNotNull(authorities);
        assertTrue(authorities.isEmpty());
    }

    @Test
    @DisplayName("Should return correct account status flags")
    void userPrincipal_AccountStatusFlags() {
        // Test active user
        UserDetailsServiceImpl.UserPrincipal activePrincipal = 
            new UserDetailsServiceImpl.UserPrincipal(activeUser);

        assertTrue(activePrincipal.isEnabled());
        assertTrue(activePrincipal.isAccountNonLocked());
        assertTrue(activePrincipal.isAccountNonExpired());
        assertTrue(activePrincipal.isCredentialsNonExpired());

        // Test inactive user
        UserDetailsServiceImpl.UserPrincipal inactivePrincipal = 
            new UserDetailsServiceImpl.UserPrincipal(inactiveUser);

        assertFalse(inactivePrincipal.isEnabled());
        assertTrue(inactivePrincipal.isAccountNonLocked());

        // Test locked user
        UserDetailsServiceImpl.UserPrincipal lockedPrincipal = 
            new UserDetailsServiceImpl.UserPrincipal(lockedUser);

        assertTrue(lockedPrincipal.isEnabled());
        assertFalse(lockedPrincipal.isAccountNonLocked());
    }

    // ===== Edge Cases =====

    @Test
    @DisplayName("Should handle user with very long username")
    void loadUserByUsername_LongUsername_Success() {
        String longUsername = "a".repeat(100);
        User userWithLongName = new User();
        userWithLongName.setUsername(longUsername);
        userWithLongName.setPasswordHash("$2a$10$hashedPassword");
        userWithLongName.setIsActive(true);
        userWithLongName.setFailedLoginAttempts(0);

        when(userService.getUserByUsernameOrEmail(longUsername)).thenReturn(Optional.of(userWithLongName));

        UserDetails userDetails = userDetailsService.loadUserByUsername(longUsername);

        assertNotNull(userDetails);
        assertEquals(longUsername, userDetails.getUsername());
    }

    @Test
    @DisplayName("Should handle user with special characters in username")
    void loadUserByUsername_SpecialCharacters_Success() {
        String specialUsername = "test.user_123";
        User userWithSpecialChars = new User();
        userWithSpecialChars.setUsername(specialUsername);
        userWithSpecialChars.setPasswordHash("$2a$10$hashedPassword");
        userWithSpecialChars.setIsActive(true);
        userWithSpecialChars.setFailedLoginAttempts(0);

        when(userService.getUserByUsernameOrEmail(specialUsername)).thenReturn(Optional.of(userWithSpecialChars));

        UserDetails userDetails = userDetailsService.loadUserByUsername(specialUsername);

        assertNotNull(userDetails);
        assertEquals(specialUsername, userDetails.getUsername());
    }
}