package com.mockinterview.dsa.model;

import com.mockinterview.interview.model.Difficulty;
import com.mockinterview.user.model.User;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "dsa_sessions")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DsaSession {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private DsaTopic topic;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Difficulty difficulty;

    @Column(name = "timer_minutes")
    private Integer timerMinutes;

    @Column(nullable = false)
    private String status; // "ACTIVE" or "COMPLETED"

    @Column(name = "problem_json", columnDefinition = "TEXT")
    private String problemJson;

    @Column(columnDefinition = "TEXT")
    private String code;

    @Column
    private String language;

    @Column(name = "evaluation_json", columnDefinition = "TEXT")
    private String evaluationJson;

    @Column
    private Double score;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "completed_at")
    private LocalDateTime completedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        if (status == null) status = "ACTIVE";
    }
}
