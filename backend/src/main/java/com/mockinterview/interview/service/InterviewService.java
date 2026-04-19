package com.mockinterview.interview.service;

import com.mockinterview.ai.service.GeminiService;
import com.mockinterview.exception.ResourceNotFoundException;
import com.mockinterview.interview.dto.*;
import com.mockinterview.interview.model.*;
import com.mockinterview.interview.repository.*;
import com.mockinterview.jobrole.model.JobRole;
import com.mockinterview.jobrole.repository.JobRoleRepository;
import com.mockinterview.resume.repository.ResumeRepository;
import com.mockinterview.user.model.User;
import com.mockinterview.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.*;

@Service @RequiredArgsConstructor @Slf4j
public class InterviewService {

    private final InterviewSessionRepository sessionRepository;
    private final QuestionRepository questionRepository;
    private final AnswerRepository answerRepository;
    private final SessionScoreRepository sessionScoreRepository;
    private final UserRepository userRepository;
    private final JobRoleRepository jobRoleRepository;
    private final ResumeRepository resumeRepository;
    private final GeminiService geminiService;

    private static final int TOTAL_QUESTIONS = 5;

    @Transactional
    public SessionResponse startSession(Long userId, StartSessionRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        JobRole jobRole = jobRoleRepository.findById(request.getJobRoleId())
                .orElseThrow(() -> new ResourceNotFoundException("Job role not found"));

        String resumeContext = resumeRepository.findTopByUserIdOrderByUploadedAtDesc(userId)
                .map(r -> {
                    StringBuilder ctx = new StringBuilder();
                    if (r.getExtractedSkills() != null && !r.getExtractedSkills().isBlank())
                        ctx.append("Skills: ").append(r.getExtractedSkills()).append("\n");
                    if (r.getExperienceSummary() != null && !r.getExperienceSummary().isBlank())
                        ctx.append("Experience: ").append(r.getExperienceSummary(), 0,
                                Math.min(500, r.getExperienceSummary().length())).append("\n");
                    if (r.getEducationSummary() != null && !r.getEducationSummary().isBlank())
                        ctx.append("Education: ").append(r.getEducationSummary(), 0,
                                Math.min(300, r.getEducationSummary().length()));
                    return ctx.toString();
                }).orElse("");

        InterviewSession session = InterviewSession.builder()
                .user(user).jobRole(jobRole)
                .difficulty(request.getDifficulty())
                .interviewType(request.getInterviewType())
                .totalQuestions(request.getNumberOfQuestions() != null ? request.getNumberOfQuestions() : TOTAL_QUESTIONS)
                .resumeContext(resumeContext)
                .status(SessionStatus.IN_PROGRESS).build();

        InterviewSession saved = sessionRepository.save(session);

        Map<String, String> mcq = geminiService.generateInterviewQuestion(
                jobRole.getTitle(), resumeContext, request.getDifficulty(),
                request.getInterviewType(), 1, session.getTotalQuestions(), "");

        Question q1 = Question.builder().session(saved)
                .questionFormat(mcq.get("questionFormat") != null ? mcq.get("questionFormat") : "MCQ")
                .questionText(mcq.get("questionText"))
                .optionA(mcq.get("optionA")).optionB(mcq.get("optionB"))
                .optionC(mcq.get("optionC")).optionD(mcq.get("optionD"))
                .correctOption(mcq.get("correctOption"))
                .questionCategory(categoryFor(request.getInterviewType(), 1))
                .orderIndex(1).generatedByAI(true).build();

        return SessionResponse.builder()
                .sessionId(saved.getId()).jobRole(jobRole.getTitle())
                .difficulty(request.getDifficulty()).interviewType(request.getInterviewType())
                .totalQuestions(session.getTotalQuestions())
                .currentQuestion(toQuestionResponse(questionRepository.save(q1)))
                .status(SessionStatus.IN_PROGRESS).build();
    }

