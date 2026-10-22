
package com.hr_nexus.payroll;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "payroll")
public class Payroll {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Long employeeId;

    @Column(nullable = false)
    private String payPeriod;

    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal basicSalary;

    @Column(precision = 12, scale = 2)
    private BigDecimal allowances = BigDecimal.ZERO;

    @Column(precision = 12, scale = 2)
    private BigDecimal deductions = BigDecimal.ZERO;

    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal netSalary;

    private LocalDate paymentDate;

    private LocalDateTime createdAt = LocalDateTime.now();

    public Payroll() {}

    public Long getId() { return id; }
    public Long getEmployeeId() { return employeeId; }
    public String getPayPeriod() { return payPeriod; }
    public BigDecimal getBasicSalary() { return basicSalary; }
    public BigDecimal getAllowances() { return allowances; }
    public BigDecimal getDeductions() { return deductions; }
    public BigDecimal getNetSalary() { return netSalary; }
    public LocalDate getPaymentDate() { return paymentDate; }
    public LocalDateTime getCreatedAt() { return createdAt; }

    public void setId(Long id) { this.id = id; }
    public void setEmployeeId(Long employeeId) { this.employeeId = employeeId; }
    public void setPayPeriod(String payPeriod) { this.payPeriod = payPeriod; }
    public void setBasicSalary(BigDecimal basicSalary) { this.basicSalary = basicSalary; }
    public void setAllowances(BigDecimal allowances) { this.allowances = allowances; }
    public void setDeductions(BigDecimal deductions) { this.deductions = deductions; }
    public void setNetSalary(BigDecimal netSalary) { this.netSalary = netSalary; }
    public void setPaymentDate(LocalDate paymentDate) { this.paymentDate = paymentDate; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}
