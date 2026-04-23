package com.mockinterview.dsa.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DsaStartResponse {
    private Long sessionId;
    private String topic;
    private String difficulty;
    private Integer timerMinutes;
    private LocalDateTime createdAt;
    
    // We will parse the problemJson into a Map so it can easily be serialized
    private java.util.Map<String, Object> problem;
}