    @Transactional
    public AnswerFeedbackResponse submitAnswer(Long userId, Long sessionId, AnswerRequest request) {
        InterviewSession session = sessionRepository.findById(sessionId)
                .orElseThrow(() -> new ResourceNotFoundException("Session not found"));
        if (!session.getUser().getId().equals(userId))
            throw new SecurityException("Unauthorized access to session");
        if (session.getStatus() != SessionStatus.IN_PROGRESS)
            throw new IllegalStateException("Session is already completed or abandoned");

        Question question = questionRepository.findById(request.getQuestionId())
                .orElseThrow(() -> new ResourceNotFoundException("Question not found"));
        if (answerRepository.findByQuestionId(question.getId()).isPresent())
            throw new IllegalStateException("Question already answered");

        int score = 0;
        String feedback = "";
        String idealAnswer = "";
        String strengths = "";
        String areasForImprovement = "";

        if ("OPEN_ENDED".equals(question.getQuestionFormat())) {
            Map<String, Object> eval = geminiService.evaluateAnswer(
                question.getQuestionText(), request.getAnswerText(), session.getJobRole().getTitle(), session.getDifficulty());
            score = (Integer) eval.get("score");
            feedback = (String) eval.get("feedback");
            idealAnswer = (String) eval.get("idealAnswer");
            strengths = (String) eval.get("strengths");
            areasForImprovement = (String) eval.get("areasForImprovement");
        } else {
            boolean isCorrect = request.getAnswerText().equalsIgnoreCase(question.getCorrectOption());
            score = isCorrect ? 100 : 0;
            feedback = isCorrect ? "Correct!" : "Incorrect. The correct option was " + question.getCorrectOption() + ".";
            idealAnswer = question.getCorrectOption();
            strengths = isCorrect ? "Accurate knowledge application." : "";
            areasForImprovement = !isCorrect ? "Review this technical concept." : "";
        }

        Answer answer = Answer.builder()
                .question(question).answerText(request.getAnswerText())
                .score(score).feedback(feedback)
                .idealAnswer(idealAnswer)
                .strengths(strengths)
                .areasForImprovement(areasForImprovement).build();
        answerRepository.save(answer);

        List<Answer> allAnswers = answerRepository.findBySessionId(sessionId);
        int answeredCount = allAnswers.size();
        boolean isLast = answeredCount >= session.getTotalQuestions();

        QuestionResponse nextQuestion = null;
        if (!isLast) {
            nextQuestion = generateNextQuestion(session, question.getOrderIndex() + 1);
        } else {
            completeSession(session, allAnswers);
        }

        return AnswerFeedbackResponse.builder()
                .answerId(answer.getId()).score(score)
                .feedback(feedback).idealAnswer(question.getCorrectOption())
                .areasForImprovement(areasForImprovement)
                .nextQuestion(nextQuestion).isSessionComplete(isLast)
                .questionNumber(answeredCount).totalQuestions(session.getTotalQuestions()).build();
    }

    @Transactional
    public void abandonSession(Long userId, Long sessionId) {
        InterviewSession session = sessionRepository.findById(sessionId)
                .orElseThrow(() -> new ResourceNotFoundException("Session not found"));
        if (!session.getUser().getId().equals(userId)) throw new SecurityException("Unauthorized");
        session.setStatus(SessionStatus.ABANDONED);
        session.setCompletedAt(LocalDateTime.now());
        sessionRepository.save(session);
    }

    public List<QuestionResponse> getSessionQuestions(Long userId, Long sessionId) {
        InterviewSession session = sessionRepository.findById(sessionId)
                .orElseThrow(() -> new ResourceNotFoundException("Session not found"));
        if (!session.getUser().getId().equals(userId)) throw new SecurityException("Unauthorized");
        return questionRepository.findBySessionIdOrderByOrderIndex(sessionId)
                .stream().map(this::toQuestionResponse).toList();
    }

    private QuestionResponse generateNextQuestion(InterviewSession session, int orderIndex) {
        List<Question> prev = questionRepository.findBySessionIdOrderByOrderIndex(session.getId());
        StringBuilder prevQA = new StringBuilder();
        for (Question q : prev) {
            prevQA.append("Q: ").append(q.getQuestionText()).append("\n");
            answerRepository.findByQuestionId(q.getId())
                    .ifPresent(a -> prevQA.append("A: ").append(a.getAnswerText()).append("\n\n"));
        }
        Map<String, String> mcq = geminiService.generateInterviewQuestion(
                session.getJobRole().getTitle(), session.getResumeContext(),
                session.getDifficulty(), session.getInterviewType(),
                orderIndex, session.getTotalQuestions(), prevQA.toString());
        Question q = Question.builder().session(session)
                .questionFormat(mcq.get("questionFormat") != null ? mcq.get("questionFormat") : "MCQ")
                .questionText(mcq.get("questionText"))
                .optionA(mcq.get("optionA")).optionB(mcq.get("optionB"))
                .optionC(mcq.get("optionC")).optionD(mcq.get("optionD"))
                .correctOption(mcq.get("correctOption"))
                .explanation(mcq.get("explanation"))
                .questionCategory(categoryFor(session.getInterviewType(), orderIndex))
                .orderIndex(orderIndex).generatedByAI(true).build();
        return toQuestionResponse(questionRepository.save(q));
    }

