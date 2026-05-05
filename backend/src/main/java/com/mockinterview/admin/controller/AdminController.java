package com.mockinterview.admin.controller;

import com.mockinterview.admin.dto.AdminSessionDto;
import com.mockinterview.admin.dto.AdminStatsDto;
import com.mockinterview.admin.service.AdminService;
import com.mockinterview.user.dto.UserProfileResponse;
import com.mockinterview.user.model.User;
import com.mockinterview.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

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
            UserProfileResponse.builder()
                .id(u.getId()).name(u.getName()).email(u.getEmail())
                .role(u.getRole()).profilePictureUrl(u.getProfilePictureUrl())
                .createdAt(u.getCreatedAt()).emailVerified(u.getEmailVerified())
                .xp(u.getXp()).banned(u.getBanned()).build()
        ).toList());
    }

    @GetMapping("/users/recent")
    public ResponseEntity<List<UserProfileResponse>> getRecentUsers() {
        return ResponseEntity.ok(adminService.getRecentUsers(10).stream().map(u ->
            UserProfileResponse.builder()
                .id(u.getId()).name(u.getName()).email(u.getEmail())
                .role(u.getRole()).profilePictureUrl(u.getProfilePictureUrl())
                .createdAt(u.getCreatedAt()).emailVerified(u.getEmailVerified())
                .banned(u.getBanned()).build()
        ).toList());
    }

    @DeleteMapping("/users/{id}")
    public ResponseEntity<Map<String, String>> deleteUser(@PathVariable Long id) {
        adminService.deleteUser(id);
        return ResponseEntity.ok(Map.of("message", "User deleted successfully"));
    }

    @PatchMapping("/users/{id}/ban")
    public ResponseEntity<Map<String, Object>> banUser(@PathVariable Long id) {
        User user = adminService.toggleBanUser(id);
        return ResponseEntity.ok(Map.of(
            "message", user.getBanned() ? "User banned" : "User unbanned",
            "banned", user.getBanned()
        ));
    }

    @GetMapping("/sessions")
    public ResponseEntity<List<AdminSessionDto>> getAllSessions() {
        return ResponseEntity.ok(adminService.getAllSessions());
    }
}
