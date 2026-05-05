package com.mockinterview.user.dto;

import com.mockinterview.user.model.Role;
import lombok.*;

import java.time.LocalDateTime;

@Data @Builder @AllArgsConstructor @NoArgsConstructor
public class UserProfileResponse {
    private Long id;
    private String name;
    private String email;
    private Role role;
    private String profilePictureUrl;
    private Integer age;
    private String currentJobRole;
    private LocalDateTime createdAt;
    private Boolean emailVerified;
    private Integer emailUpdateCount;
    private Integer xp;
    private Boolean banned;
}
