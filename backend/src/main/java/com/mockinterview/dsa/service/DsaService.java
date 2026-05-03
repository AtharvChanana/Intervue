package com.mockinterview.dsa.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.mockinterview.ai.service.GeminiService;
import com.mockinterview.dsa.dto.DsaStartRequest;
import com.mockinterview.dsa.dto.DsaStartResponse;
import com.mockinterview.dsa.dto.DsaSubmitRequest;
import com.mockinterview.dsa.model.DsaSession;
import com.mockinterview.dsa.repository.DsaSessionRepository;
import com.mockinterview.exception.ResourceNotFoundException;
import com.mockinterview.user.model.User;
import com.mockinterview.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class DsaService {

    private final DsaSessionRepository dsaSessionRepository;
    private final UserRepository userRepository;
    private final GeminiService geminiService;
    private final ObjectMapper objectMapper = new ObjectMapper();

    @Transactional
    public DsaStartResponse startSession(Long userId, DsaStartRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        // 1. Generate problem from Gemini
        String problemJsonStr = geminiService.generateDsaProblem(request.getTopic(), request.getDifficulty());
        
        // 2. Save Session
        DsaSession session = DsaSession.builder()
                .user(user)
                .topic(request.getTopic())
                .difficulty(request.getDifficulty())
                .timerMinutes(request.getTimerMinutes())
                .problemJson(problemJsonStr)
                .status("ACTIVE")
                .build();
        session = dsaSessionRepository.save(session);

        // 3. Parse and return
        Map<String, Object> problemMap;
        try {
            problemMap = objectMapper.readValue(problemJsonStr, new TypeReference<Map<String, Object>>() {});
        } catch (Exception e) {
            problemMap = Map.of("title", "Error Parsing Problem", "description", problemJsonStr);
        }

        return DsaStartResponse.builder()
                .sessionId(session.getId())
                .topic(session.getTopic().name())
                .difficulty(session.getDifficulty().name())
                .timerMinutes(session.getTimerMinutes())
                .createdAt(session.getCreatedAt())
                .problem(problemMap)
                .build();
    }

    @Transactional
    public Map<String, Object> runSolution(Long userId, Long sessionId, DsaSubmitRequest request) {
        DsaSession session = dsaSessionRepository.findByIdAndUserId(sessionId, userId)
                .orElseThrow(() -> new ResourceNotFoundException("DSA Session not found"));

        if ("COMPLETED".equals(session.getStatus())) {
            throw new IllegalStateException("Session already completed");
        }

        // Just run simulation, do not save or mark completed
        String runJsonStr = geminiService.simulateRunCode(session.getProblemJson(), request.getCode(), request.getLanguage());

        Map<String, Object> response = new java.util.HashMap<>();
        try {
            response.put("runResult", objectMapper.readValue(runJsonStr, new TypeReference<Map<String, Object>>() {}));
        } catch (Exception e) {
            response.put("error", "Failed to parse simulated run JSON");
        }
        return response;
    }

    @Transactional
    public Map<String, Object> submitSolution(Long userId, Long sessionId, DsaSubmitRequest request) {
        DsaSession session = dsaSessionRepository.findByIdAndUserId(sessionId, userId)
                .orElseThrow(() -> new ResourceNotFoundException("DSA Session not found"));

        if ("COMPLETED".equals(session.getStatus())) {
            throw new IllegalStateException("Session already completed");
        }

        // 1. Evaluate code
        String evaluationJsonStr = geminiService.evaluateDsaCode(session.getProblemJson(), request.getCode(), request.getLanguage());

        // 2. Parse score
        Double score = 0.0;
        try {
            Map<String, Object> evalMap = objectMapper.readValue(evaluationJsonStr, new TypeReference<Map<String, Object>>() {});
            if (evalMap.containsKey("score")) {
                score = Double.valueOf(evalMap.get("score").toString());
            }
        } catch (Exception ignored) {}

        // 3. Update session
        session.setCode(request.getCode());
        session.setLanguage(request.getLanguage());
        session.setEvaluationJson(evaluationJsonStr);
        session.setScore(score);
        session.setStatus("COMPLETED");
        session.setCompletedAt(LocalDateTime.now());
        dsaSessionRepository.save(session);

        int maxXp = switch (session.getDifficulty()) {
            case INTERN -> 10;
            case EASY -> 20;
            case MEDIUM -> 50;
            case HARD -> 100;
            default -> 0;
        };
        int earnedXp = (int) (maxXp * (score / 100.0));
        
        User sessionUser = session.getUser();
        sessionUser.setXp((sessionUser.getXp() != null ? sessionUser.getXp() : 0) + earnedXp);
        userRepository.save(sessionUser);

        // 4. Return report
        return getReport(userId, sessionId);
    }

    @Transactional(readOnly = true)
    public Map<String, Object> getReport(Long userId, Long sessionId) {
        DsaSession session = dsaSessionRepository.findByIdAndUserId(sessionId, userId)
                .orElseThrow(() -> new ResourceNotFoundException("DSA Session not found"));

        Map<String, Object> response = new java.util.HashMap<>();
        response.put("sessionId", session.getId());
        response.put("status", session.getStatus());
        response.put("score", session.getScore());
        response.put("language", session.getLanguage());
        response.put("code", session.getCode());
        response.put("timerMinutes", session.getTimerMinutes());

        try {
            if (session.getProblemJson() != null) {
                response.put("problem", objectMapper.readValue(session.getProblemJson(), new TypeReference<Map<String, Object>>() {}));
            }
            if (session.getEvaluationJson() != null) {
                response.put("evaluation", objectMapper.readValue(session.getEvaluationJson(), new TypeReference<Map<String, Object>>() {}));
            }
        } catch (Exception e) {
            response.put("error", "Failed to parse JSON blocks");
        }

        return response;
    }

    @Transactional(readOnly = true)
    public List<Map<String, Object>> getAllUserSessions(Long userId) {
        return dsaSessionRepository.findByUserIdOrderByCreatedAtDesc(userId).stream()
                .map(s -> Map.<String,Object>of(
                        "sessionId", s.getId(),
                        "topic", s.getTopic().name(),
                        "difficulty", s.getDifficulty().name(),
                        "status", s.getStatus(),
                        "score", s.getScore() != null ? s.getScore() : 0,
                        "createdAt", s.getCreatedAt().toString()
                ))
                .collect(Collectors.toList());
    }
}
