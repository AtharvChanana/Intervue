package com.mockinterview.interview.controller;

import com.mockinterview.interview.dto.*;
import com.mockinterview.interview.service.InterviewService;
import com.mockinterview.user.model.User;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/interview")
@RequiredArgsConstructor
public class InterviewController {

    private final InterviewService interviewService;

    @PostMapping("/start")
    public ResponseEntity<SessionResponse> startSession(
            @AuthenticationPrincipal User user,
            @Valid @RequestBody StartSessionRequest request) {
        return ResponseEntity.ok(interviewService.startSession(user.getId(), request));
    }

    @PostMapping("/{sessionId}/answer")
    public ResponseEntity<AnswerFeedbackResponse> submitAnswer(
            @AuthenticationPrincipal User user,
            @PathVariable Long sessionId,
            @Valid @RequestBody AnswerRequest request) {
        return ResponseEntity.ok(interviewService.submitAnswer(user.getId(), sessionId, request));
    }

    @PostMapping("/{sessionId}/abandon")
    public ResponseEntity<Void> abandonSession(
            @AuthenticationPrincipal User user, @PathVariable Long sessionId) {
        interviewService.abandonSession(user.getId(), sessionId);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/{sessionId}/questions")
    public ResponseEntity<List<QuestionResponse>> getQuestions(
            @AuthenticationPrincipal User user, @PathVariable Long sessionId) {
        return ResponseEntity.ok(interviewService.getSessionQuestions(user.getId(), sessionId));
    }

    @GetMapping("/{sessionId}/score")
    public ResponseEntity<java.util.Map<String, Object>> getSessionScore(
            @AuthenticationPrincipal User user, @PathVariable Long sessionId) {
        return ResponseEntity.ok(interviewService.getSessionReport(user.getId(), sessionId));
    }
    @GetMapping("/all")
    public ResponseEntity<List<SessionSummaryResponse>> getAllSessions(@AuthenticationPrincipal User user) {
        return ResponseEntity.ok(interviewService.getAllUserSessions(user.getId()));
    }

    @GetMapping("/leaderboard")
    public ResponseEntity<List<com.mockinterview.interview.dto.LeaderboardResponse>> getLeaderboard() {
        return ResponseEntity.ok(interviewService.getGlobalLeaderboard());
    }
}
