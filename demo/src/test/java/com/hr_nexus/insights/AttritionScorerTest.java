package com.hr_nexus.insights;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.time.LocalDate;
import java.util.List;

import com.hr_nexus.employee.Employee;

import org.junit.jupiter.api.Test;

class AttritionScorerTest {

    private static final LocalDate TODAY = LocalDate.of(2026, 10, 23);

    private Employee employee(String status, LocalDate joined) {
        Employee employee = new Employee();
        employee.setId(1L);
        employee.setFirstName("Asha");
        employee.setLastName("Rao");
        employee.setEmail("asha@company.com");
        employee.setDepartment("Engineering");
        employee.setJobTitle("Engineer");
        employee.setStatus(status);
        employee.setJoiningDate(joined);
        return employee;
    }

    @Test
    void healthyEmployeeIsLowRisk() {
        AttritionRisk risk = AttritionScorer.score(
                employee("ACTIVE", TODAY.minusYears(2)),
                0, 0, List.of(4, 5, 4), TODAY);

        assertEquals(0, risk.riskScore());
        assertEquals("LOW", risk.riskLevel());
        assertEquals(List.of("No risk signals found"), risk.reasons());
    }

    @Test
    void lowRatingsAbsencesAndLeaveGiveHighRisk() {
        AttritionRisk risk = AttritionScorer.score(
                employee("ACTIVE", TODAY.minusYears(2)),
                4, 12, List.of(2, 2, 1), TODAY);

        // 30 (ratings) + 25 (absences) + 20 (leave)
        assertEquals(75, risk.riskScore());
        assertEquals("HIGH", risk.riskLevel());
        assertEquals(3, risk.reasons().size());
    }

    @Test
    void servingNoticeIsHighRisk() {
        AttritionRisk risk = AttritionScorer.score(
                employee("ON_NOTICE", TODAY.minusYears(1)),
                0, 0, List.of(), TODAY);

        assertEquals(60, risk.riskScore());
        assertEquals("HIGH", risk.riskLevel());
    }

    @Test
    void newHireGetsSmallEarlyTenureBump() {
        AttritionRisk risk = AttritionScorer.score(
                employee("ACTIVE", TODAY.minusDays(10)),
                0, 0, List.of(), TODAY);

        assertEquals(10, risk.riskScore());
        assertEquals("LOW", risk.riskLevel());
    }

    @Test
    void mediumRiskFromOneAbsenceAndBelowExpectationsRating() {
        AttritionRisk risk = AttritionScorer.score(
                employee("ACTIVE", TODAY.minusYears(3)),
                1, 6, List.of(3, 2), TODAY);

        // 15 (rating 2.5) + 10 (absence) + 10 (leave)
        assertEquals(35, risk.riskScore());
        assertEquals("MEDIUM", risk.riskLevel());
    }

    @Test
    void scoreNeverGoesAbove100() {
        AttritionRisk risk = AttritionScorer.score(
                employee("ON_NOTICE", TODAY.minusDays(5)),
                5, 20, List.of(1, 1, 1), TODAY);

        assertEquals(100, risk.riskScore());
        assertTrue(risk.reasons().size() >= 4);
    }
}