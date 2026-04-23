package com.mockinterview.dsa.controller;

import com.mockinterview.dsa.dto.DsaStartRequest;
import com.mockinterview.dsa.dto.DsaStartResponse;
import com.mockinterview.dsa.dto.DsaSubmitRequest;
import com.mockinterview.dsa.service.DsaService;
import com.mockinterview.user.model.User;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/dsa")
@RequiredArgsConstructor
public class DsaController {

    private final DsaService dsaService;

    @PostMapping("/start")
    public ResponseEntity<DsaStartResponse> startSession(
            @AuthenticationPrincipal User user,
            @Valid @RequestBody DsaStartRequest request) {
        return ResponseEntity.ok(dsaService.startSession(user.getId(), request));
    }

    @PostMapping("/{sessionId}/submit")
    public ResponseEntity<Map<String, Object>> submitSolution(
            @AuthenticationPrincipal User user,
            @PathVariable Long sessionId,
            @Valid @RequestBody DsaSubmitRequest request) {
        return ResponseEntity.ok(dsaService.submitSolution(user.getId(), sessionId, request));
    }

    @GetMapping("/{sessionId}/report")
    public ResponseEntity<Map<String, Object>> getReport(
            @AuthenticationPrincipal User user,
            @PathVariable Long sessionId) {
        return ResponseEntity.ok(dsaService.getReport(user.getId(), sessionId));
    }

    @GetMapping("/all")
    public ResponseEntity<List<Map<String, Object>>> getAllSessions(
            @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(dsaService.getAllUserSessions(user.getId()));
    }
}
