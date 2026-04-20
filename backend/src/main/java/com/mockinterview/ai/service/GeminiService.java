package com.mockinterview.ai.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.mockinterview.interview.model.Difficulty;
import com.mockinterview.interview.model.InterviewType;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.*;

@Service @RequiredArgsConstructor @Slf4j
public class GeminiService {

    @Value("${gemini.api.key}") private String apiKey;
    @Value("${gemini.api.url}") private String apiUrl;

    @Value("${groq.api.key:}") private String groqApiKey;
    private final String GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";

    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper = new ObjectMapper();

    public Map<String, String> generateInterviewQuestion(String jobRole, String resumeContext, Difficulty difficulty,
            InterviewType interviewType, int questionNumber, int totalQuestions, String previousQA) {
        StringBuilder sb = new StringBuilder();
        sb.append("You are an expert technical interviewer.\n\n");
        sb.append("Role: ").append(jobRole).append("\nDifficulty: ").append(difficulty.name());
        sb.append("\nInterview Type: ").append(interviewType.name());
        sb.append("\nQuestion ").append(questionNumber).append(" of ").append(totalQuestions).append("\n\n");
        if (resumeContext != null && !resumeContext.isBlank())
            sb.append("Candidate Background:\n").append(resumeContext).append("\n\n");
        if (previousQA != null && !previousQA.isBlank())
            sb.append("Previous Q&A (do NOT repeat topics):\n").append(previousQA).append("\n\n");
        sb.append("Generate ONE focused interview question. ");
        String targetFormat = questionNumber % 2 != 0 ? "MCQ" : "OPEN_ENDED";
        sb.append("You MUST generate an interview question exactly of this format: ").append(targetFormat).append(". ");
        if ("MCQ".equals(targetFormat)) {
            sb.append("Provide 4 distinct options (A, B, C, D) and specify the correct option. ");
        } else {
            sb.append("Do NOT provide any options because the candidate will type their answer. ");
        }
        switch (interviewType) {
            case TECHNICAL -> sb.append("Focus on technical knowledge, algorithms, or system design.");
            case BEHAVIORAL -> sb.append("Use STAR-method style: past experiences, teamwork, leadership.");
            case MIXED -> sb.append(questionNumber % 2 == 0 ? "Ask a technical question." : "Ask a behavioral question.");
        }
        sb.append("\n\nRespond with ONLY valid JSON (no markdown): ");
        if ("MCQ".equals(targetFormat)) {
            sb.append("{\"questionFormat\":\"MCQ\", \"questionText\":\"<question>\", \"optionA\":\"<optA>\", \"optionB\":\"<optB>\", \"optionC\":\"<optC>\", \"optionD\":\"<optD>\", \"correctOption\":\"<A/B/C/D>\", \"explanation\":\"<brief explanation>\"}");
        } else {
            sb.append("{\"questionFormat\":\"OPEN_ENDED\", \"questionText\":\"<question>\", \"optionA\":\"\", \"optionB\":\"\", \"optionC\":\"\", \"optionD\":\"\", \"correctOption\":\"\", \"explanation\":\"\"}");
        }
        return parseQuestionGen(callGemini(sb.toString()));
    }

    public Map<String, Object> evaluateAnswer(String question, String answer, String jobRole, Difficulty difficulty) {
        String prompt = String.format("""
            You are an expert interviewer evaluating a candidate for a %s position.
            Question: %s
            Candidate's Answer: %s
            Difficulty: %s
            
            CRITICAL INSTRUCTION: Analyze the Candidate's Answer rigorously. If the answer contains random words, gibberish, single letters, is entirely off-topic, or is empty, you MUST assign a score of 0 / 100 for all metrics and explicitly state in the feedback that the answer was invalid, unrelated, or gibberish. Do not be polite to gibberish.

            Respond with ONLY valid JSON (no markdown):
            {"score":<0-100>,"feedback":"<feedback>","idealAnswer":"<ideal>","strengths":"<strengths>",
            "areasForImprovement":"<areas>","technicalScore":<0-100>,"communicationScore":<0-100>,"relevanceScore":<0-100>}
            """, jobRole, question, answer, difficulty.name());
        return parseEval(callGemini(prompt));
    }

