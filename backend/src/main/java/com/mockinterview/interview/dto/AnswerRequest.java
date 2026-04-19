package com.mockinterview.interview.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.*;

@Data @Builder @AllArgsConstructor @NoArgsConstructor
public class AnswerRequest {
    @NotNull(message = "Question ID is required") private Long questionId;
    @NotBlank(message = "Answer text cannot be blank") private String answerText;
}
