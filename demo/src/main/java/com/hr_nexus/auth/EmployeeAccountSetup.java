
package com.hr_nexus.auth;

import com.hr_nexus.employee.EmployeeRepository;
import org.springframework.boot.ApplicationRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.password.PasswordEncoder;

@Configuration
public class EmployeeAccountSetup {

    @Bean
    public ApplicationRunner createTestEmployeeAccount(
            AppUserRepository users,
            EmployeeRepository employees,
            PasswordEncoder passwordEncoder,
            org.springframework.core.env.Environment env) {

        return args -> {
            String email = env.getProperty("TEST_EMPLOYEE_EMAIL");
            String password = env.getProperty("TEST_EMPLOYEE_PASSWORD");
            String idValue = env.getProperty("TEST_EMPLOYEE_ID");

            if (email == null || email.isBlank()
                    || password == null || password.isBlank()
                    || idValue == null || idValue.isBlank()) {
                System.out.println(
                    "Test employee setup skipped: configuration is missing.");
                return;
            }

            email = email.trim().toLowerCase();
            long employeeId = Long.parseLong(idValue.trim());

            if (!employees.existsById(employeeId)) {
                System.out.println("Test employee setup failed: employee ID not found.");
                return;
            }

            if (users.existsByEmail(email)
                    || users.findByEmployeeId(employeeId).isPresent()) {
                System.out.println(
                    "Test employee setup skipped: email or employee ID is already linked.");
                return;
            }

            AppUser user = new AppUser();
            user.setEmail(email);
            user.setPassword(passwordEncoder.encode(password));
            user.setRole("EMPLOYEE");
            user.setEmployeeId(employeeId);

            users.save(user);

            System.out.println("Test employee account created successfully.");
        };
    }
}
