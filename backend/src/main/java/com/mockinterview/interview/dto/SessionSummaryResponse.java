package com.mockinterview.interview.dto;

import com.mockinterview.interview.model.Difficulty;
import com.mockinterview.interview.model.InterviewType;
import com.mockinterview.interview.model.SessionStatus;
import lombok.Builder;
import lombok.Data;
import java.time.LocalDateTime;

@Data
@Builder
@lombok.NoArgsConstructor
@lombok.AllArgsConstructor
public class SessionSummaryResponse {
    private Long sessionId;
    private String jobRole;
    private Difficulty difficulty;
    private InterviewType interviewType;
    private SessionStatus status;
    private Integer totalQuestions;
    private Double totalScore;
    private LocalDateTime createdAt;
    private LocalDateTime completedAt;
}
