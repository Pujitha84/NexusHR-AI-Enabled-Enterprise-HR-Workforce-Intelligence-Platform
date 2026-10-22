
package com.hr_nexus.payroll;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/payroll")
public class PayrollController {

    private final PayrollService payrollService;

    public PayrollController(PayrollService payrollService) {
        this.payrollService = payrollService;
    }

    @GetMapping
    public List<Payroll> getAllPayrolls() {
        return payrollService.getAllPayrolls();
    }

    @GetMapping("/{id}")
    public Payroll getPayrollById(@PathVariable Long id) {
        return payrollService.getPayrollById(id);
    }

    @GetMapping("/employee/{employeeId}")
    public List<Payroll> getPayrollsByEmployee(
            @PathVariable Long employeeId) {
        return payrollService.getPayrollsByEmployee(employeeId);
    }

    @GetMapping("/period/{payPeriod}")
    public List<Payroll> getPayrollsByPeriod(
            @PathVariable String payPeriod) {
        return payrollService.getPayrollsByPeriod(payPeriod);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public Payroll createPayroll(@RequestBody Payroll payroll) {
        return payrollService.createPayroll(payroll);
    }

    @PutMapping("/{id}")
    public Payroll updatePayroll(
            @PathVariable Long id,
            @RequestBody Payroll payroll) {
        return payrollService.updatePayroll(id, payroll);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deletePayroll(@PathVariable Long id) {
        payrollService.deletePayroll(id);
    }
}
