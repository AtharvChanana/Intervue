package com.mockinterview.dashboard.dto;

import lombok.*;

@Data @Builder @AllArgsConstructor @NoArgsConstructor
public class DashboardStatsDto {
    private long totalSessions; private long completedSessions;
    private long abandonedSessions; private Double averageScore;
    private long distinctRolesPracticed;
}
