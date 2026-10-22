
package com.hr_nexus.notification;

import org.springframework.stereotype.Service;
import java.util.List;

@Service
public class NotificationService {

    private final NotificationRepository notificationRepository;

    public NotificationService(
            NotificationRepository notificationRepository) {
        this.notificationRepository = notificationRepository;
    }

    public List<Notification> getAllNotifications(Long employeeId) {
        return notificationRepository
                .findByEmployeeIdOrderByCreatedAtDesc(employeeId);
    }

    public List<Notification> getUnreadNotifications(Long employeeId) {
        return notificationRepository
                .findByEmployeeIdAndReadFalseOrderByCreatedAtDesc(
                        employeeId);
    }

    public long getUnreadCount(Long employeeId) {
        return notificationRepository
                .countByEmployeeIdAndReadFalse(employeeId);
    }

    public Notification createNotification(Notification notification) {
        if (notification.getEmployeeId() == null
                || notification.getEmployeeId() <= 0) {
            throw new IllegalArgumentException(
                    "Valid employee ID is required");
        }

        if (notification.getTitle() == null
                || notification.getTitle().isBlank()) {
            throw new IllegalArgumentException(
                    "Notification title is required");
        }

        if (notification.getMessage() == null
                || notification.getMessage().isBlank()) {
            throw new IllegalArgumentException(
                    "Notification message is required");
        }

        if (notification.getType() == null
                || notification.getType().isBlank()) {
            notification.setType("INFO");
        }

        notification.setId(null);
        notification.setRead(false);

        return notificationRepository.save(notification);
    }

    public Notification markAsRead(Long id, Long employeeId) {
        Notification notification = notificationRepository
                .findById(id)
                .filter(item -> item.getEmployeeId().equals(employeeId))
                .orElseThrow(() -> new RuntimeException(
                        "Notification not found for this employee"));

        notification.setRead(true);
        return notificationRepository.save(notification);
    }

    public void deleteNotification(Long id, Long employeeId) {
        Notification notification = notificationRepository
                .findById(id)
                .filter(item -> item.getEmployeeId().equals(employeeId))
                .orElseThrow(() -> new RuntimeException(
                        "Notification not found for this employee"));

        notificationRepository.delete(notification);
    }
}
