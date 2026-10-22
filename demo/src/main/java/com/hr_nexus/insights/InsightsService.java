package com.hr_nexus.insights;

import com.hr_nexus.employee.EmployeeRepository;
import com.hr_nexus.leave.LeaveRequestRepository;
import com.hr_nexus.ops.OpsRecord;
import com.hr_nexus.ops.OpsRecordRepository;

import org.springframework.stereotype.Service;

@Service
public class InsightsService {

    private final EmployeeRepository employeeRepository;
    private final LeaveRequestRepository leaveRequestRepository;
    private final OpsRecordRepository opsRecordRepository;

    public InsightsService(
            EmployeeRepository employeeRepository,
            LeaveRequestRepository leaveRequestRepository,
            OpsRecordRepository opsRecordRepository) {
        this.employeeRepository = employeeRepository;
        this.leaveRequestRepository = leaveRequestRepository;
        this.opsRecordRepository = opsRecordRepository;
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

        // Present-today requires attendance data, which we'll connect next.
        long presentToday = 0;

        return new InsightsResponse(
                totalEmployees,
                presentToday,
                pendingLeaves,
                openOpsRecords
        );
    }
}