package com.example.notifications.controller;

import com.example.hrms_platform_document.enums.DocumentStatus;
import com.example.hrms_platform_document.repository.DocumentRepository;
import com.example.notifications.dto.NotificationResponse;
import com.example.notifications.model.Notification;
import com.example.notifications.service.NotificationService;
import com.example.time.repository.LeaveRequestRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Collection;
import java.util.List;

@RestController
@RequestMapping("/api/v1/notifications")
@RequiredArgsConstructor
public class NotificationController {

    private final NotificationService notificationService;
    private final DocumentRepository documentRepository;
    private final LeaveRequestRepository leaveRequestRepository;

    @GetMapping
    public ResponseEntity<List<NotificationResponse>> list(Authentication authentication) {
        Collection<? extends GrantedAuthority> authorities =
                authentication == null ? List.of() : authentication.getAuthorities();

        boolean isAdmin = authorities.stream().anyMatch(a -> "ROLE_ADMIN".equals(a.getAuthority()));
        boolean isHr = authorities.stream().anyMatch(a ->
                a.getAuthority().startsWith("ROLE_HR") || "ROLE_TALENT_ACQUISITION".equals(a.getAuthority()));

        List<String> targetRoles = new ArrayList<>();
        targetRoles.add("ALL");
        if (isAdmin) {
            targetRoles.add("ADMIN");
        }
        if (isHr) {
            targetRoles.add("HR");
        }

        List<NotificationResponse> responses = new ArrayList<>();

        if (isHr) {
            long pendingDocs = documentRepository.countByStatus(DocumentStatus.PENDING_VERIFICATION);
            if (pendingDocs > 0) {
                responses.add(NotificationResponse.builder()
                        .title("Pending documents")
                        .message(pendingDocs + " document(s) need verification")
                        .type("PENDING_DOCUMENTS")
                        .createdAt(LocalDateTime.now())
                        .read(false)
                        .synthetic(true)
                        .build());
            }

            long pendingLeaves = leaveRequestRepository.countByStatus("PENDING");
            if (pendingLeaves > 0) {
                responses.add(NotificationResponse.builder()
                        .title("Pending leave requests")
                        .message(pendingLeaves + " leave request(s) awaiting approval")
                        .type("PENDING_LEAVES")
                        .createdAt(LocalDateTime.now())
                        .read(false)
                        .synthetic(true)
                        .build());
            }
        }

        List<Notification> stored = notificationService.fetchForRoles(targetRoles);
        for (Notification notification : stored) {
            responses.add(NotificationResponse.builder()
                    .id(notification.getId())
                    .title(notification.getTitle())
                    .message(notification.getMessage())
                    .type(notification.getType())
                    .createdAt(notification.getCreatedAt())
                    .read(notification.isRead())
                    .synthetic(false)
                    .build());
        }

        return ResponseEntity.ok(responses);
    }

    @PutMapping("/{id}/read")
    public ResponseEntity<Void> markAsRead(@PathVariable Long id) {
        notificationService.markAsRead(id);
        return ResponseEntity.ok().build();
    }
}
