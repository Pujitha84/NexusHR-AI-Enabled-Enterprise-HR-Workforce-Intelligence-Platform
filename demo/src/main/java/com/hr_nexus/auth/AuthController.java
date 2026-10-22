
package com.hr_nexus.auth;

import java.util.LinkedHashMap;
import java.util.Map;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpSession;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthenticationManager authenticationManager;
    private final AppUserRepository appUserRepository;

    public AuthController(
            AuthenticationManager authenticationManager,
            AppUserRepository appUserRepository) {
        this.authenticationManager = authenticationManager;
        this.appUserRepository = appUserRepository;
    }

    public record LoginRequest(String email, String password) {}

    @PostMapping("/login")
    public ResponseEntity<Map<String, Object>> login(
            @RequestBody LoginRequest request,
            HttpServletRequest httpRequest) {

        try {
            Authentication authentication =
                    authenticationManager.authenticate(
                            new UsernamePasswordAuthenticationToken(
                                    request.email(), request.password()));

            SecurityContextHolder.getContext()
                    .setAuthentication(authentication);

            HttpSession session = httpRequest.getSession(true);
            session.setAttribute(
                    "SPRING_SECURITY_CONTEXT",
                    SecurityContextHolder.getContext());

            AppUser user = appUserRepository.findByEmail(request.email())
                    .orElseThrow();

            Map<String, Object> response = new LinkedHashMap<>();
            response.put("email", user.getEmail());
            response.put("role", user.getRole());
            response.put("employeeId", user.getEmployeeId());

            return ResponseEntity.ok(response);

        } catch (AuthenticationException ex) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("message",
                            "Invalid email or password."));
        }
    }

    @GetMapping("/me")
    public ResponseEntity<Map<String, Object>> me(
            Authentication authentication) {

        if (authentication == null
                || !authentication.isAuthenticated()
                || authentication.getPrincipal() instanceof String) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("message", "Not logged in."));
        }

        String email = authentication.getName();

        return appUserRepository.findByEmail(email)
                .map(user -> {
                    Map<String, Object> response =
                            new LinkedHashMap<>();
                    response.put("email", user.getEmail());
                    response.put("role", user.getRole());
                    response.put("employeeId", user.getEmployeeId());
                    return ResponseEntity.ok(response);
                })
                .orElseGet(() -> ResponseEntity.status(
                        HttpStatus.UNAUTHORIZED).body(
                                Map.of("message",
                                        "Account not found.")));
    }

    @PostMapping("/logout")
    public ResponseEntity<Map<String, String>> logout(
            HttpServletRequest request) {

        SecurityContextHolder.clearContext();

        HttpSession session = request.getSession(false);
        if (session != null) {
            session.invalidate();
        }

        return ResponseEntity.ok(
                Map.of("message", "Logged out successfully."));
    }
}
