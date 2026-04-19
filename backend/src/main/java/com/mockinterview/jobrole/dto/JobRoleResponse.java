package com.mockinterview.jobrole.dto;

import lombok.*;

@Data @Builder @AllArgsConstructor @NoArgsConstructor
public class JobRoleResponse {
    private Long id; private String title; private String description;
    private String category; private String iconUrl; private boolean active;
}
