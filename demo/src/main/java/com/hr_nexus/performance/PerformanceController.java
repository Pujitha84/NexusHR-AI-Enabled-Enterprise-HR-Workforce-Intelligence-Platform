package com.hr_nexus.performance;

import com.hr_nexus.employee.EmployeeRepository;
import com.hr_nexus.notification.NotificationService;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@RestController
@RequestMapping("/api/performance")
public class PerformanceController {

    private final PerformanceRepository repository;
    private final EmployeeRepository employeeRepository;
    private final NotificationService notificationService;

   public PerformanceController(PerformanceRepository repository,
                                 EmployeeRepository employeeRepository,
                                 NotificationService notificationService) {
        this.repository = repository;
        this.employeeRepository = employeeRepository;
        this.notificationService = notificationService;
    }

    @GetMapping
    public List<Performance> getAll(@RequestParam(required = false) Long employeeId) {
        if (employeeId != null) {
            return repository.findByEmployeeIdOrderByCreatedAtDesc(employeeId);
        }
        return repository.findAllByOrderByCreatedAtDesc();
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public Performance create(@RequestBody Performance review) {
        validate(review);
        review.setId(null);
        return repository.save(review);
    }

    @PutMapping("/{id}")
    public Performance update(@PathVariable Long id, @RequestBody Performance review) {
        Performance existing = repository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "Review not found"));
        validate(review);
        existing.setEmployeeId(review.getEmployeeId());
        existing.setReviewPeriod(review.getReviewPeriod());
        existing.setRating(review.getRating());
        existing.setGoals(review.getGoals());
        existing.setComments(review.getComments());
        return repository.save(existing);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable Long id) {
        if (!repository.existsById(id)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Review not found");
        }
        repository.deleteById(id);
    }

    private void validate(Performance r) {
        if (r.getEmployeeId() == null || !employeeRepository.existsById(r.getEmployeeId())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Employee does not exist");
        }
        if (r.getReviewPeriod() == null || r.getReviewPeriod().isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Review period is required");
        }
        if (r.getRating() == null || r.getRating() < 1 || r.getRating() > 5) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Rating must be between 1 and 5");
        }
    }
}