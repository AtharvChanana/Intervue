package com.mockinterview.interview.model;

import com.mockinterview.jobrole.model.JobRole;
import com.mockinterview.user.model.User;
import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity @Table(name = "interview_sessions")
@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class InterviewSession {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "role_id", nullable = false)
    private JobRole jobRole;

    @Enumerated(EnumType.STRING) @Column(nullable = false)
    private Difficulty difficulty;

    @Enumerated(EnumType.STRING) @Column(name = "interview_type", nullable = false)
    private InterviewType interviewType;

    @Enumerated(EnumType.STRING) @Column(nullable = false)
    private SessionStatus status;

    @Builder.Default
    @Column(name = "total_questions")
    private Integer totalQuestions = 5;

    @Column(name = "resume_context", columnDefinition = "TEXT")
    private String resumeContext;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "completed_at")
    private LocalDateTime completedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        if (status == null) status = SessionStatus.IN_PROGRESS;
    }

    @OneToMany(mappedBy = "session", cascade = CascadeType.ALL, orphanRemoval = true)
    private java.util.List<Question> questions;
}
