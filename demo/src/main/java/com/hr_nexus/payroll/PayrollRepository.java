
package com.hr_nexus.payroll;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface PayrollRepository extends JpaRepository<Payroll, Long> {

    List<Payroll> findByEmployeeIdOrderByCreatedAtDesc(Long employeeId);

    List<Payroll> findByPayPeriodOrderByCreatedAtDesc(String payPeriod);
}
