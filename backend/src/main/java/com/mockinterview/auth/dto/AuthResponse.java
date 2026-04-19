package com.mockinterview.auth.dto;

import com.mockinterview.user.model.Role;
import lombok.*;

@Data @Builder @AllArgsConstructor @NoArgsConstructor
public class AuthResponse {
    private String accessToken;
    private String refreshToken;
    private String tokenType = "Bearer";
    private Long userId;
    private String name;
    private String email;
    private Role role;
}
