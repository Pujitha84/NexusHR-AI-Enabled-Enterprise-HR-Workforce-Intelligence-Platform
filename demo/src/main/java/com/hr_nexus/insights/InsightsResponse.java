package com.hr_nexus.insights;

public record InsightsResponse(
        long totalEmployees,
        long presentToday,
        long pendingLeaves,
        long openOpsRecords
) {}