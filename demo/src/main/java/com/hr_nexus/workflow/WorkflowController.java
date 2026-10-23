package com.hr_nexus.workflow;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Locale;

import com.hr_nexus.documents.EmployeeDocumentRepository;
import com.hr_nexus.employee.EmployeeRepository;
import com.hr_nexus.ops.OpsRecord;
import com.hr_nexus.ops.OpsRecordRepository;

import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api/workflows")
public class WorkflowController {

    // Approval steps in the order they must be completed
    private static final List<String> STEPS = List.of(
            "DOCUMENT_CHECK", "MANAGER_APPROVAL", "HR_APPROVAL");

    public record DecisionRequest(
            String decision,
            String comment,
            String approverName) {
    }

    public record WorkflowView(
            Long id,
            Long employeeId,
            String currentStep,
            String status,
            LocalDateTime createdAt,
            LocalDateTime completedAt,
            List<WorkflowApproval> approvals) {
    }

    private final OnboardingWorkflowRepository workflowRepository;
    private final WorkflowApprovalRepository approvalRepository;
    private final EmployeeRepository employeeRepository;
    private final EmployeeDocumentRepository documentRepository;
    private final OpsRecordRepository opsRepository;

    public WorkflowController(
            OnboardingWorkflowRepository workflowRepository,
            WorkflowApprovalRepository approvalRepository,
            EmployeeRepository employeeRepository,
            EmployeeDocumentRepository documentRepository,
            OpsRecordRepository opsRepository) {
        this.workflowRepository = workflowRepository;
        this.approvalRepository = approvalRepository;
        this.employeeRepository = employeeRepository;
        this.documentRepository = documentRepository;
        this.opsRepository = opsRepository;
    }

    @GetMapping
    public List<WorkflowView> list() {
        return workflowRepository.findAllByOrderByCreatedAtDesc()
                .stream()
                .map(this::toView)
                .toList();
    }

    // Start onboarding for an employee that does not have a workflow yet
    @PostMapping("/start/{employeeId}")
    @ResponseStatus(HttpStatus.CREATED)
    public WorkflowView start(@PathVariable Long employeeId) {
        if (!employeeRepository.existsById(employeeId)) {
            throw new ResponseStatusException(
                    HttpStatus.NOT_FOUND, "Employee not found");
        }
        if (workflowRepository.findByEmployeeId(employeeId).isPresent()) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "This employee already has an onboarding workflow");
        }

        OnboardingWorkflow workflow = new OnboardingWorkflow();
        workflow.setEmployeeId(employeeId);
        return toView(workflowRepository.save(workflow));
    }

    @PostMapping("/{id}/decision")
    @Transactional
    public WorkflowView decide(
            @PathVariable Long id,
            @RequestBody DecisionRequest request,
            Authentication authentication) {

        OnboardingWorkflow workflow = findWorkflow(id);

        if (!workflow.getStatus().equals("IN_PROGRESS")) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "This workflow is already "
                            + workflow.getStatus().toLowerCase(Locale.ROOT));
        }

        String decision = request.decision() == null
                ? ""
                : request.decision().trim().toUpperCase(Locale.ROOT);
        if (!decision.equals("APPROVE") && !decision.equals("REJECT")) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST, "Decision must be APPROVE or REJECT");
        }

        String comment = request.comment() == null
                ? ""
                : request.comment().trim();
        if (comment.length() > 500) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Comment must be 500 characters or fewer");
        }
        if (decision.equals("REJECT") && comment.isEmpty()) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST, "Add a reason when rejecting");
        }

        String step = workflow.getCurrentStep();
        String approver = request.approverName() == null
                ? ""
                : request.approverName().trim();

        if (step.equals("MANAGER_APPROVAL") && approver.isEmpty()) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST, "Enter the manager's name");
        }
        if (approver.isEmpty()) {
            approver = authentication.getName();
        }
        if (approver.length() > 120) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST, "Approver name is too long");
        }

        if (decision.equals("APPROVE")
                && step.equals("DOCUMENT_CHECK")
                && documentRepository.countByEmployeeId(
                        workflow.getEmployeeId()) == 0) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Upload at least one document before approving this step");
        }

        WorkflowApproval approval = new WorkflowApproval();
        approval.setWorkflowId(workflow.getId());
        approval.setStep(step);
        approval.setDecision(decision.equals("APPROVE") ? "APPROVED" : "REJECTED");
        approval.setApprover(approver);
        approval.setComment(comment.isEmpty() ? null : comment);
        approvalRepository.save(approval);

        if (decision.equals("REJECT")) {
            workflow.setStatus("REJECTED");
        } else {
            int index = STEPS.indexOf(step);
            if (index >= STEPS.size() - 1) {
                workflow.setStatus("COMPLETED");
                workflow.setCompletedAt(LocalDateTime.now());
                closeOnboardingTask(workflow.getEmployeeId());
            } else {
                workflow.setCurrentStep(STEPS.get(index + 1));
            }
        }

        return toView(workflowRepository.save(workflow));
    }

    // After a rejection, start the approval steps again from the beginning
    @PostMapping("/{id}/restart")
    public WorkflowView restart(@PathVariable Long id) {
        OnboardingWorkflow workflow = findWorkflow(id);

        if (!workflow.getStatus().equals("REJECTED")) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "Only a rejected workflow can be restarted");
        }

        workflow.setStatus("IN_PROGRESS");
        workflow.setCurrentStep(STEPS.get(0));
        workflow.setCompletedAt(null);
        return toView(workflowRepository.save(workflow));
    }

    private OnboardingWorkflow findWorkflow(Long id) {
        return workflowRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "Workflow not found"));
    }

    private WorkflowView toView(OnboardingWorkflow workflow) {
        return new WorkflowView(
                workflow.getId(),
                workflow.getEmployeeId(),
                workflow.getCurrentStep(),
                workflow.getStatus(),
                workflow.getCreatedAt(),
                workflow.getCompletedAt(),
                approvalRepository.findByWorkflowIdOrderByDecidedAtAsc(
                        workflow.getId()));
    }

    // Mark the People Ops onboarding task as completed
    private void closeOnboardingTask(Long employeeId) {
        for (OpsRecord record
                : opsRepository.findByEmployeeIdOrderByRecordDateDesc(employeeId)) {
            if ("ONBOARDING".equalsIgnoreCase(record.getCategory())
                    && !"COMPLETED".equalsIgnoreCase(record.getStatus())) {
                record.setStatus("COMPLETED");
                opsRepository.save(record);
            }
        }
    }
}