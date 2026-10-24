package com.hr_nexus.insights;

import java.time.LocalDate;
import java.time.ZoneId;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import com.hr_nexus.attendance.Attendance;
import com.hr_nexus.attendance.AttendanceRepository;
import com.hr_nexus.employee.Employee;
import com.hr_nexus.employee.EmployeeRepository;
import com.hr_nexus.leave.LeaveRequest;
import com.hr_nexus.leave.LeaveRequestRepository;
import com.hr_nexus.ops.OpsRecordRepository;
import com.hr_nexus.performance.Performance;
import com.hr_nexus.performance.PerformanceRepository;

import org.springframework.stereotype.Service;

@Service
public class InsightsService {

    private static final ZoneId ZONE = ZoneId.of("Asia/Kolkata");

    private final EmployeeRepository employeeRepository;
    private final LeaveRequestRepository leaveRequestRepository;
    private final OpsRecordRepository opsRecordRepository;
    private final AttendanceRepository attendanceRepository;
    private final PerformanceRepository performanceRepository;

    public InsightsService(
            EmployeeRepository employeeRepository,
            LeaveRequestRepository leaveRequestRepository,
            OpsRecordRepository opsRecordRepository,
            AttendanceRepository attendanceRepository,
            PerformanceRepository performanceRepository) {
        this.employeeRepository = employeeRepository;
        this.leaveRequestRepository = leaveRequestRepository;
        this.opsRecordRepository = opsRecordRepository;
        this.attendanceRepository = attendanceRepository;
        this.performanceRepository = performanceRepository;
    }

    public InsightsResponse getOverview() {
        long totalEmployees = employeeRepository.count();

        long openOpsRecords = opsRecordRepository.findAll()
                .stream()
                .filter(record -> record.getStatus() != null
                        && record.getStatus().equalsIgnoreCase("OPEN"))
                .count();

        long pendingLeaves = leaveRequestRepository.findAll()
                .stream()
                .filter(leave -> leave.getStatus() != null
                        && leave.getStatus().equalsIgnoreCase("PENDING"))
                .count();

        // Employees marked PRESENT in the attendance records for today
        long presentToday = attendanceRepository
                .findByAttendanceDateOrderByEmployeeIdAsc(today())
                .stream()
                .filter(record -> "PRESENT".equalsIgnoreCase(record.getStatus()))
                .count();

        return new InsightsResponse(
                totalEmployees,
                presentToday,
                pendingLeaves,
                openOpsRecords
        );
    }

    // Attrition risk for every employee who has not left, highest risk first
    public List<AttritionRisk> getAttritionRisks() {
        LocalDate today = today();
        LocalDate since30 = today.minusDays(30);
        LocalDate since90 = today.minusDays(90);

        Map<Long, Long> absences = attendanceRepository
                .findByAttendanceDateBetweenOrderByAttendanceDateDescEmployeeIdAsc(
                        since30, today)
                .stream()
                .filter(record -> "ABSENT".equalsIgnoreCase(record.getStatus()))
                .collect(Collectors.groupingBy(
                        Attendance::getEmployeeId, Collectors.counting()));

        Map<Long, Long> leaveDays = new HashMap<>();
        for (LeaveRequest leave : leaveRequestRepository.findAll()) {
            if (!"APPROVED".equalsIgnoreCase(leave.getStatus())) {
                continue;
            }
            LocalDate start = leave.getStartDate().isBefore(since90)
                    ? since90
                    : leave.getStartDate();
            LocalDate end = leave.getEndDate().isAfter(today)
                    ? today
                    : leave.getEndDate();
            if (end.isBefore(start)) {
                continue;
            }
            long days = ChronoUnit.DAYS.between(start, end) + 1;
            leaveDays.merge(leave.getEmployeeId(), days, Long::sum);
        }

        // Latest three ratings per employee (reviews come newest first)
        Map<Long, List<Integer>> ratings = new HashMap<>();
        for (Performance review
                : performanceRepository.findAllByOrderByCreatedAtDesc()) {
            List<Integer> list = ratings.computeIfAbsent(
                    review.getEmployeeId(), id -> new ArrayList<>());
            if (list.size() < 3) {
                list.add(review.getRating());
            }
        }

        List<AttritionRisk> results = new ArrayList<>();
        for (Employee employee : employeeRepository.findAll()) {
            if ("OFFBOARDED".equals(employee.getStatus())) {
                continue;
            }
            Long id = employee.getId();
            results.add(AttritionScorer.score(
                    employee,
                    absences.getOrDefault(id, 0L),
                    leaveDays.getOrDefault(id, 0L),
                    ratings.getOrDefault(id, List.of()),
                    today));
        }

        results.sort(Comparator.comparingInt(AttritionRisk::riskScore).reversed());
        return results;
    }

    private LocalDate today() {
        return LocalDate.now(ZONE);
    }
}