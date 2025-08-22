package com.circlebet.service.security;

import com.circlebet.entity.user.User;
import com.circlebet.service.user.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

/**
 * UserDetailsService implementation for Spring Security authentication.
 */
@Service
public class UserDetailsServiceImpl implements UserDetailsService {

    private final UserService userService;

    @Autowired
    public UserDetailsServiceImpl(UserService userService) {
        this.userService = userService;
    }

    @Override
    public UserDetails loadUserByUsername(String usernameOrEmail) throws UsernameNotFoundException {
        // Try to find user by username first, then by email
        Optional<User> userOpt = userService.getUserByUsername(usernameOrEmail);
        if (userOpt.isEmpty()) {
            userOpt = userService.getUserByEmail(usernameOrEmail);
        }

        User user = userOpt.orElseThrow(() -> 
            new UsernameNotFoundException("User not found: " + usernameOrEmail));

        // Check if user is active
        if (!user.isActiveUser()) {
            throw new UsernameNotFoundException("User account is inactive: " + usernameOrEmail);
        }

        // Check if account is locked
        if (user.isAccountLocked()) {
            throw new UsernameNotFoundException("User account is locked: " + usernameOrEmail);
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
            return user.getPasswordHash();
        }

        @Override
        public List<SimpleGrantedAuthority> getAuthorities() {
            // For now, all users have ROLE_USER
            // You can extend this to support different roles
            return List.of(new SimpleGrantedAuthority("ROLE_USER"));
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