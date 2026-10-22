
package com.hr_nexus.employee;

import java.util.List;

import jakarta.validation.Valid;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api/employees")
public class EmployeeController {

    private final EmployeeRepository repository;

    public EmployeeController(EmployeeRepository repository) {
        this.repository = repository;
    }

    // Get all employees
    @GetMapping
    public List<Employee> getAllEmployees() {
        return repository.findAll();
    }

    // Add a new employee
    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public Employee createEmployee(
            @Valid @RequestBody Employee employee) {
        employee.setId(null);
        return repository.save(employee);
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
