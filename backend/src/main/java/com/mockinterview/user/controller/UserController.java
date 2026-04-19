package com.mockinterview.user.controller;

import com.mockinterview.user.dto.UpdateProfileRequest;
import com.mockinterview.user.dto.UserProfileResponse;
import com.mockinterview.user.model.User;
import com.mockinterview.user.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.Map;

@RestController
@RequestMapping("/api/user")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

    @GetMapping("/profile")
    public ResponseEntity<UserProfileResponse> getProfile(@AuthenticationPrincipal User user) {
        return ResponseEntity.ok(userService.getProfile(user.getId()));
    }

    @PutMapping("/profile")
    public ResponseEntity<UserProfileResponse> updateProfile(
            @AuthenticationPrincipal User user,
            @RequestBody UpdateProfileRequest request) {
        return ResponseEntity.ok(userService.updateProfile(user.getId(), request));
    }

    @PostMapping("/profile/picture")
    public ResponseEntity<UserProfileResponse> uploadProfilePicture(
            @AuthenticationPrincipal User user,
            @RequestParam("file") MultipartFile file) throws IOException {
        return ResponseEntity.ok(userService.uploadProfilePicture(user.getId(), file));
    }

    @PostMapping("/profile/delete")
    public ResponseEntity<Void> deleteAccount(
            @AuthenticationPrincipal User user,
            @RequestBody Map<String, String> payload) {
        userService.deleteAccount(user.getId(), payload.get("password"));
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/email/send-verification")
    public ResponseEntity<Void> sendVerificationOTP(@AuthenticationPrincipal User user) {
        userService.sendVerificationOTP(user.getId());
        return ResponseEntity.ok().build();
    }

    @PostMapping("/email/verify")
    public ResponseEntity<UserProfileResponse> verifyEmail(
            @AuthenticationPrincipal User user,
            @RequestBody Map<String, String> payload) {
        return ResponseEntity.ok(userService.verifyEmail(user.getId(), payload.get("otp")));
    }

    @PostMapping("/email/request-update")
    public ResponseEntity<Void> requestEmailUpdate(
            @AuthenticationPrincipal User user,
            @RequestBody Map<String, String> payload) {
        userService.requestEmailUpdate(user.getId(), payload.get("password"), payload.get("newEmail"));
        return ResponseEntity.ok().build();
    }

    @PostMapping("/email/verify-update")
    public ResponseEntity<UserProfileResponse> verifyEmailUpdate(
            @AuthenticationPrincipal User user,
            @RequestBody Map<String, String> payload) {
        return ResponseEntity.ok(userService.verifyEmailUpdate(user.getId(), payload.get("otp")));
    }
}
