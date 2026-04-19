package com.mockinterview.dashboard.service;

import com.mockinterview.dashboard.dto.*;
import com.mockinterview.exception.ResourceNotFoundException;
import com.mockinterview.interview.model.*;
import com.mockinterview.interview.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;

@Service @RequiredArgsConstructor @Transactional(readOnly = true)
public class DashboardService {

    private final InterviewSessionRepository sessionRepository;
    private final SessionScoreRepository scoreRepository;
    private final QuestionRepository questionRepository;
    private final AnswerRepository answerRepository;

    public DashboardStatsDto getStats(Long userId) {
        long total = sessionRepository.countByUserId(userId);
        long completed = sessionRepository.countByUserIdAndStatus(userId, SessionStatus.COMPLETED);
        long abandoned = sessionRepository.countByUserIdAndStatus(userId, SessionStatus.ABANDONED);
        Double avg = scoreRepository.findAverageTotalScoreByUserId(userId);
        long roles = sessionRepository.countDistinctRolesByUserId(userId);
        return DashboardStatsDto.builder().totalSessions(total).completedSessions(completed)
                .abandonedSessions(abandoned)
                .averageScore(avg != null ? Math.round(avg * 10.0) / 10.0 : null)
                .distinctRolesPracticed(roles).build();
    }

    public List<SessionHistoryDto> getHistory(Long userId) {
        return sessionRepository.findByUserIdOrderByCreatedAtDesc(userId).stream().map(s -> {
            Double score = scoreRepository.findBySessionId(s.getId())
                    .map(SessionScore::getTotalScore).orElse(null);
            return SessionHistoryDto.builder().sessionId(s.getId()).jobRole(s.getJobRole().getTitle())
                    .difficulty(s.getDifficulty()).interviewType(s.getInterviewType())
                    .status(s.getStatus()).totalScore(score)
                    .createdAt(s.getCreatedAt()).completedAt(s.getCompletedAt()).build();
        }).toList();
    }

    public SessionReportDto getSessionReport(Long userId, Long sessionId) {
        InterviewSession session = sessionRepository.findById(sessionId)
                .orElseThrow(() -> new ResourceNotFoundException("Session not found"));
        if (!session.getUser().getId().equals(userId)) throw new SecurityException("Unauthorized");

        SessionScore score = scoreRepository.findBySessionId(sessionId).orElse(null);
        List<SessionReportDto.QuestionAnswerDetail> details = questionRepository
                .findBySessionIdOrderByOrderIndex(sessionId).stream().map(q -> {
                    var a = answerRepository.findByQuestionId(q.getId()).orElse(null);
                    return SessionReportDto.QuestionAnswerDetail.builder()
                            .questionNumber(q.getOrderIndex()).questionText(q.getQuestionText())
                            .answerText(a != null ? a.getAnswerText() : "Not answered")
                            .score(a != null ? a.getScore() : null)
                            .feedback(a != null ? a.getFeedback() : null)
                            .idealAnswer(a != null ? a.getIdealAnswer() : null)
                            .strengths(a != null ? a.getStrengths() : null)
                            .areasForImprovement(a != null ? a.getAreasForImprovement() : null).build();
                }).toList();

        return SessionReportDto.builder().sessionId(session.getId())
                .jobRole(session.getJobRole().getTitle()).difficulty(session.getDifficulty())
                .interviewType(session.getInterviewType())
                .totalScore(score != null ? score.getTotalScore() : null)
                .technicalScore(score != null ? score.getTechnicalScore() : null)
                .communicationScore(score != null ? score.getCommunicationScore() : null)
                .problemSolvingScore(score != null ? score.getProblemSolvingScore() : null)
                .confidenceScore(score != null ? score.getConfidenceScore() : null)
                .relevanceScore(score != null ? score.getRelevanceScore() : null)
                .overallFeedback(score != null ? score.getOverallFeedback() : null)
                .improvementTips(score != null ? score.getImprovementTips() : null)
                .strengthsSummary(score != null ? score.getStrengthsSummary() : null)
                .questionAnswers(details).completedAt(session.getCompletedAt()).build();
    }
}
