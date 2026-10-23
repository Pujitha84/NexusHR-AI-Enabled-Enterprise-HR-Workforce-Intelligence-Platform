package com.hr_nexus.workflow;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

public interface WorkflowApprovalRepository
        extends JpaRepository<WorkflowApproval, Long> {

    List<WorkflowApproval> findByWorkflowIdOrderByDecidedAtAsc(Long workflowId);

    void deleteByWorkflowId(Long workflowId);
}