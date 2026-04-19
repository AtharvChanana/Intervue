package com.mockinterview.admin.dto;

import lombok.*;

@Data @Builder @AllArgsConstructor @NoArgsConstructor
public class AdminStatsDto {
    private long totalUsers; private long totalSessions;
    private long completedSessions; private long totalJobRoles;
    private Double platformAverageScore;
}
