package com.mockinterview.dashboard.dto;

import com.mockinterview.interview.model.Difficulty;
import com.mockinterview.interview.model.InterviewType;
import com.mockinterview.interview.model.SessionStatus;
import lombok.*;
import java.time.LocalDateTime;

@Data @Builder @AllArgsConstructor @NoArgsConstructor
public class SessionHistoryDto {
    private Long sessionId; private String jobRole;
    private Difficulty difficulty; private InterviewType interviewType;
    private SessionStatus status; private Double totalScore;
    private LocalDateTime createdAt; private LocalDateTime completedAt;
}