    @Transactional
    private void completeSession(InterviewSession session, List<Answer> answers) {
        List<Question> questions = questionRepository.findBySessionIdOrderByOrderIndex(session.getId());
        List<Map<String, String>> qaList = new ArrayList<>();
        for (Question q : questions) {
            Map<String, String> qa = new HashMap<>();
            qa.put("question", q.getQuestionText());
            answerRepository.findByQuestionId(q.getId()).ifPresent(a -> qa.put("answer", a.getAnswerText()));
            qaList.add(qa);
        }
        double avg = answers.stream().mapToInt(a -> a.getScore() != null ? a.getScore() : 70)
                .average().orElse(70.0);
        Map<String, Object> summary = geminiService.generateSessionSummary(
                session.getJobRole().getTitle(), qaList, avg);
        sessionScoreRepository.save(SessionScore.builder()
                .session(session).totalScore(avg)
                .technicalScore(toDouble(summary.get("technicalScore"), avg))
                .communicationScore(toDouble(summary.get("communicationScore"), avg))
                .problemSolvingScore(toDouble(summary.get("problemSolvingScore"), avg))
                .confidenceScore(toDouble(summary.get("confidenceScore"), avg))
                .relevanceScore(toDouble(summary.get("relevanceScore"), avg))
                .overallFeedback((String) summary.getOrDefault("overallFeedback", ""))
                .improvementTips((String) summary.getOrDefault("improvementTips", ""))
                .strengthsSummary((String) summary.getOrDefault("strengthsSummary", "")).build());
        session.setStatus(SessionStatus.COMPLETED);
        session.setCompletedAt(LocalDateTime.now());
        sessionRepository.save(session);
        log.info("Session {} completed. Score: {}", session.getId(), avg);
    }

    private QuestionResponse toQuestionResponse(Question q) {
        return QuestionResponse.builder().questionId(q.getId()).questionText(q.getQuestionText())
                .questionFormat(q.getQuestionFormat())
                .optionA(q.getOptionA()).optionB(q.getOptionB())
                .optionC(q.getOptionC()).optionD(q.getOptionD())
                .questionCategory(q.getQuestionCategory()).questionNumber(q.getOrderIndex()).build();
    }

    private QuestionCategory categoryFor(InterviewType type, int index) {
        return switch (type) {
            case TECHNICAL -> QuestionCategory.TECHNICAL;
            case BEHAVIORAL -> QuestionCategory.BEHAVIORAL;
            case MIXED -> (index % 2 == 0) ? QuestionCategory.TECHNICAL : QuestionCategory.BEHAVIORAL;
        };
    }

    public List<com.mockinterview.interview.dto.LeaderboardResponse> getGlobalLeaderboard() {
        return userRepository.getGlobalLeaderboard(org.springframework.data.domain.PageRequest.of(0, 100));
    }

    public Map<String, Object> getSessionReport(Long userId, Long sessionId) {
        InterviewSession session = sessionRepository.findById(sessionId)
                .orElseThrow(() -> new ResourceNotFoundException("Session not found"));
        if (!session.getUser().getId().equals(userId)) throw new SecurityException("Unauthorized");
        SessionScore score = sessionScoreRepository.findBySessionId(sessionId).orElse(null);
        if (score == null) return Map.of("status", "pending");

        List<Map<String, Object>> qaBreakdown = new ArrayList<>();
        List<Question> questions = questionRepository.findBySessionIdOrderByOrderIndex(sessionId);
        for (Question q : questions) {
            Map<String, Object> qDetail = new HashMap<>();
            qDetail.put("question", q.getQuestionText());
            qDetail.put("optionA", q.getOptionA());
            qDetail.put("optionB", q.getOptionB());
            qDetail.put("optionC", q.getOptionC());
            qDetail.put("optionD", q.getOptionD());
            qDetail.put("correctOption", q.getCorrectOption());
            
            Answer a = answerRepository.findByQuestionId(q.getId()).orElse(null);
            qDetail.put("userAnswer", a != null ? a.getAnswerText() : "Unanswered");
            qaBreakdown.add(qDetail);
        }

        return Map.of(
            "status", "completed",
            "totalScore", score.getTotalScore(),
            "technicalScore", score.getTechnicalScore(),
            "communicationScore", score.getCommunicationScore(),
            "overallFeedback", score.getOverallFeedback() != null ? score.getOverallFeedback() : "",
            "strengthsSummary", score.getStrengthsSummary() != null ? score.getStrengthsSummary() : "",
            "improvementTips", score.getImprovementTips() != null ? score.getImprovementTips() : "",
            "qaBreakdown", qaBreakdown
        );
    }

    private Double toDouble(Object val, double fallback) {
        if (val instanceof Number n) return n.doubleValue();
        return fallback;
    }

    @Transactional(readOnly = true)
    public List<SessionSummaryResponse> getAllUserSessions(Long userId) {
        List<InterviewSession> sessions = sessionRepository.findByUserIdOrderByCreatedAtDesc(userId);
        return sessions.stream().map(session -> {
            SessionScore score = sessionScoreRepository.findBySessionId(session.getId()).orElse(null);
            return SessionSummaryResponse.builder()
                    .sessionId(session.getId())
                    .jobRole(session.getJobRole().getTitle())
                    .difficulty(session.getDifficulty())
                    .interviewType(session.getInterviewType())
                    .status(session.getStatus())
                    .totalQuestions(session.getTotalQuestions())
                    .totalScore(score != null ? score.getTotalScore() : null)
                    .createdAt(session.getCreatedAt())
                    .completedAt(session.getCompletedAt())
                    .build();
        }).toList();
    }
}
