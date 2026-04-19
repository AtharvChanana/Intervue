package com.mockinterview.interview.dto;

import lombok.*;

@Data @Builder @AllArgsConstructor @NoArgsConstructor
public class AnswerFeedbackResponse {
    private Long answerId;
    private Integer score;
    private String feedback;
    private String idealAnswer;
    private String strengths;
    private String areasForImprovement;
    private QuestionResponse nextQuestion;
    private boolean isSessionComplete;
    private int questionNumber;
    private int totalQuestions;
}
