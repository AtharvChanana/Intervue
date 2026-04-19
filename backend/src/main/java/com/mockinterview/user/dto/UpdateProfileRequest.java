package com.mockinterview.user.dto;

import lombok.*;

@Data @Builder @AllArgsConstructor @NoArgsConstructor
public class UpdateProfileRequest {
    private String name;
    private String profilePictureUrl;
    private Integer age;
    private String currentJobRole;
    private String oldPassword;
    private String password;
}
