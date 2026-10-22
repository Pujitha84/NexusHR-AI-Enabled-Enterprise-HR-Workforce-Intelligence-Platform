
package com.hr_nexus.auth;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

public interface AppUserRepository extends JpaRepository<AppUser, Long> {

    Optional<AppUser> findByEmail(String email);

    boolean existsByEmail(String email);

    Optional<AppUser> findByEmployeeId(Long employeeId);

    List<AppUser> findByRole(String role);
}
