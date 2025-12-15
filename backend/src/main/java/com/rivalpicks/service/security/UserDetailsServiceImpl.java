package com.rivalpicks.service.security;

import com.rivalpicks.entity.user.User;
import com.rivalpicks.service.user.UserService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

/**
 * UserDetailsService implementation for Spring Security authentication.
 */
@Service
public class UserDetailsServiceImpl implements UserDetailsService {

    private static final Logger log = LoggerFactory.getLogger(UserDetailsServiceImpl.class);
    private final UserService userService;

    public UserDetailsServiceImpl(UserService userService) {
        this.userService = userService;
    }

    @Override
    public UserDetails loadUserByUsername(String usernameOrEmail) throws UsernameNotFoundException {
        if (!StringUtils.hasText(usernameOrEmail)) {
            log.warn("Authentication attempt with empty username/email");
            throw new UsernameNotFoundException("Username cannot be empty");
        }

        log.debug("Loading user details for: {}", usernameOrEmail);
        
        Optional<User> userOpt = userService.getUserByUsernameOrEmail(usernameOrEmail);
        
        if (userOpt.isEmpty()) {
            log.warn("Authentication failed: User not found for identifier: {}", usernameOrEmail);
            // Use generic message to prevent username enumeration
            throw new UsernameNotFoundException("Authentication failed");
        }
        
        User user = userOpt.get();
        
        // SECURITY: For inactive/locked accounts, return UserDetails with proper flags
        // This prevents username enumeration while still blocking authentication
        log.debug("User found: {} (Active: {}, Locked: {})", user.getUsername(), user.isActiveUser(), user.isAccountLocked());
        
        if (!user.isActiveUser()) {
            log.warn("Authentication blocked: Inactive account for user: {}", user.getUsername());
        }
        
        if (user.isAccountLocked()) {
            log.warn("Authentication blocked: Locked account for user: {}", user.getUsername());
        }
        
        return new UserPrincipal(user);
    }

    /**
     * Custom UserDetails implementation that includes user ID.
     */
    public static class UserPrincipal implements UserDetails {
        private final User user;

        public UserPrincipal(User user) {
            this.user = user;
        }

        public Long getUserId() {
            return user.getId();
        }

        public User getUser() {
            return user;
        }

        @Override
        public String getUsername() {
            return user.getUsername();
        }

        @Override
        public String getPassword() {
            // Handle null passwords safely
            String password = user.getPasswordHash();
            return password != null ? password : "";
        }

        @Override
        public List<SimpleGrantedAuthority> getAuthorities() {
            List<SimpleGrantedAuthority> authorities = new ArrayList<>();

            // Add role-based authority (e.g., ROLE_USER or ROLE_ADMIN)
            if (user.getRole() != null) {
                authorities.add(new SimpleGrantedAuthority("ROLE_" + user.getRole().name()));
            } else {
                // Default to USER if role is null
                authorities.add(new SimpleGrantedAuthority("ROLE_USER"));
            }

            return authorities;
        }

        @Override
        public boolean isAccountNonExpired() {
            return true;
        }

        @Override
        public boolean isAccountNonLocked() {
            return !user.isAccountLocked();
        }

        @Override
        public boolean isCredentialsNonExpired() {
            return true;
        }

        @Override
        public boolean isEnabled() {
            return user.isActiveUser();
        }
    }
}