package com.hr_nexus.performance;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "performance_reviews")
public class Performance {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Long employeeId;

    @Column(nullable = false)
    private String reviewPeriod;

    @Column(nullable = false)
    private Integer rating;

    @Column(length = 1000)
    private String goals;

    @Column(length = 1000)
    private String comments;

    private LocalDateTime createdAt = LocalDateTime.now();

    public Performance() {}

    public Long getId() { return id; }
    public Long getEmployeeId() { return employeeId; }
    public String getReviewPeriod() { return reviewPeriod; }
    public Integer getRating() { return rating; }
    public String getGoals() { return goals; }
    public String getComments() { return comments; }
    public LocalDateTime getCreatedAt() { return createdAt; }

    public void setId(Long id) { this.id = id; }
    public void setEmployeeId(Long employeeId) { this.employeeId = employeeId; }
    public void setReviewPeriod(String reviewPeriod) { this.reviewPeriod = reviewPeriod; }
    public void setRating(Integer rating) { this.rating = rating; }
    public void setGoals(String goals) { this.goals = goals; }
    public void setComments(String comments) { this.comments = comments; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}