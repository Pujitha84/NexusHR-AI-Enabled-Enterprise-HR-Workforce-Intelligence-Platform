
package com.hr_nexus.leave;

import java.time.LocalDate;
import java.util.List;
import java.util.Locale;

import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import com.hr_nexus.auth.AppUser;
import com.hr_nexus.auth.AppUserRepository;
import com.hr_nexus.employee.EmployeeRepository;

@RestController
@RequestMapping("/api/leaves")
public class LeaveRequestController {

    private final LeaveRequestRepository leaveRepository;
    private final EmployeeRepository employeeRepository;
    private final AppUserRepository appUserRepository;

    public LeaveRequestController(
            LeaveRequestRepository leaveRepository,
            EmployeeRepository employeeRepository,
            AppUserRepository appUserRepository) {
        this.leaveRepository = leaveRepository;
        this.employeeRepository = employeeRepository;
        this.appUserRepository = appUserRepository;
    }

    private AppUser currentUser(Authentication authentication) {
        if (authentication == null || !authentication.isAuthenticated()) {
            throw new ResponseStatusException(
                    HttpStatus.UNAUTHORIZED, "Login required");
        }

        return appUserRepository.findByEmail(
                authentication.getName().toLowerCase(Locale.ROOT))
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.UNAUTHORIZED, "Account not found"));
    }

    private boolean isHr(AppUser user) {
        return "HR".equalsIgnoreCase(user.getRole());
    }

    @GetMapping
    public List<LeaveRequest> getLeaves(
            @RequestParam(required = false) Long employeeId,
            Authentication authentication) {

        AppUser user = currentUser(authentication);

        if (isHr(user)) {
            if (employeeId != null) {
                if (!employeeRepository.existsById(employeeId)) {
                    throw new ResponseStatusException(
                            HttpStatus.NOT_FOUND, "Employee not found");
                }
                return leaveRepository
                        .findByEmployeeIdOrderByStartDateDesc(employeeId);
            }
            return leaveRepository.findAll();
        }

        if (!"EMPLOYEE".equalsIgnoreCase(user.getRole())
                || user.getEmployeeId() == null) {
            throw new ResponseStatusException(
                    HttpStatus.FORBIDDEN,
                    "This account is not linked to an employee");
        }

        if (employeeId != null && !employeeId.equals(user.getEmployeeId())) {
            throw new ResponseStatusException(
                    HttpStatus.FORBIDDEN,
                    "You can only view your own leave requests");
        }

        return leaveRepository
                .findByEmployeeIdOrderByStartDateDesc(user.getEmployeeId());
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public LeaveRequest createLeave(
            @RequestBody LeaveRequest request,
            Authentication authentication) {

        AppUser user = currentUser(authentication);

        if (!isHr(user)) {
            if (!"EMPLOYEE".equalsIgnoreCase(user.getRole())
                    || user.getEmployeeId() == null) {
                throw new ResponseStatusException(
                        HttpStatus.FORBIDDEN,
                        "This account is not linked to an employee");
            }

            request.setEmployeeId(user.getEmployeeId());
        }

        if (request.getEmployeeId() == null
                || request.getStartDate() == null
                || request.getEndDate() == null
                || request.getReason() == null
                || request.getReason().isBlank()) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Employee, start date, end date, and reason are required");
        }

        if (!employeeRepository.existsById(request.getEmployeeId())) {
            throw new ResponseStatusException(
                    HttpStatus.NOT_FOUND, "Employee not found");
        }

        if (request.getStartDate().isBefore(LocalDate.now())) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Start date cannot be in the past");
        }

        if (request.getEndDate().isBefore(request.getStartDate())) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "End date cannot be before start date");
        }

        if (request.getReason().trim().length() < 3
                || request.getReason().length() > 500) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Reason must contain between 3 and 500 characters");
        }

        request.setId(null);
        request.setStatus("PENDING");

        return leaveRepository.save(request);
    }

    @PatchMapping("/{id}/decision")
    public LeaveRequest decideLeave(
            @PathVariable Long id,
            @RequestParam String status,
            Authentication authentication) {

        AppUser user = currentUser(authentication);

        if (!isHr(user)) {
            throw new ResponseStatusException(
                    HttpStatus.FORBIDDEN,
                    "Only HR can approve or reject leave requests");
        }

        String decision = status == null
                ? ""
                : status.trim().toUpperCase(Locale.ROOT);

        if (!List.of("APPROVED", "REJECTED").contains(decision)) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Status must be APPROVED or REJECTED");
        }

        LeaveRequest request = leaveRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "Leave request not found"));

        if (!"PENDING".equals(request.getStatus())) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "Only pending leave requests can be decided");
        }

        request.setStatus(decision);
        return leaveRepository.save(request);
    }
}