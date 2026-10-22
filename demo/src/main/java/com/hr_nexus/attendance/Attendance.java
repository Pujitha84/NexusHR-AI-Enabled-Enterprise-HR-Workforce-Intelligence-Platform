package com.hr_nexus.attendance;

import jakarta.persistence.*;
import java.time.LocalDate;
import java.time.LocalTime;

@Entity
@Table(
    name = "attendance",
    uniqueConstraints = @UniqueConstraint(
        columnNames = {"employee_id", "attendance_date"}
    )
)
public class Attendance {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "employee_id", nullable = false)
    private Long employeeId;

    @Column(name = "attendance_date", nullable = false)
    private LocalDate attendanceDate;

    @Column(nullable = false)
    private String status;

    private LocalTime checkIn;
    private LocalTime checkOut;

    public Attendance() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Long getEmployeeId() { return employeeId; }
    public void setEmployeeId(Long employeeId) {
        this.employeeId = employeeId;
    }

    public LocalDate getAttendanceDate() { return attendanceDate; }
    public void setAttendanceDate(LocalDate attendanceDate) {
        this.attendanceDate = attendanceDate;
    }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public LocalTime getCheckIn() { return checkIn; }
    public void setCheckIn(LocalTime checkIn) { this.checkIn = checkIn; }

    public LocalTime getCheckOut() { return checkOut; }
    public void setCheckOut(LocalTime checkOut) { this.checkOut = checkOut; }
}
