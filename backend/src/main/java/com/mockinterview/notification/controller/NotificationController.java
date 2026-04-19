package com.mockinterview.notification.controller;

import com.mockinterview.notification.dto.NotificationDto;
import com.mockinterview.notification.service.NotificationService;
import com.mockinterview.user.model.User;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Map;

@RestController @RequestMapping("/api/notifications") @RequiredArgsConstructor
public class NotificationController {
    private final NotificationService notificationService;

    @GetMapping public ResponseEntity<List<NotificationDto>> getAll(@AuthenticationPrincipal User user) {
        return ResponseEntity.ok(notificationService.getAll(user.getId()));
    }
    @GetMapping("/unread") public ResponseEntity<List<NotificationDto>> getUnread(@AuthenticationPrincipal User user) {
        return ResponseEntity.ok(notificationService.getUnread(user.getId()));
    }
    @GetMapping("/unread/count") public ResponseEntity<Map<String,Long>> getCount(@AuthenticationPrincipal User user) {
        return ResponseEntity.ok(Map.of("count", notificationService.getUnreadCount(user.getId())));
    }
    @PatchMapping("/{id}/read") public ResponseEntity<Void> markRead(@AuthenticationPrincipal User user, @PathVariable Long id) {
        notificationService.markAsRead(id, user.getId()); return ResponseEntity.ok().build();
    }
    @PatchMapping("/read-all") public ResponseEntity<Void> markAllRead(@AuthenticationPrincipal User user) {
        notificationService.markAllAsRead(user.getId()); return ResponseEntity.ok().build();
    }
}
