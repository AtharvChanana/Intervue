package com.mockinterview.notification.dto;

import com.mockinterview.notification.model.NotificationType;
import lombok.*;
import java.time.LocalDateTime;

@Data @Builder @AllArgsConstructor @NoArgsConstructor
public class NotificationDto {
    private Long id; private String title; private String message;
    private NotificationType type; private boolean read; private LocalDateTime createdAt;
}
