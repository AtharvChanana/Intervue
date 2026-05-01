package com.mockinterview.user.service;

import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class EmailService {

    private final JavaMailSender javaMailSender;

    @Value("${spring.mail.username}")
    private String senderEmail;

    public void sendEmail(String to, String subject, String body) {
        java.util.concurrent.CompletableFuture.runAsync(() -> {
            try {
                SimpleMailMessage message = new SimpleMailMessage();
                message.setFrom(senderEmail);
                message.setTo(to);
                message.setSubject(subject);
                message.setText(body);
                javaMailSender.send(message);
            } catch (Exception e) {
                System.err.println("Failed to send email to " + to + ": " + e.getMessage());
                // Fallback to console during missing config
                System.out.println("==================================================");
                System.out.println("[MOCK EMAIL FALLBACK] To: " + to);
                System.out.println("[MOCK EMAIL FALLBACK] Subject: " + subject);
                System.out.println("[MOCK EMAIL FALLBACK] Body: " + body);
                System.out.println("==================================================");
            }
        });
    }
}
