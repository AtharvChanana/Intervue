package com.mockinterview.jobrole.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity @Table(name = "job_roles")
@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class JobRole {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY) private Long id;
    @Column(nullable = false) private String title;
    @Column(columnDefinition = "TEXT") private String description;
    @Column private String category;
    @Column(name = "icon_url") private String iconUrl;
    @Column(name = "is_active") private boolean active = true;
    @Column(name = "created_at") private LocalDateTime createdAt;
    @PrePersist protected void onCreate() { createdAt = LocalDateTime.now(); }
}
