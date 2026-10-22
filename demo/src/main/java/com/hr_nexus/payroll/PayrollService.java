
package com.hr_nexus.payroll;

import org.springframework.stereotype.Service;
import java.math.BigDecimal;
import java.util.List;

@Service
public class PayrollService {

    private final PayrollRepository payrollRepository;

    public PayrollService(PayrollRepository payrollRepository) {
        this.payrollRepository = payrollRepository;
    }

    public List<Payroll> getAllPayrolls() {
        return payrollRepository.findAll();
    }

    public Payroll getPayrollById(Long id) {
        return payrollRepository.findById(id)
                .orElseThrow(() ->
                        new RuntimeException("Payroll record not found: " + id));
    }

    public List<Payroll> getPayrollsByEmployee(Long employeeId) {
        return payrollRepository
                .findByEmployeeIdOrderByCreatedAtDesc(employeeId);
    }

    public List<Payroll> getPayrollsByPeriod(String payPeriod) {
        return payrollRepository
                .findByPayPeriodOrderByCreatedAtDesc(payPeriod);
    }

    public Payroll createPayroll(Payroll payroll) {
        BigDecimal basic = requireNonNegative(
                payroll.getBasicSalary(), "Basic salary");
        BigDecimal allowances = payroll.getAllowances() == null
                ? BigDecimal.ZERO : requireNonNegative(
                        payroll.getAllowances(), "Allowances");
        BigDecimal deductions = payroll.getDeductions() == null
                ? BigDecimal.ZERO : requireNonNegative(
                        payroll.getDeductions(), "Deductions");

        if (payroll.getEmployeeId() == null
                || payroll.getEmployeeId() <= 0) {
            throw new IllegalArgumentException("Valid employee ID is required");
        }

        if (payroll.getPayPeriod() == null
                || payroll.getPayPeriod().isBlank()) {
            throw new IllegalArgumentException("Pay period is required");
        }

        BigDecimal netSalary = basic.add(allowances).subtract(deductions);

        if (netSalary.signum() < 0) {
            throw new IllegalArgumentException(
                    "Deductions cannot exceed basic salary plus allowances");
        }

        payroll.setBasicSalary(basic);
        payroll.setAllowances(allowances);
        payroll.setDeductions(deductions);
        payroll.setNetSalary(netSalary);

        return payrollRepository.save(payroll);
    }

    public Payroll updatePayroll(Long id, Payroll updated) {
        Payroll existing = getPayrollById(id);

        existing.setEmployeeId(updated.getEmployeeId());
        existing.setPayPeriod(updated.getPayPeriod());
        existing.setBasicSalary(updated.getBasicSalary());
        existing.setAllowances(updated.getAllowances());
        existing.setDeductions(updated.getDeductions());
        existing.setPaymentDate(updated.getPaymentDate());

        return createPayroll(existing);
    }

    public void deletePayroll(Long id) {
        if (!payrollRepository.existsById(id)) {
            throw new RuntimeException("Payroll record not found: " + id);
        }
        payrollRepository.deleteById(id);
    }

    private BigDecimal requireNonNegative(BigDecimal value, String field) {
        if (value == null || value.signum() < 0) {
            throw new IllegalArgumentException(
                    field + " must be zero or greater");
        }
        return value;
    }
}
