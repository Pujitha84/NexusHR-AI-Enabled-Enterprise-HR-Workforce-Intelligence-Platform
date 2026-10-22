
package com.hr_nexus.ops;

import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@RestController
@RequestMapping("/api/ops")
public class OpsRecordController {

    private final OpsRecordRepository repository;

    public OpsRecordController(OpsRecordRepository repository) {
        this.repository = repository;
    }

    @GetMapping
    public List<OpsRecord> getAll(
            @RequestParam(required = false) String category,
            @RequestParam(required = false) Long employeeId) {

        if (category != null && !category.isBlank()) {
            return repository
                    .findByCategoryIgnoreCaseOrderByRecordDateDesc(category);
        }

        if (employeeId != null) {
            return repository.findByEmployeeIdOrderByRecordDateDesc(employeeId);
        }

        return repository.findAllByOrderByRecordDateDesc();
    }

    @GetMapping("/{id}")
    public OpsRecord getById(@PathVariable Long id) {
        return repository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "HR record not found"));
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public OpsRecord create(@Valid @RequestBody OpsRecord record) {
        record.setId(null);
        validateRecord(record);
        return repository.save(record);
    }

    @PutMapping("/{id}")
    public OpsRecord update(
            @PathVariable Long id,
            @Valid @RequestBody OpsRecord updated) {

        OpsRecord existing = repository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "HR record not found"));

        validateRecord(updated);

        existing.setCategory(updated.getCategory());
        existing.setEmployeeId(updated.getEmployeeId());
        existing.setTitle(updated.getTitle());
        existing.setDetails(updated.getDetails());
        existing.setAmount(updated.getAmount());
        existing.setStatus(updated.getStatus());
        existing.setRecordDate(updated.getRecordDate());

        return repository.save(existing);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable Long id) {
        if (!repository.existsById(id)) {
            throw new ResponseStatusException(
                    HttpStatus.NOT_FOUND, "HR record not found");
        }
        repository.deleteById(id);
    }

    private void validateRecord(OpsRecord record) {
        if (record.getCategory() == null
                || record.getCategory().isBlank()
                || record.getTitle() == null
                || record.getTitle().isBlank()
                || record.getStatus() == null
                || record.getStatus().isBlank()) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Category, title and status are required");
        }

        if (record.getRecordDate() == null) {
            record.setRecordDate(java.time.LocalDate.now());
        }

        if (record.getStatus().length() > 32
                || record.getCategory().length() > 32
                || record.getTitle().length() > 140) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST, "A field exceeds its allowed length");
        }
    }
}
