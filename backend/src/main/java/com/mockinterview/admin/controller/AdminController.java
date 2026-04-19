package com.mockinterview.admin.controller;

import com.mockinterview.admin.dto.AdminStatsDto;
import com.mockinterview.admin.service.AdminService;
import com.mockinterview.user.dto.UserProfileResponse;
import com.mockinterview.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController @RequestMapping("/api/admin") @RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class AdminController {
    private final AdminService adminService;
    private final UserRepository userRepository;

    @GetMapping("/stats")
    public ResponseEntity<AdminStatsDto> getStats() {
        return ResponseEntity.ok(adminService.getPlatformStats());
    }
    @GetMapping("/users")
    public ResponseEntity<List<UserProfileResponse>> getUsers() {
        return ResponseEntity.ok(userRepository.findAll().stream().map(u ->
            UserProfileResponse.builder().id(u.getId()).name(u.getName()).email(u.getEmail())
                .role(u.getRole()).profilePictureUrl(u.getProfilePictureUrl())
                .createdAt(u.getCreatedAt()).build()).toList());
    }
}
