
package com.hr_nexus.leave;

import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface LeaveRequestRepository
        extends JpaRepository<LeaveRequest, Long> {

    List<LeaveRequest> findByEmployeeIdOrderByStartDateDesc(
            Long employeeId);
}