    public Map<String, Object> generateSessionSummary(String jobRole, List<Map<String, String>> qaList, double avgScore) {
        StringBuilder qa = new StringBuilder();
        for (int i = 0; i < qaList.size(); i++) {
            qa.append("Q").append(i+1).append(": ").append(qaList.get(i).get("question")).append("\n");
            qa.append("A").append(i+1).append(": ").append(qaList.get(i).getOrDefault("answer","N/A")).append("\n\n");
        }
        String prompt = String.format("""
            Analyze this mock interview for a %s position. Average Score: %.1f/100
            Q&A: %s
            Respond with ONLY valid JSON (no markdown):
            {"overallFeedback":"<feedback>","strengthsSummary":"<strengths>","improvementTips":"<tips>",
            "technicalScore":<0-100>,"communicationScore":<0-100>,"problemSolvingScore":<0-100>,
            "confidenceScore":<0-100>,"relevanceScore":<0-100>}
            """, jobRole, avgScore, qa);
        return parseSummary(callGemini(prompt));
    }

    public Map<String, String> analyzeResume(String rawText) {
        String prompt = "You are an expert technical recruiter analyzing a resume.\n" +
            "Raw Text:\n" + rawText + "\n\n" +
            "Extract the candidate's core technical skills, a summary of their work experience, and a summary of their education.\n" +
            "Respond with ONLY valid JSON (no markdown):\n" +
            "{\"extractedSkills\":\"<comma separated skills>\",\"experienceSummary\":\"<compelling summary of experience>\",\"educationSummary\":\"<summary of education levels>\"}";
        return parseResume(callGemini(prompt));
    }

