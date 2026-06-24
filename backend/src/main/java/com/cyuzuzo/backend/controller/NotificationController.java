package com.cyuzuzo.backend.controller;

import com.cyuzuzo.backend.model.NotificationCreateRequest;
import com.cyuzuzo.backend.model.NotificationItem;
import com.cyuzuzo.backend.service.ClaimDomainService;
import jakarta.validation.Valid;
import java.util.List;
import java.util.Map;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/notifications")
public class NotificationController {
    private final ClaimDomainService claimDomainService;

    public NotificationController(ClaimDomainService claimDomainService) {
        this.claimDomainService = claimDomainService;
    }

    @GetMapping
    public List<NotificationItem> listNotifications() {
        return claimDomainService.listNotifications();
    }

    @PatchMapping("/{id}/read")
    public ResponseEntity<?> markRead(@PathVariable String id) {
        claimDomainService.markNotificationRead(id);
        return ResponseEntity.ok(Map.of("message", "Notification marked as read."));
    }

    @PostMapping
    public ResponseEntity<?> create(@Valid @RequestBody NotificationCreateRequest request) {
        NotificationItem item = claimDomainService.publishNotification(
            request.title(),
            request.body(),
            request.status()
        );
        return ResponseEntity.ok(item);
    }
}
