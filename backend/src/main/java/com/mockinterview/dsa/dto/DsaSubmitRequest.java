package com.mockinterview.dsa.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class DsaSubmitRequest {
    @NotBlank(message = "Code cannot be empty")
    private String code;

    @NotBlank(message = "Language is required")
    private String language;
}
