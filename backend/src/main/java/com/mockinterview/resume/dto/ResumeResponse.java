package com.mockinterview.resume.dto;

import lombok.*;
import java.time.LocalDateTime;

@Data @Builder @AllArgsConstructor @NoArgsConstructor
public class ResumeResponse {
    private Long id;
    private String fileName;
    private String fileUrl;
    private String extractedSkills;
    private String experienceSummary;
    private String educationSummary;
    private LocalDateTime uploadedAt;
}
