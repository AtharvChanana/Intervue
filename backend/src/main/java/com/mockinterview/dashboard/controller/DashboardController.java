package com.mockinterview.dashboard.controller;

import com.mockinterview.dashboard.dto.*;
import com.mockinterview.dashboard.service.DashboardService;
import com.mockinterview.user.model.User;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController @RequestMapping("/api/dashboard") @RequiredArgsConstructor
public class DashboardController {
    private final DashboardService dashboardService;

    @GetMapping("/stats")
    public ResponseEntity<DashboardStatsDto> getStats(@AuthenticationPrincipal User user) {
        return ResponseEntity.ok(dashboardService.getStats(user.getId()));
    }
    @GetMapping("/history")
    public ResponseEntity<List<SessionHistoryDto>> getHistory(@AuthenticationPrincipal User user) {
        return ResponseEntity.ok(dashboardService.getHistory(user.getId()));
    }
    @GetMapping("/session/{sessionId}")
    public ResponseEntity<SessionReportDto> getReport(@AuthenticationPrincipal User user,
                                                       @PathVariable Long sessionId) {
        return ResponseEntity.ok(dashboardService.getSessionReport(user.getId(), sessionId));
    }
}
