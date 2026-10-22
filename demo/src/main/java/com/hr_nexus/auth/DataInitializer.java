
package com.hr_nexus.auth;

import org.springframework.boot.ApplicationRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.password.PasswordEncoder;

@Configuration
public class DataInitializer {

    @Bean
    public ApplicationRunner initializeHrAccount(
            AppUserRepository appUserRepository,
            PasswordEncoder passwordEncoder,
            org.springframework.core.env.Environment environment) {

        return args -> {
            String email = environment.getProperty("HR_EMAIL");
            String password = environment.getProperty("HR_PASSWORD");
            boolean resetExisting = Boolean.parseBoolean(
                    environment.getProperty("HR_RESET_PASSWORD", "false"));

            if (email == null || email.isBlank()
                    || password == null || password.isBlank()) {
                System.out.println(
                    "HR account not initialized: HR_EMAIL or HR_PASSWORD is missing.");
                return;
            }

            email = email.trim().toLowerCase();

            var existingUser = appUserRepository.findByEmail(email);

            if (existingUser.isPresent()) {
                if (resetExisting) {
                    AppUser hr = existingUser.get();

                    if (!"HR".equalsIgnoreCase(hr.getRole())) {
                        System.out.println(
                            "Password reset refused: account is not an HR account.");
                        return;
                    }

                    hr.setPassword(passwordEncoder.encode(password));
                    appUserRepository.save(hr);

                    System.out.println(
                        "Existing HR password reset successfully.");
                } else {
                    System.out.println(
                        "HR account already exists. Existing account was not changed.");
                }
                return;
            }

            if (resetExisting) {
                System.out.println(
                    "Password reset refused: the specified account does not exist.");
                return;
            }

            AppUser hr = new AppUser();
            hr.setEmail(email);
            hr.setPassword(passwordEncoder.encode(password));
            hr.setRole("HR");
            hr.setEmployeeId(null);

            appUserRepository.save(hr);

            System.out.println("Initial HR account created successfully.");
        };
    }
}
