package com.mockinterview.resume.service;

import com.mockinterview.exception.ResourceNotFoundException;
import com.mockinterview.resume.dto.ResumeResponse;
import com.mockinterview.resume.model.Resume;
import com.mockinterview.resume.repository.ResumeRepository;
import com.mockinterview.user.model.User;
import com.mockinterview.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.text.PDFTextStripper;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.*;
import java.util.Optional;
import java.util.UUID;

@Service @RequiredArgsConstructor @Slf4j
public class ResumeService {

    @Value("${file.upload-dir}") private String uploadDir;
    private final ResumeRepository resumeRepository;
    private final UserRepository userRepository;
    private final com.mockinterview.ai.service.GeminiService geminiService;

    public ResumeResponse uploadResume(Long userId, MultipartFile file) throws IOException {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        if (file.isEmpty()) throw new IllegalArgumentException("File is empty");
        String name = file.getOriginalFilename();
        if (name == null || !name.toLowerCase().endsWith(".pdf"))
            throw new IllegalArgumentException("Only PDF files are supported");

        String saved = UUID.randomUUID() + "_" + name;
        Path uploadPath = Paths.get(uploadDir);
        Files.createDirectories(uploadPath);
        Files.copy(file.getInputStream(), uploadPath.resolve(saved), StandardCopyOption.REPLACE_EXISTING);

        String text = extractText(file);
        java.util.Map<String, String> analysis = geminiService.analyzeResume(text);

        Resume resume = Resume.builder().user(user).fileName(name).fileUrl("/uploads/" + saved)
                .parsedText(text)
                .extractedSkills(analysis.get("extractedSkills"))
                .experienceSummary(analysis.get("experienceSummary"))
                .educationSummary(analysis.get("educationSummary"))
                .build();
        return toResponse(resumeRepository.save(resume));
    }

    public Optional<ResumeResponse> getLatestResume(Long userId) {
        return resumeRepository.findTopByUserIdOrderByUploadedAtDesc(userId).map(this::toResponse);
    }

    @org.springframework.transaction.annotation.Transactional
    public void deleteResume(Long userId) {
        resumeRepository.deleteByUserId(userId);
    }

    private String extractText(MultipartFile file) {
        try (PDDocument doc = org.apache.pdfbox.Loader.loadPDF(file.getBytes())) {
            return new PDFTextStripper().getText(doc);
        } catch (IOException e) { log.error("PDF parse error: {}", e.getMessage()); return ""; }
    }



    private ResumeResponse toResponse(Resume r) {
        return ResumeResponse.builder().id(r.getId()).fileName(r.getFileName())
                .fileUrl(r.getFileUrl()).extractedSkills(r.getExtractedSkills())
                .experienceSummary(r.getExperienceSummary()).educationSummary(r.getEducationSummary())
                .uploadedAt(r.getUploadedAt()).build();
    }
}
