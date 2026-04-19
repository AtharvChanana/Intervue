package com.mockinterview.resume.controller;

import com.mockinterview.resume.dto.ResumeResponse;
import com.mockinterview.resume.service.ResumeService;
import com.mockinterview.user.model.User;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import java.io.IOException;

@RestController @RequestMapping("/api/resume") @RequiredArgsConstructor
public class ResumeController {
    private final ResumeService resumeService;

    @PostMapping("/upload")
    public ResponseEntity<ResumeResponse> upload(@AuthenticationPrincipal User user,
                                                  @RequestParam("file") MultipartFile file) throws IOException {
        return ResponseEntity.ok(resumeService.uploadResume(user.getId(), file));
    }

    @GetMapping("/latest")
    public ResponseEntity<ResumeResponse> getLatest(@AuthenticationPrincipal User user) {
        return resumeService.getLatestResume(user.getId())
                .map(ResponseEntity::ok).orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping
    public ResponseEntity<Void> deleteResume(@AuthenticationPrincipal User user) {
        resumeService.deleteResume(user.getId());
        return ResponseEntity.noContent().build();
    }
}
