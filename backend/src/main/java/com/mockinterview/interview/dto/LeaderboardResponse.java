package com.mockinterview.interview.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LeaderboardResponse {
    private String name;
    private String email;
    private String currentJobRole;
    private Double totalScore;
    private String profilePictureUrl;
}
