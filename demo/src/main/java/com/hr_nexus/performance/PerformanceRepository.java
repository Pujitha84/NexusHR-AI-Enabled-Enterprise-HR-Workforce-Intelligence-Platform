package com.hr_nexus.performance;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface PerformanceRepository extends JpaRepository<Performance, Long> {

    List<Performance> findAllByOrderByCreatedAtDesc();

    List<Performance> findByEmployeeIdOrderByCreatedAtDesc(Long employeeId);
}