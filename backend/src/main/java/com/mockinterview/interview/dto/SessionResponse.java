package com.mockinterview.interview.dto;

import com.mockinterview.interview.model.Difficulty;
import com.mockinterview.interview.model.InterviewType;
import com.mockinterview.interview.model.SessionStatus;
import lombok.*;

@Data @Builder @AllArgsConstructor @NoArgsConstructor
public class SessionResponse {
    private Long sessionId;
    private String jobRole;
    private Difficulty difficulty;
    private InterviewType interviewType;
    private Integer totalQuestions;
    private QuestionResponse currentQuestion;
    private SessionStatus status;
}
