package com.hr_nexus.attendance;

import java.time.LocalDate;
import java.time.YearMonth;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import com.hr_nexus.employee.EmployeeRepository;

@RestController
@RequestMapping("/api/attendance")
public class AttendanceController {

    private final AttendanceRepository attendanceRepository;
    private final EmployeeRepository employeeRepository;

    public AttendanceController(
            AttendanceRepository attendanceRepository,
            EmployeeRepository employeeRepository) {
        this.attendanceRepository = attendanceRepository;
        this.employeeRepository = employeeRepository;
    }

    @GetMapping
    public List<Attendance> getAttendance(
            @RequestParam(required = false) LocalDate date) {
        LocalDate selectedDate =
            date == null ? LocalDate.now() : date;

        return attendanceRepository
            .findByAttendanceDateOrderByEmployeeIdAsc(selectedDate);
    }

    @GetMapping("/history")
    public List<Attendance> getAttendanceHistory(
            @RequestParam LocalDate startDate,
            @RequestParam LocalDate endDate) {

        if (startDate.isAfter(endDate)) {
            throw new ResponseStatusException(
                HttpStatus.BAD_REQUEST,
                "Start date cannot be after end date"
            );
        }

        if (startDate.isBefore(LocalDate.now().minusYears(5))
                || endDate.isAfter(LocalDate.now().plusDays(1))) {
            throw new ResponseStatusException(
                HttpStatus.BAD_REQUEST,
                "Date range must be within the last five years and up to tomorrow"
            );
        }

        return attendanceRepository
            .findByAttendanceDateBetweenOrderByAttendanceDateDescEmployeeIdAsc(
                startDate,
                endDate
            );
    }

    @GetMapping("/summary")
    public Map<String, Object> getMonthlySummary(
            @RequestParam Long employeeId,
            @RequestParam String month) {

        if (employeeId <= 0
                || !employeeRepository.existsById(employeeId)) {
            throw new ResponseStatusException(
                HttpStatus.NOT_FOUND,
                "Employee not found"
            );
        }

        YearMonth selectedMonth;

        try {
            selectedMonth = YearMonth.parse(month);
        } catch (RuntimeException exception) {
            throw new ResponseStatusException(
                HttpStatus.BAD_REQUEST,
                "Month must use YYYY-MM format"
            );
        }

        if (selectedMonth.isBefore(YearMonth.now().minusYears(5))
                || selectedMonth.isAfter(YearMonth.now())) {
            throw new ResponseStatusException(
                HttpStatus.BAD_REQUEST,
                "Month must be within the last five years and cannot be in the future"
            );
        }

        LocalDate startDate = selectedMonth.atDay(1);
        LocalDate endDate = selectedMonth.atEndOfMonth();

        List<Attendance> records =
            attendanceRepository
                .findByEmployeeIdAndAttendanceDateBetweenOrderByAttendanceDateAsc(
                    employeeId,
                    startDate,
                    endDate
                );

        Map<String, Long> counts = records.stream()
            .collect(Collectors.groupingBy(
                Attendance::getStatus,
                Collectors.counting()
            ));

        return Map.of(
            "employeeId", employeeId,
            "month", selectedMonth.toString(),
            "presentDays", counts.getOrDefault("PRESENT", 0L),
            "absentDays", counts.getOrDefault("ABSENT", 0L),
            "leaveDays", counts.getOrDefault("ON_LEAVE", 0L),
            "recordedDays", records.size()
        );
    }

    @PostMapping
    public Attendance saveAttendance(
            @RequestBody Attendance request) {

        if (request.getEmployeeId() == null
                || request.getAttendanceDate() == null) {
            throw new ResponseStatusException(
                HttpStatus.BAD_REQUEST,
                "Employee ID and attendance date are required"
            );
        }

        if (request.getStatus() == null
                || !List.of("PRESENT", "ABSENT", "ON_LEAVE")
                    .contains(request.getStatus())) {
            throw new ResponseStatusException(
                HttpStatus.BAD_REQUEST,
                "Status must be PRESENT, ABSENT, or ON_LEAVE"
            );
        }

        if (!employeeRepository.existsById(request.getEmployeeId())) {
            throw new ResponseStatusException(
                HttpStatus.NOT_FOUND,
                "Employee not found"
            );
        }

        if (request.getCheckIn() != null
                && request.getCheckOut() != null
                && request.getCheckOut().isBefore(request.getCheckIn())) {
            throw new ResponseStatusException(
                HttpStatus.BAD_REQUEST,
                "Check-out cannot be earlier than check-in"
            );
        }

        Attendance record = attendanceRepository
            .findByEmployeeIdAndAttendanceDate(
                request.getEmployeeId(),
                request.getAttendanceDate()
            )
            .orElseGet(Attendance::new);

        record.setEmployeeId(request.getEmployeeId());
        record.setAttendanceDate(request.getAttendanceDate());
        record.setStatus(request.getStatus());
        record.setCheckIn(request.getCheckIn());
        record.setCheckOut(request.getCheckOut());

        return attendanceRepository.save(record);
    }
}
