package com.mockinterview.interview.dto;

import com.mockinterview.interview.model.QuestionCategory;
import lombok.*;

@Data @Builder @AllArgsConstructor @NoArgsConstructor
public class QuestionResponse {
    private Long questionId;
    private String questionText;
    private String optionA;
    private String optionB;
    private String optionC;
    private String optionD;
    private QuestionCategory questionCategory;
    private Integer questionNumber;
    private String questionFormat;
}
