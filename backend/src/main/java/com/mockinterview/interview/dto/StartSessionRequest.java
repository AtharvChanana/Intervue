package com.mockinterview.interview.dto;

import com.mockinterview.interview.model.Difficulty;
import com.mockinterview.interview.model.InterviewType;
import jakarta.validation.constraints.NotNull;
import lombok.*;

@Data @Builder @AllArgsConstructor @NoArgsConstructor
public class StartSessionRequest {
    private Long jobRoleId; // Used for predefined roles
    private String customJobRoleName; // Used for custom sessions (takes priority over jobRoleId)
    @NotNull(message = "Difficulty is required") private Difficulty difficulty;
    @NotNull(message = "Interview type is required") private InterviewType interviewType;
    @NotNull(message = "Number of questions is required") private Integer numberOfQuestions;
}
