package com.mockinterview.websocket.dto;

import lombok.*;

@Data @Builder @AllArgsConstructor @NoArgsConstructor
public class WSAnswerMessage {
    private Long sessionId; private Long questionId; private String answerText;
}
