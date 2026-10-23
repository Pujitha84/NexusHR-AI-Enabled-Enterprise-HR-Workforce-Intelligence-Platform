package com.hr_nexus.workflow;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

public interface OnboardingWorkflowRepository
        extends JpaRepository<OnboardingWorkflow, Long> {

    Optional<OnboardingWorkflow> findByEmployeeId(Long employeeId);

    List<OnboardingWorkflow> findAllByOrderByCreatedAtDesc();

    void deleteByEmployeeId(Long employeeId);
}