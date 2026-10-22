
package com.hr_nexus.notification;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/notifications")
public class NotificationController {

    private final NotificationService notificationService;

    public NotificationController(
            NotificationService notificationService) {
        this.notificationService = notificationService;
    }

    @GetMapping("/employee/{employeeId}")
    public List<Notification> getAllNotifications(
            @PathVariable Long employeeId) {
        return notificationService.getAllNotifications(employeeId);
    }

    @GetMapping("/employee/{employeeId}/unread")
    public List<Notification> getUnreadNotifications(
            @PathVariable Long employeeId) {
        return notificationService.getUnreadNotifications(employeeId);
    }

    @GetMapping("/employee/{employeeId}/unread/count")
    public long getUnreadCount(@PathVariable Long employeeId) {
        return notificationService.getUnreadCount(employeeId);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public Notification createNotification(
            @RequestBody Notification notification) {
        return notificationService.createNotification(notification);
    }

    @PatchMapping("/{id}/employee/{employeeId}/read")
    public Notification markAsRead(
            @PathVariable Long id,
            @PathVariable Long employeeId) {
        return notificationService.markAsRead(id, employeeId);
    }

    @DeleteMapping("/{id}/employee/{employeeId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteNotification(
            @PathVariable Long id,
            @PathVariable Long employeeId) {
        notificationService.deleteNotification(id, employeeId);
    }
}
