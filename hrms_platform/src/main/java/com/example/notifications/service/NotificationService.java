package com.example.notifications.service;

import com.example.notifications.model.Notification;
import com.example.notifications.repository.NotificationRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.Collection;
import java.util.List;

@Service
@RequiredArgsConstructor
public class NotificationService {

    private final NotificationRepository notificationRepository;

    public Notification create(String title, String message, String type, String targetRole) {
        Notification notification = Notification.builder()
                .title(title)
                .message(message)
                .type(type)
                .targetRole(targetRole)
                .read(false)
                .build();
        return notificationRepository.save(notification);
    }

    public List<Notification> fetchForRoles(Collection<String> roles) {
        return notificationRepository.findTop50ByTargetRoleInOrderByCreatedAtDesc(roles);
    }

    public void markAsRead(Long notificationId) {
        Notification notification = notificationRepository.findById(notificationId).orElse(null);
        if (notification != null) {
            notification.setRead(true);
            notificationRepository.save(notification);
        }
    }
}
