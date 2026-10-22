package com.hr_nexus.employee;

import java.time.LocalDate;
import java.util.List;

import com.hr_nexus.ops.OpsRecord;
import com.hr_nexus.ops.OpsRecordRepository;

import jakarta.validation.Valid;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api/employees")
public class EmployeeController {

    private static final List<String> STATUSES =
            List.of("ACTIVE", "ON_NOTICE", "OFFBOARDED");

    private final EmployeeRepository repository;
    private final OpsRecordRepository opsRepository;

    public EmployeeController(
            EmployeeRepository repository,
            OpsRecordRepository opsRepository) {
        this.repository = repository;
        this.opsRepository = opsRepository;
    }

    // Request body for changing an employee's lifecycle status
    public record StatusChange(String status) {
    }

    // Get all employees
    @GetMapping
    public List<Employee> getAllEmployees() {
        return repository.findAll();
    }

    // Add a new employee (starts the onboarding workflow)
    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public Employee createEmployee(
            @Valid @RequestBody Employee employee) {
        employee.setId(null);
        employee.setStatus("ACTIVE");
        employee.setOffboardingDate(null);
        if (employee.getJoiningDate() == null) {
            employee.setJoiningDate(LocalDate.now());
        }

        Employee saved = repository.save(employee);

        // Onboarding task that HR can close in People Ops
        OpsRecord task = new OpsRecord();
        task.setCategory("ONBOARDING");
        task.setEmployeeId(saved.getId());
        task.setTitle("Onboard " + saved.getFirstName() + " "
                + saved.getLastName());
        task.setDetails(
                "Complete documents, equipment and system access setup.");
        task.setStatus("OPEN");
        task.setRecordDate(LocalDate.now());
        opsRepository.save(task);

        return saved;
    }

    // Get one employee by ID
    @GetMapping("/{id}")
    public Employee getEmployeeById(@PathVariable Long id) {
        return repository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Employee not found"));
    }

    // Edit an existing employee
    @PutMapping("/{id}")
    public Employee updateEmployee(
            @PathVariable Long id,
            @Valid @RequestBody Employee updatedEmployee) {

        Employee existingEmployee = repository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Employee not found"));

        existingEmployee.setFirstName(updatedEmployee.getFirstName());
        existingEmployee.setLastName(updatedEmployee.getLastName());
        existingEmployee.setEmail(updatedEmployee.getEmail());
        existingEmployee.setDepartment(updatedEmployee.getDepartment());
        existingEmployee.setJobTitle(updatedEmployee.getJobTitle());

        return repository.save(existingEmployee);
    }

    // Change lifecycle status: ACTIVE, ON_NOTICE or OFFBOARDED
    @PutMapping("/{id}/status")
    public Employee changeStatus(
            @PathVariable Long id,
            @RequestBody StatusChange change) {

        Employee employee = repository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Employee not found"));

        String status = change.status() == null
                ? ""
                : change.status().trim().toUpperCase();

        if (!STATUSES.contains(status)) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Status must be ACTIVE, ON_NOTICE or OFFBOARDED");
        }

        employee.setStatus(status);
        employee.setOffboardingDate(
                status.equals("OFFBOARDED") ? LocalDate.now() : null);

        return repository.save(employee);
    }

    // Delete an employee
    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteEmployee(@PathVariable Long id) {
        if (!repository.existsById(id)) {
            throw new ResponseStatusException(
                    HttpStatus.NOT_FOUND,
                    "Employee not found");
        }

        repository.deleteById(id);
    }
}