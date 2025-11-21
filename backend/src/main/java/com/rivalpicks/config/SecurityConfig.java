package com.rivalpicks.config;

import com.rivalpicks.security.JwtAuthenticationFilter;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.AuthenticationProvider;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.List;

import lombok.extern.slf4j.Slf4j;

/**
 * Security configuration for JWT-based authentication.
 */
@Slf4j
@Configuration
@EnableWebSecurity
@EnableMethodSecurity
public class SecurityConfig {

    // Public endpoint constants for better maintainability
    private static final String[] PUBLIC_AUTH_ENDPOINTS = {
        "/api/auth/login",
        "/api/auth/refresh",
        "/api/auth/logout"
        // Note: /api/auth/me and /api/auth/change-password require authentication and are NOT in this list
    };
    
    private static final String[] PUBLIC_USER_ENDPOINTS = {
        "/api/users/register",
        "/api/users/availability/**",
        "/api/users/availability/validate"
    };
    
    private static final String[] PUBLIC_HEALTH_ENDPOINTS = {
        "/actuator/health",
        "/actuator/info"
    };
    
    private static final String[] PUBLIC_DOCS_ENDPOINTS = {
        "/swagger-ui/**",
        "/v3/api-docs/**"
    };
    
    private static final String[] PUBLIC_GROUP_ENDPOINTS = {
        "/api/groups/public",
        "/api/groups/search"
    };
    
    private static final String[] PUBLIC_WEBSOCKET_ENDPOINTS = {
        "/ws/**"
    };

    private static final String[] PUBLIC_FILE_ENDPOINTS = {
        "/api/files/**"
    };

    
    // BCrypt strength - explicitly set to 12 for stronger hashing
    private static final int BCRYPT_STRENGTH = 12;

    private final JwtAuthenticationFilter jwtAuthFilter;

    @Autowired
    public SecurityConfig(JwtAuthenticationFilter jwtAuthFilter) {
        this.jwtAuthFilter = jwtAuthFilter;
        log.info("SecurityConfig initialized with JWT authentication filter");
        log.info("BCrypt password encoder strength set to: {}", BCRYPT_STRENGTH);
        log.debug("Public endpoints configured: Auth={}, User={}, Health={}, Docs={}, Groups={}, WebSocket={}, Files={}",
                 PUBLIC_AUTH_ENDPOINTS.length, PUBLIC_USER_ENDPOINTS.length,
                 PUBLIC_HEALTH_ENDPOINTS.length, PUBLIC_DOCS_ENDPOINTS.length, PUBLIC_GROUP_ENDPOINTS.length,
                 PUBLIC_WEBSOCKET_ENDPOINTS.length, PUBLIC_FILE_ENDPOINTS.length);
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http, 
                                                   AuthenticationProvider authenticationProvider) throws Exception {
        log.info("Configuring SecurityFilterChain with JWT authentication");
        log.debug("Authentication provider type: {}", authenticationProvider.getClass().getSimpleName());
        
        http
            .csrf(AbstractHttpConfigurer::disable)
            .cors(cors -> cors.configurationSource(corsConfigurationSource()))
            .authorizeHttpRequests(authz -> authz
                // Public endpoints - no authentication required
                .requestMatchers(PUBLIC_AUTH_ENDPOINTS).permitAll()
                .requestMatchers(PUBLIC_USER_ENDPOINTS).permitAll()
                .requestMatchers(PUBLIC_HEALTH_ENDPOINTS).permitAll()
                .requestMatchers(PUBLIC_DOCS_ENDPOINTS).permitAll()
                .requestMatchers(PUBLIC_GROUP_ENDPOINTS).permitAll()
                .requestMatchers(PUBLIC_WEBSOCKET_ENDPOINTS).permitAll()
                .requestMatchers(PUBLIC_FILE_ENDPOINTS).permitAll()

                // All other endpoints require authentication
                .anyRequest().authenticated()
            )
            .sessionManagement(session -> session
                .sessionCreationPolicy(SessionCreationPolicy.STATELESS)
            )
            .headers(headers -> headers
                // Prevent clickjacking attacks
                .frameOptions(frameOptions -> frameOptions.deny())
                
                // Prevent MIME type sniffing
                .contentTypeOptions(contentTypeOptions -> {})
                
                // Content Security Policy - restrict resource loading
                .contentSecurityPolicy(csp -> csp
                    .policyDirectives("default-src 'self'; " +
                                    "script-src 'self' 'unsafe-inline' 'unsafe-eval'; " +
                                    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; " +
                                    "font-src 'self' https://fonts.gstatic.com; " +
                                    "img-src 'self' data: https:; " +
                                    "connect-src 'self'; " +
                                    "frame-src 'none'; " +
                                    "object-src 'none'; " +
                                    "base-uri 'self'; " +
                                    "form-action 'self'")
                )
                
                // Referrer Policy - control referrer information
                .referrerPolicy(referrerPolicy -> referrerPolicy
                    .policy(org.springframework.security.web.header.writers.ReferrerPolicyHeaderWriter.ReferrerPolicy.STRICT_ORIGIN_WHEN_CROSS_ORIGIN)
                )
                
                // HTTP Strict Transport Security - enforce HTTPS
                .httpStrictTransportSecurity(hstsConfig -> hstsConfig
                    .maxAgeInSeconds(31536000) // 1 year
                    .includeSubDomains(true)
                )
                
                // Custom security headers
                .addHeaderWriter((request, response) -> {
                    // Permissions Policy (formerly Feature Policy)
                    response.setHeader("Permissions-Policy", 
                        "geolocation=(), " +
                        "microphone=(), " +
                        "camera=(), " +
                        "payment=(), " +
                        "usb=(), " +
                        "magnetometer=(), " +
                        "gyroscope=(), " +
                        "speaker=()");
                    
                    // X-Permitted-Cross-Domain-Policies
                    response.setHeader("X-Permitted-Cross-Domain-Policies", "none");
                    
                    // Cache-Control for sensitive responses
                    if (request.getRequestURI().startsWith("/api/")) {
                        response.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
                        response.setHeader("Pragma", "no-cache");
                        response.setHeader("Expires", "0");
                    }
                })
            )
            .authenticationProvider(authenticationProvider)
            .addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class);

        SecurityFilterChain filterChain = http.build();
        log.info("SecurityFilterChain successfully configured with {} public endpoint groups", 7);
        log.info("Security headers configured: CSP, HSTS, X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy");
        log.debug("JWT filter added before UsernamePasswordAuthenticationFilter");
        return filterChain;
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        configuration.setAllowedOriginPatterns(List.of("*"));
        configuration.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "OPTIONS"));
        configuration.setAllowedHeaders(List.of("*"));
        configuration.setAllowCredentials(true);
        
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }

    @Bean
    public DaoAuthenticationProvider authenticationProvider(UserDetailsService userDetailsService,
                                                           PasswordEncoder passwordEncoder) {
        log.info("Initializing DaoAuthenticationProvider");
        log.debug("UserDetailsService implementation: {}", userDetailsService.getClass().getSimpleName());
        log.debug("PasswordEncoder implementation: {}", passwordEncoder.getClass().getSimpleName());
        
        DaoAuthenticationProvider provider = new DaoAuthenticationProvider();
        provider.setUserDetailsService(userDetailsService);
        provider.setPasswordEncoder(passwordEncoder);
        
        log.info("DaoAuthenticationProvider successfully configured");
        return provider;
    }

    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration config) throws Exception {
        return config.getAuthenticationManager();
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder(BCRYPT_STRENGTH);
    }
}