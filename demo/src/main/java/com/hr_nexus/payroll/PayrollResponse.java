
package com.hr_nexus.payroll;

import java.math.BigDecimal;
import java.time.LocalDate;

public record PayrollResponse(
        Long id,
        Long employeeId,
        String payPeriod,
        BigDecimal basicSalary,
        BigDecimal allowances,
        BigDecimal deductions,
        BigDecimal netSalary,
        LocalDate paymentDate
) {
    public static PayrollResponse from(Payroll payroll) {
        return new PayrollResponse(
                payroll.getId(),
                payroll.getEmployeeId(),
                payroll.getPayPeriod(),
                payroll.getBasicSalary(),
                payroll.getAllowances(),
                payroll.getDeductions(),
                payroll.getNetSalary(),
                payroll.getPaymentDate()
        );
    }
}