    private String callGemini(String prompt) {
        // === FAST PATH: Try Groq first (2-5s) if API key is configured ===
        if (groqApiKey != null && !groqApiKey.trim().isEmpty()) {
            try {
                return callGroq(prompt);
            } catch (Exception e) {
                log.warn("Groq primary failed ({}), falling back to Gemini.", e.getMessage());
            }
        }

        // === FALLBACK: Gemini ===
        int maxRetries = 2;
        for (int attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                Map<String, Object> body = Map.of(
                    "contents", List.of(Map.of("parts", List.of(Map.of("text", prompt)))),
                    "generationConfig", Map.of("temperature", 0.7, "maxOutputTokens", 512, "responseMimeType", "application/json"));
                HttpHeaders headers = new HttpHeaders();
                headers.setContentType(MediaType.APPLICATION_JSON);
                headers.set("x-goog-api-key", apiKey.trim());
                ResponseEntity<String> resp = restTemplate.exchange(
                    apiUrl, HttpMethod.POST, new HttpEntity<>(body, headers), String.class);
                if (resp.getStatusCode() == HttpStatus.OK && resp.getBody() != null) {
                    JsonNode root = objectMapper.readTree(resp.getBody());
                    return root.path("candidates").get(0).path("content").path("parts").get(0).path("text").asText("");
                }
            } catch (Exception e) {
                log.error("Gemini fallback error (attempt {}): {}", attempt, e.getMessage());
                if (attempt == maxRetries) {
                    return getHardcodedFallback(prompt);
                }
                try { Thread.sleep(2000); } catch (InterruptedException ie) { Thread.currentThread().interrupt(); }
            }
        }
        return getHardcodedFallback(prompt);
    }

    private String getHardcodedFallback(String prompt) {
        log.warn("All AI providers failed. Serving hardcoded fallback.");
        if (prompt.contains("\"extractedSkills\"")) {
            return "{\"extractedSkills\":\"Java, Spring Boot, React, Next.js\",\"experienceSummary\":\"Strong automated fallback experience.\",\"educationSummary\":\"Computer Science\"}";
        } else if (prompt.contains("\"questionText\"")) {
            String[] mocks = {
                "{\"questionFormat\":\"MCQ\",\"questionText\":\"What is Dependency Injection?\",\"optionA\":\"A design pattern\",\"optionB\":\"A database table\",\"optionC\":\"A CSS framework\",\"optionD\":\"A security vulnerability\",\"correctOption\":\"A\",\"explanation\":\"A software engineering design pattern.\"}",
                "{\"questionFormat\":\"OPEN_ENDED\",\"questionText\":\"Explain how the Virtual DOM operates in React and why it improves performance.\",\"optionA\":\"\",\"optionB\":\"\",\"optionC\":\"\",\"optionD\":\"\",\"correctOption\":\"\",\"explanation\":\"\"}",
                "{\"questionFormat\":\"MCQ\",\"questionText\":\"What does a REST API rely on?\",\"optionA\":\"GraphQL schemas\",\"optionB\":\"HTTP methods statelessly\",\"optionC\":\"WebSockets\",\"optionD\":\"Direct SQL\",\"correctOption\":\"B\",\"explanation\":\"Stateless HTTP-based architecture.\"}"
            };
            return mocks[new java.util.Random().nextInt(mocks.length)];
        } else if (prompt.contains("\"overallFeedback\"")) {
            double avg = 70.0;
            java.util.regex.Matcher m = java.util.regex.Pattern.compile("Average Score: ([0-9.]+)").matcher(prompt);
            if (m.find()) { try { avg = Double.parseDouble(m.group(1)); } catch(Exception ignored){} }
            return "{\"overallFeedback\":\"Session completed successfully. Avg score: "+avg+".\",\"strengthsSummary\":\"Good foundational knowledge.\",\"improvementTips\":\"Keep practicing!\",\"technicalScore\":"+avg+",\"communicationScore\":"+avg+",\"problemSolvingScore\":"+avg+",\"confidenceScore\":"+avg+",\"relevanceScore\":"+avg+"}";
        } else if (prompt.contains("\"score\"")) {
            return "{\"score\":75,\"feedback\":\"Good attempt.\",\"idealAnswer\":\"A comprehensive and well-structured answer.\",\"strengths\":\"Clear communication.\",\"areasForImprovement\":\"Provide more specific examples.\",\"technicalScore\":75,\"communicationScore\":75,\"relevanceScore\":75}";
        }
        return "{}";
    }

    private String callGroq(String prompt) {
        if (groqApiKey == null || groqApiKey.trim().isEmpty()) {
            throw new RuntimeException("Missing groq.api.key in application.properties");
        }
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.setBearerAuth(groqApiKey);

        Map<String, Object> message = Map.of("role", "user", "content", prompt);
        Map<String, Object> body = Map.of(
            "model", "llama-3.1-8b-instant",
            "messages", List.of(message),
            "response_format", Map.of("type", "json_object")
        );

        org.springframework.http.ResponseEntity<String> response = restTemplate.postForEntity(
            GROQ_URL, new HttpEntity<>(body, headers), String.class);
        try {
            com.fasterxml.jackson.databind.JsonNode root = objectMapper.readTree(response.getBody());
            return root.path("choices").get(0).path("message").path("content").asText();
        } catch(Exception e) {
            throw new RuntimeException("Groq Parse Error: " + e.getMessage());
        }
    }

    private Map<String, Object> parseEval(String raw) {
        Map<String, Object> r = new HashMap<>();
        try {
            JsonNode n = objectMapper.readTree(clean(raw));
            r.put("score", n.path("score").asInt(70));
            r.put("feedback", n.path("feedback").asText("Good attempt."));
            r.put("idealAnswer", n.path("idealAnswer").asText(""));
            r.put("strengths", n.path("strengths").asText(""));
            r.put("areasForImprovement", n.path("areasForImprovement").asText(""));
            r.put("technicalScore", n.path("technicalScore").asInt(70));
            r.put("communicationScore", n.path("communicationScore").asInt(70));
            r.put("relevanceScore", n.path("relevanceScore").asInt(70));
        } catch (Exception e) {
            log.error("Eval parse error: {}", e.getMessage());
            r.put("score",70); r.put("feedback",raw); r.put("idealAnswer","");
            r.put("strengths",""); r.put("areasForImprovement","");
            r.put("technicalScore",70); r.put("communicationScore",70); r.put("relevanceScore",70);
        }
        return r;
    }

    private Map<String, String> parseQuestionGen(String raw) {
        Map<String, String> r = new HashMap<>();
        try {
            JsonNode n = objectMapper.readTree(clean(raw));
            r.put("questionFormat", n.path("questionFormat").asText("MCQ"));
            r.put("questionText", n.path("questionText").asText("Generated question?"));
            r.put("optionA", n.path("optionA").asText(""));
            r.put("optionB", n.path("optionB").asText(""));
            r.put("optionC", n.path("optionC").asText(""));
            r.put("optionD", n.path("optionD").asText(""));
            r.put("correctOption", n.path("correctOption").asText(""));
            r.put("explanation", n.path("explanation").asText(""));
        } catch (Exception e) {
            log.error("Gen parse error: {}", e.getMessage());
            r.put("questionFormat", "MCQ");
            r.put("questionText", "Error generating question.");
            r.put("optionA", "A"); r.put("optionB", "B"); r.put("optionC", "C"); r.put("optionD", "D");
            r.put("correctOption", "A"); r.put("explanation", "Error");
        }
        return r;
    }

    private Map<String, Object> parseSummary(String raw) {
        Map<String, Object> r = new HashMap<>();
        try {
            JsonNode n = objectMapper.readTree(clean(raw));
            r.put("overallFeedback", n.path("overallFeedback").asText("Session completed."));
            r.put("strengthsSummary", n.path("strengthsSummary").asText(""));
            r.put("improvementTips", n.path("improvementTips").asText(""));
            r.put("technicalScore", n.path("technicalScore").asDouble(70.0));
            r.put("communicationScore", n.path("communicationScore").asDouble(70.0));
            r.put("problemSolvingScore", n.path("problemSolvingScore").asDouble(70.0));
            r.put("confidenceScore", n.path("confidenceScore").asDouble(70.0));
            r.put("relevanceScore", n.path("relevanceScore").asDouble(70.0));
        } catch (Exception e) {
            log.error("Summary parse error: {}", e.getMessage());
            r.put("overallFeedback","Session completed."); r.put("strengthsSummary",""); r.put("improvementTips","");
            r.put("technicalScore",70.0); r.put("communicationScore",70.0); r.put("problemSolvingScore",70.0);
            r.put("confidenceScore",70.0); r.put("relevanceScore",70.0);
        }
        return r;
    }

    private Map<String, String> parseResume(String raw) {
        Map<String, String> r = new HashMap<>();
        try {
            JsonNode n = objectMapper.readTree(clean(raw));
            r.put("extractedSkills", n.path("extractedSkills").asText(""));
            r.put("experienceSummary", n.path("experienceSummary").asText("No experience listed."));
            r.put("educationSummary", n.path("educationSummary").asText("No education listed."));
        } catch (Exception e) {
            log.error("Resume parse error: {}", e.getMessage());
            r.put("extractedSkills", "");
            r.put("experienceSummary", "Failed to parse resume experiece.");
            r.put("educationSummary", "Failed to parse resume education.");
        }
        return r;
    }

    private String clean(String s) {
        s = s.trim();
        if (s.startsWith("```json")) s = s.substring(7);
        else if (s.startsWith("```")) s = s.substring(3);
        if (s.endsWith("```")) s = s.substring(0, s.length()-3);
        return s.trim();
    }
}
