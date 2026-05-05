package com.mockinterview.admin.controller;

import com.mockinterview.admin.model.SiteVisit;
import com.mockinterview.admin.repository.SiteVisitRepository;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDateTime;

@RestController
@RequestMapping("/api/analytics")
@RequiredArgsConstructor
public class AnalyticsController {

    private final SiteVisitRepository siteVisitRepository;

    @PostMapping("/visit")
    public ResponseEntity<Void> recordVisit(HttpServletRequest request) {
        String ipAddress = request.getHeader("X-Forwarded-For");
        if (ipAddress == null || ipAddress.isEmpty() || "unknown".equalsIgnoreCase(ipAddress)) {
            ipAddress = request.getRemoteAddr();
        }

        SiteVisit visit = SiteVisit.builder()
                .ipAddress(ipAddress)
                .visitedAt(LocalDateTime.now())
                .build();
        
        siteVisitRepository.save(visit);
        return ResponseEntity.ok().build();
    }
}
