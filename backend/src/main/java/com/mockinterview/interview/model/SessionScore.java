package com.mockinterview.interview.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity @Table(name = "session_scores")
@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class SessionScore {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "session_id", nullable = false)
    private InterviewSession session;

    @Column(name = "total_score") private Double totalScore;
    @Column(name = "technical_score") private Double technicalScore;
    @Column(name = "communication_score") private Double communicationScore;
    @Column(name = "problem_solving_score") private Double problemSolvingScore;
    @Column(name = "confidence_score") private Double confidenceScore;
    @Column(name = "relevance_score") private Double relevanceScore;

    @Column(name = "overall_feedback", columnDefinition = "TEXT") private String overallFeedback;
    @Column(name = "improvement_tips", columnDefinition = "TEXT") private String improvementTips;
    @Column(name = "strengths_summary", columnDefinition = "TEXT") private String strengthsSummary;

    @Column(name = "calculated_at") private LocalDateTime calculatedAt;

    @PrePersist
    protected void onCreate() { calculatedAt = LocalDateTime.now(); }
}
