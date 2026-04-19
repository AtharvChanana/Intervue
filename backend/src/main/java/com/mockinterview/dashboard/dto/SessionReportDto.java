package com.mockinterview.dashboard.dto;

import com.mockinterview.interview.model.Difficulty;
import com.mockinterview.interview.model.InterviewType;
import lombok.*;
import java.time.LocalDateTime;
import java.util.List;

@Data @Builder @AllArgsConstructor @NoArgsConstructor
public class SessionReportDto {
    private Long sessionId; private String jobRole;
    private Difficulty difficulty; private InterviewType interviewType;
    private Double totalScore; private Double technicalScore; private Double communicationScore;
    private Double problemSolvingScore; private Double confidenceScore; private Double relevanceScore;
    private String overallFeedback; private String improvementTips; private String strengthsSummary;
    private List<QuestionAnswerDetail> questionAnswers;
    private LocalDateTime completedAt;

    @Data @Builder @AllArgsConstructor @NoArgsConstructor
    public static class QuestionAnswerDetail {
        private Integer questionNumber; private String questionText;
        private String answerText; private Integer score;
        private String feedback; private String idealAnswer;
        private String strengths; private String areasForImprovement;
    }
}
