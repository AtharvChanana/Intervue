package com.mockinterview.user.service;

import com.mockinterview.exception.ResourceNotFoundException;
import com.mockinterview.user.dto.UpdateProfileRequest;
import com.mockinterview.user.dto.UserProfileResponse;
import com.mockinterview.user.model.User;
import com.mockinterview.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.beans.factory.annotation.Value;

import java.io.IOException;
import java.nio.file.*;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final EmailService emailService;

    @Value("${file.upload-dir}")
    private String uploadDir;

    public UserProfileResponse getProfile(Long userId) {
        return toResponse(userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found")));
    }

    public UserProfileResponse updateProfile(Long userId, UpdateProfileRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        if (request.getName() != null && !request.getName().isBlank())
            user.setName(request.getName());
        if (request.getProfilePictureUrl() != null) {
            if (request.getProfilePictureUrl().isBlank()) {
                 user.setProfilePictureUrl(null);
            } else {
                 user.setProfilePictureUrl(request.getProfilePictureUrl());
            }
        }
        if (request.getAge() != null) {
            if (request.getAge() < 0) throw new IllegalArgumentException("Age cannot be negative");
            user.setAge(request.getAge());
        }
        if (request.getCurrentJobRole() != null)
            user.setCurrentJobRole(request.getCurrentJobRole());
        if (request.getPassword() != null && !request.getPassword().isBlank()) {
            if (request.getOldPassword() == null || request.getOldPassword().isBlank() || !passwordEncoder.matches(request.getOldPassword(), user.getPassword())) {
                throw new IllegalArgumentException("Invalid old password");
            }
            user.setPassword(passwordEncoder.encode(request.getPassword()));
        }
        return toResponse(userRepository.save(user));
    }

    public UserProfileResponse uploadProfilePicture(Long userId, MultipartFile file) throws IOException {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        if (file.isEmpty()) throw new IllegalArgumentException("File is empty");
        
        String name = file.getOriginalFilename();
        if (name == null || !(name.toLowerCase().endsWith(".png") || name.toLowerCase().endsWith(".jpg") || name.toLowerCase().endsWith(".jpeg")))
            throw new IllegalArgumentException("Only PNG/JPG files are supported");

        String saved = UUID.randomUUID() + "_avatar.png";
        Path uploadPath = Paths.get(uploadDir);
        Files.createDirectories(uploadPath);
        Files.copy(file.getInputStream(), uploadPath.resolve(saved), StandardCopyOption.REPLACE_EXISTING);

        user.setProfilePictureUrl("/uploads/" + saved);
        return toResponse(userRepository.save(user));
    }

    public void deleteAccount(Long userId, String password) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        if (password == null || password.isBlank() || !passwordEncoder.matches(password, user.getPassword())) {
            throw new IllegalArgumentException("Invalid password provided for deletion");
        }
        userRepository.delete(user);
    }

    public void sendVerificationOTP(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        if (Boolean.TRUE.equals(user.getEmailVerified())) {
            throw new IllegalArgumentException("Email is already verified");
        }
        String otp = String.format("%06d", new java.util.Random().nextInt(999999));
        user.setEmailVerificationCode(otp);
        user.setVerificationCodeExpiry(java.time.LocalDateTime.now().plusMinutes(10));
        userRepository.save(user);
        emailService.sendEmail(
            user.getEmail(),
            "Your Verification OTP for Intervue",
            "Your Verification OTP is: " + otp + "\n\nThis code will expire in 10 minutes."
        );
    }

    public UserProfileResponse verifyEmail(Long userId, String otp) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        if (user.getEmailVerificationCode() == null || !user.getEmailVerificationCode().equals(otp)) {
            throw new IllegalArgumentException("Invalid OTP");
        }
        if (user.getVerificationCodeExpiry().isBefore(java.time.LocalDateTime.now())) {
            throw new IllegalArgumentException("OTP expired");
        }
        user.setEmailVerified(true);
        user.setEmailVerificationCode(null);
        user.setVerificationCodeExpiry(null);
        return toResponse(userRepository.save(user));
    }

    public void requestEmailUpdate(Long userId, String password, String newEmail) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        if (!passwordEncoder.matches(password, user.getPassword())) {
            throw new IllegalArgumentException("Invalid password");
        }
        if (userRepository.existsByEmail(newEmail)) {
            throw new IllegalArgumentException("Email is already taken");
        }
        String otp = String.format("%06d", new java.util.Random().nextInt(999999));
        user.setPendingNewEmail(newEmail);
        user.setEmailVerificationCode(otp);
        user.setVerificationCodeExpiry(java.time.LocalDateTime.now().plusMinutes(10));
        userRepository.save(user);
        emailService.sendEmail(
            newEmail,
            "Verify Your New Email for Intervue",
            "Your Email Update OTP is: " + otp + "\n\nThis code will expire in 10 minutes."
        );
    }

    public UserProfileResponse verifyEmailUpdate(Long userId, String otp) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        if (user.getEmailVerificationCode() == null || !user.getEmailVerificationCode().equals(otp)) {
            throw new IllegalArgumentException("Invalid OTP");
        }
        if (user.getVerificationCodeExpiry().isBefore(java.time.LocalDateTime.now())) {
            throw new IllegalArgumentException("OTP expired");
        }
        if (user.getPendingNewEmail() == null) {
            throw new IllegalArgumentException("No pending email update found");
        }
        user.setEmail(user.getPendingNewEmail());
        user.setPendingNewEmail(null);
        user.setEmailVerificationCode(null);
        user.setVerificationCodeExpiry(null);
        user.setEmailUpdateCount(user.getEmailUpdateCount() == null ? 1 : user.getEmailUpdateCount() + 1);
        return toResponse(userRepository.save(user));
    }

    private UserProfileResponse toResponse(User user) {
        return UserProfileResponse.builder()
                .id(user.getId()).name(user.getName()).email(user.getEmail())
                .role(user.getRole()).profilePictureUrl(user.getProfilePictureUrl())
                .age(user.getAge()).currentJobRole(user.getCurrentJobRole())
                .emailVerified(user.getEmailVerified())
                .emailUpdateCount(user.getEmailUpdateCount())
                .createdAt(user.getCreatedAt()).build();
    }
}
