package com.mockinterview.dsa.dto;

import com.mockinterview.dsa.model.DsaTopic;
import com.mockinterview.interview.model.Difficulty;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class DsaStartRequest {
    @NotNull(message = "Topic is required")
    private DsaTopic topic;

    @NotNull(message = "Difficulty is required")
    private Difficulty difficulty;

    private Integer timerMinutes; // null means unlimited
}
