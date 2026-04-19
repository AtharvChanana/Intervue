package com.mockinterview.websocket.controller;

import com.mockinterview.interview.dto.AnswerFeedbackResponse;
import com.mockinterview.interview.dto.AnswerRequest;
import com.mockinterview.interview.service.InterviewService;
import com.mockinterview.user.model.User;
import com.mockinterview.websocket.dto.WSAnswerMessage;
import com.mockinterview.websocket.dto.WSQuestionMessage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.stereotype.Controller;

@Controller @RequiredArgsConstructor @Slf4j
public class InterviewWebSocketController {

    private final SimpMessagingTemplate messagingTemplate;
    private final InterviewService interviewService;

    @MessageMapping("/interview.answer")
    public void handleAnswer(@Payload WSAnswerMessage message, @AuthenticationPrincipal User user) {
        try {
            // Send typing indicator
            messagingTemplate.convertAndSendToUser(user.getUsername(), "/queue/interview",
                    WSQuestionMessage.builder().sessionId(message.getSessionId()).type("TYPING").build());

            AnswerFeedbackResponse response = interviewService.submitAnswer(user.getId(),
                    message.getSessionId(), new AnswerRequest(message.getQuestionId(), message.getAnswerText()));

            String type = response.isSessionComplete() ? "SESSION_COMPLETE" : "QUESTION";
            WSQuestionMessage next = WSQuestionMessage.builder()
                    .sessionId(message.getSessionId()).type(type).build();

            if (!response.isSessionComplete() && response.getNextQuestion() != null) {
                next.setQuestionId(response.getNextQuestion().getQuestionId());
                next.setQuestionText(response.getNextQuestion().getQuestionText());
                next.setQuestionNumber(response.getNextQuestion().getQuestionNumber());
                next.setCategory(response.getNextQuestion().getQuestionCategory() != null
                        ? response.getNextQuestion().getQuestionCategory().name() : null);
            }
            messagingTemplate.convertAndSendToUser(user.getUsername(), "/queue/interview", next);
        } catch (Exception e) { log.error("WebSocket error: {}", e.getMessage()); }
    }
}
