package com.mockinterview.admin.dto;

import lombok.*;
import java.time.LocalDateTime;

@Data @Builder @AllArgsConstructor @NoArgsConstructor
public class AdminSessionDto {
    private Long id;
    private String userName;
    private String userEmail;
    private String jobRole;
    private String difficulty;
    private String interviewType;
    private String status;
    private Double score;
    private LocalDateTime createdAt;
}
