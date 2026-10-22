
package com.hr_nexus.notification;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "notifications")
public class Notification {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Long employeeId;

    @Column(nullable = false, length = 150)
    private String title;

    @Column(nullable = false, length = 1000)
    private String message;

    @Column(nullable = false, length = 50)
    private String type = "INFO";

    @Column(nullable = false)
    private boolean read = false;

    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    public Notification() {}

    public Long getId() { return id; }
    public Long getEmployeeId() { return employeeId; }
    public String getTitle() { return title; }
    public String getMessage() { return message; }
    public String getType() { return type; }
    public boolean isRead() { return read; }
    public LocalDateTime getCreatedAt() { return createdAt; }

    public void setId(Long id) { this.id = id; }
    public void setEmployeeId(Long employeeId) { this.employeeId = employeeId; }
    public void setTitle(String title) { this.title = title; }
    public void setMessage(String message) { this.message = message; }
    public void setType(String type) { this.type = type; }
    public void setRead(boolean read) { this.read = read; }
    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }
}
