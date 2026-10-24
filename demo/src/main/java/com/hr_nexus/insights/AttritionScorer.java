package com.hr_nexus.insights;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;

import com.hr_nexus.employee.Employee;

/**
 * Rule-based attrition risk model.
 *
 * Each signal adds points to a score from 0 to 100:
 *   - serving notice ............................. +60
 *   - average of latest ratings below 2.5 ........ +30  (below 3.0: +15)
 *   - 3 or more absences in the last 30 days ..... +25  (1 or 2: +10)
 *   - more than 10 leave days in 90 days ......... +20  (more than 5: +10)
 *   - joined in the last 90 days ................. +10
 *
 * 60 and above is HIGH, 30 to 59 is MEDIUM, below 30 is LOW.
 */
public final class AttritionScorer {

    private AttritionScorer() {
    }

    public static AttritionRisk score(
            Employee employee,
            long absencesLast30Days,
            long leaveDaysLast90Days,
            List<Integer> recentRatings,
            LocalDate today) {

        int score = 0;
        List<String> reasons = new ArrayList<>();

        if ("ON_NOTICE".equals(employee.getStatus())) {
            score += 60;
            reasons.add("Employee is serving notice");
        }

        if (recentRatings != null && !recentRatings.isEmpty()) {
            double total = 0;
            for (int rating : recentRatings) {
                total += rating;
            }
            double average = total / recentRatings.size();

            if (average < 2.5) {
                score += 30;
                reasons.add(String.format(Locale.ROOT,
                        "Low recent performance rating (%.1f out of 5)", average));
            } else if (average < 3.0) {
                score += 15;
                reasons.add(String.format(Locale.ROOT,
                        "Performance rating below expectations (%.1f out of 5)",
                        average));
            }
        }

        if (absencesLast30Days >= 3) {
            score += 25;
            reasons.add(absencesLast30Days
                    + " absences in the last 30 days");
        } else if (absencesLast30Days >= 1) {
            score += 10;
            reasons.add(absencesLast30Days
                    + (absencesLast30Days == 1 ? " absence" : " absences")
                    + " in the last 30 days");
        }

        if (leaveDaysLast90Days > 10) {
            score += 20;
            reasons.add(leaveDaysLast90Days
                    + " approved leave days in the last 90 days");
        } else if (leaveDaysLast90Days > 5) {
            score += 10;
            reasons.add(leaveDaysLast90Days
                    + " approved leave days in the last 90 days");
        }

        LocalDate joined = employee.getJoiningDate();
        if (joined != null && joined.isAfter(today.minusDays(90))) {
            score += 10;
            reasons.add("Joined in the last 90 days (early-tenure risk)");
        }

        score = Math.min(score, 100);

        if (reasons.isEmpty()) {
            reasons.add("No risk signals found");
        }

        String level;
        String recommendation;
        if (score >= 60) {
            level = "HIGH";
            recommendation =
                    "Schedule a one-to-one this week and review workload, growth and pay.";
        } else if (score >= 30) {
            level = "MEDIUM";
            recommendation =
                    "Ask the manager for a check-in and watch the next review cycle.";
        } else {
            level = "LOW";
            recommendation = "No action needed. Keep monitoring.";
        }

        return new AttritionRisk(
                employee.getId(),
                employee.getFirstName() + " " + employee.getLastName(),
                employee.getDepartment(),
                employee.getJobTitle(),
                score,
                level,
                reasons,
                recommendation);
    }
}