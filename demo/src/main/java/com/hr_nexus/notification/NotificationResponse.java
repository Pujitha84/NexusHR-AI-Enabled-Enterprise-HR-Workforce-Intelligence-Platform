
package com.hr_nexus.notification;

import java.time.LocalDateTime;

public record NotificationResponse(
        Long id,
        Long employeeId,
        String title,
        String message,
        String type,
        boolean read,
        LocalDateTime createdAt
) {
    public static NotificationResponse from(Notification notification) {
        return new NotificationResponse(
                notification.getId(),
                notification.getEmployeeId(),
                notification.getTitle(),
                notification.getMessage(),
                notification.getType(),
                notification.isRead(),
                notification.getCreatedAt()
        );
    }
}
