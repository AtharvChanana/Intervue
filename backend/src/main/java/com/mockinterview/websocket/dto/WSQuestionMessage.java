package com.mockinterview.websocket.dto;

import lombok.*;

@Data @Builder @AllArgsConstructor @NoArgsConstructor
public class WSQuestionMessage {
    private Long sessionId; private Long questionId;
    private String questionText; private Integer questionNumber;
    private Integer totalQuestions; private String category;
    private String type; // "QUESTION" | "SESSION_COMPLETE" | "TYPING"
}
