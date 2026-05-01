package com.mockinterview.user.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;

@Service
public class EmailService {

    @Value("${brevo.api.key:}")
    private String brevoApiKey;

    @Value("${spring.mail.username:intervue.admin@gmail.com}")
    private String senderEmail;

    private final HttpClient httpClient = HttpClient.newHttpClient();

    public void sendEmail(String to, String subject, String body) {
        if (brevoApiKey == null || brevoApiKey.isBlank()) {
            System.out.println("==================================================");
            System.out.println("[MOCK EMAIL - No Brevo API Key] To: " + to);
            System.out.println("[MOCK EMAIL] Subject: " + subject);
            System.out.println("[MOCK EMAIL] Body: " + body);
            System.out.println("==================================================");
            return;
        }

        try {
            String json = String.format(
                "{\"sender\":{\"email\":\"%s\",\"name\":\"Intervue\"},\"to\":[{\"email\":\"%s\"}],\"subject\":\"%s\",\"textContent\":\"%s\"}",
                senderEmail.replace("\"", "\\\""),
                to.replace("\"", "\\\""),
                subject.replace("\"", "\\\""),
                body.replace("\"", "\\\"").replace("\n", "\\n")
            );

            HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create("https://api.brevo.com/v3/smtp/email"))
                .header("Content-Type", "application/json")
                .header("api-key", brevoApiKey)
                .POST(HttpRequest.BodyPublishers.ofString(json))
                .build();

            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());

            if (response.statusCode() >= 200 && response.statusCode() < 300) {
                System.out.println("[EMAIL] Successfully sent to " + to);
            } else {
                System.err.println("[EMAIL ERROR] Brevo API returned " + response.statusCode() + ": " + response.body());
                throw new RuntimeException("Email delivery failed: " + response.body());
            }
        } catch (RuntimeException e) {
            throw e;
        } catch (Exception e) {
            System.err.println("[EMAIL ERROR] " + e.getMessage());
            throw new RuntimeException("Failed to send email: " + e.getMessage(), e);
        }
    }
}
