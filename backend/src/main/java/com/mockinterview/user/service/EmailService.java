package com.mockinterview.user.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;

@Service
public class EmailService {

    @Value("${brevo.api.key:}")
    private String brevoApiKey;

    @Value("${spring.mail.username:intervue.admin@gmail.com}")
    private String senderEmail;

    private final HttpClient httpClient = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(15))
            .build();

    public void sendEmail(String to, String subject, String body) {
        if (brevoApiKey == null || brevoApiKey.isBlank()) {
            System.out.println("[EMAIL] No BREVO_API_KEY configured. OTP printed below:");
            System.out.println("==================================================");
            System.out.println("[MOCK EMAIL] To: " + to);
            System.out.println("[MOCK EMAIL] Subject: " + subject);
            System.out.println("[MOCK EMAIL] Body: " + body);
            System.out.println("==================================================");
            // Don't throw - allow the flow to continue for local dev
            return;
        }

        String escapedTo = escapeJson(to);
        String escapedSubject = escapeJson(subject);
        String escapedBody = escapeJson(body);
        String escapedSender = escapeJson(senderEmail);

        String json = "{" +
            "\"sender\":{\"email\":\"" + escapedSender + "\",\"name\":\"Intervue\"}," +
            "\"to\":[{\"email\":\"" + escapedTo + "\"}]," +
            "\"subject\":\"" + escapedSubject + "\"," +
            "\"textContent\":\"" + escapedBody + "\"" +
            "}";

        try {
            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create("https://api.brevo.com/v3/smtp/email"))
                    .header("Content-Type", "application/json")
                    .header("accept", "application/json")
                    .header("api-key", brevoApiKey)
                    .POST(HttpRequest.BodyPublishers.ofString(json))
                    .timeout(Duration.ofSeconds(15))
                    .build();

            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());

            if (response.statusCode() >= 200 && response.statusCode() < 300) {
                System.out.println("[EMAIL] Successfully sent to " + to + " via Brevo");
            } else {
                String errorMsg = "Brevo API error " + response.statusCode() + ": " + response.body();
                System.err.println("[EMAIL ERROR] " + errorMsg);
                throw new RuntimeException(errorMsg);
            }
        } catch (RuntimeException e) {
            throw e;
        } catch (Exception e) {
            String errorMsg = "Failed to send email via Brevo: " + e.getMessage();
            System.err.println("[EMAIL ERROR] " + errorMsg);
            throw new RuntimeException(errorMsg, e);
        }
    }

    private String escapeJson(String value) {
        if (value == null) return "";
        return value
                .replace("\\", "\\\\")
                .replace("\"", "\\\"")
                .replace("\n", "\\n")
                .replace("\r", "\\r")
                .replace("\t", "\\t");
    }
}
