package com.mockinterview.notification.model;

import com.mockinterview.user.model.User;
import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity @Table(name = "notifications")
@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class Notification {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY) private Long id;
    @ManyToOne(fetch = FetchType.LAZY) @JoinColumn(name = "user_id", nullable = false) private User user;
    @Column(nullable = false) private String title;
    @Column(columnDefinition = "TEXT") private String message;
    @Enumerated(EnumType.STRING) @Column(nullable = false) private NotificationType type;
    @Builder.Default @Column(name = "is_read") private boolean read = false;
    @Column(name = "created_at") private LocalDateTime createdAt;
    @PrePersist protected void onCreate() { createdAt = LocalDateTime.now(); }
}
