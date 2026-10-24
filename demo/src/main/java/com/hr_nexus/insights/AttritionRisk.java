package com.hr_nexus.insights;

import java.util.List;

// Attrition risk for one employee, with the reasons behind the score.
public record AttritionRisk(
        Long employeeId,
        String employeeName,
        String department,
        String jobTitle,
        int riskScore,
        String riskLevel,
        List<String> reasons,
        String recommendation
) {}