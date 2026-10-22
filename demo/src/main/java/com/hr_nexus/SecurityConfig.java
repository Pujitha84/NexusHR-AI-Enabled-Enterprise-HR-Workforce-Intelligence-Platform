
package com.hr_nexus;

import com.hr_nexus.auth.CustomUserDetailsService;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;

@Configuration
public class SecurityConfig {

    @Bean
    public AuthenticationManager authenticationManager(
            AuthenticationConfiguration configuration) throws Exception {
        return configuration.getAuthenticationManager();
    }

    @Bean
    public SecurityFilterChain securityFilterChain(
            HttpSecurity http,
            CustomUserDetailsService userDetailsService,
            PasswordEncoder passwordEncoder) throws Exception {

        http
            .csrf(csrf -> csrf.disable())
            .userDetailsService(userDetailsService)
            .authorizeHttpRequests(auth -> auth
    .requestMatchers("/", "/error", "/api/auth/login").permitAll()
    .requestMatchers(org.springframework.http.HttpMethod.OPTIONS, "/**").permitAll()
    .requestMatchers("/api/employees/**").hasRole("HR")
    .requestMatchers("/api/leaves/**").hasAnyRole("HR", "EMPLOYEE")
    .requestMatchers("/api/attendance/**").hasRole("HR")
    .requestMatchers("/api/payroll/**").hasRole("HR")     // NEW
    .requestMatchers("/api/ops/**").hasRole("HR")         // NEW
    .requestMatchers("/api/insights/**").hasRole("HR")    // NEW
    .anyRequest().authenticated()
)
            .httpBasic(basic -> {})
            .formLogin(form -> form.disable());

        return http.build();
    }
}
