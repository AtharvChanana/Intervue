package com.mockinterview.resume.model;

import com.mockinterview.user.model.User;
import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity @Table(name = "resumes")
@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class Resume {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY) private Long id;
    @ManyToOne(fetch = FetchType.LAZY) @JoinColumn(name = "user_id", nullable = false) private User user;
    @Column(name = "file_name") private String fileName;
    @Column(name = "file_url") private String fileUrl;
    @Column(name = "parsed_text", columnDefinition = "TEXT") private String parsedText;
    @Column(name = "extracted_skills", columnDefinition = "TEXT") private String extractedSkills;
    @Column(name = "experience_summary", columnDefinition = "TEXT") private String experienceSummary;
    @Column(name = "education_summary", columnDefinition = "TEXT") private String educationSummary;
    @Column(name = "uploaded_at") private LocalDateTime uploadedAt;
    @PrePersist protected void onCreate() { uploadedAt = LocalDateTime.now(); }
}
