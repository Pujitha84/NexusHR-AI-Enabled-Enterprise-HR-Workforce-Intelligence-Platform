package com.hr_nexus.attendance;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

public interface AttendanceRepository
        extends JpaRepository<Attendance, Long> {

    List<Attendance> findByAttendanceDateOrderByEmployeeIdAsc(
        LocalDate attendanceDate
    );

    Optional<Attendance> findByEmployeeIdAndAttendanceDate(
        Long employeeId,
        LocalDate attendanceDate
    );

    List<Attendance> findByEmployeeIdAndAttendanceDateBetweenOrderByAttendanceDateAsc(
        Long employeeId,
        LocalDate startDate,
        LocalDate endDate
    );

    List<Attendance>
        findByAttendanceDateBetweenOrderByAttendanceDateDescEmployeeIdAsc(
            LocalDate startDate,
            LocalDate endDate
        );
}
