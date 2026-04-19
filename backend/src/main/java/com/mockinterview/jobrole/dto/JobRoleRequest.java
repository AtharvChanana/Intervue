package com.mockinterview.jobrole.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.*;

@Data @Builder @AllArgsConstructor @NoArgsConstructor
public class JobRoleRequest {
    @NotBlank(message = "Title is required") private String title;
    private String description; private String category; private String iconUrl;
}
