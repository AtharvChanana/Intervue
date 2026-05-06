package com.mockinterview.auth.service;

import com.mockinterview.auth.JwtService;
import com.mockinterview.auth.dto.AuthResponse;
import com.mockinterview.auth.dto.LoginRequest;
import com.mockinterview.auth.dto.RegisterRequest;
import com.mockinterview.exception.ResourceNotFoundException;
import com.mockinterview.user.model.Role;
import com.mockinterview.user.model.User;
import com.mockinterview.user.repository.UserRepository;
import com.mockinterview.user.service.EmailService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final AuthenticationManager authenticationManager;
    private final EmailService emailService;

    public AuthResponse register(RegisterRequest request) {
        if (userRepository.existsByEmail(request.getEmail()))
            throw new IllegalArgumentException("Email already registered: " + request.getEmail());

        String otp = String.format("%06d", new java.util.Random().nextInt(999999));

        User user = User.builder()
                .name(request.getName())
                .email(request.getEmail())
                .password(passwordEncoder.encode(request.getPassword()))
                .role(Role.CANDIDATE)
                .emailVerified(false)
                .emailVerificationCode(otp)
                .verificationCodeExpiry(java.time.LocalDateTime.now().plusMinutes(10))
                .build();

        User saved = userRepository.save(user);

        try {
            emailService.sendEmail(
                saved.getEmail(),
                "Your Verification OTP for Intervue",
                "Welcome to Intervue!\n\nYour Verification OTP is: " + otp + "\n\nThis code will expire in 10 minutes."
            );
        } catch (Exception e) {
            // Email send failure must not break registration; user can resend via /api/user/email/send-verification
        }

        return buildResponse(saved);
    }

    public AuthResponse login(LoginRequest request) {
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.getEmail(), request.getPassword()));
        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        return buildResponse(user);
    }
    public void requestPasswordReset(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        
        String otp = String.format("%06d", new java.util.Random().nextInt(999999));
        user.setEmailVerificationCode(otp);
        user.setVerificationCodeExpiry(java.time.LocalDateTime.now().plusMinutes(10));
        userRepository.save(user);
        
        emailService.sendEmail(
            email,
            "Reset Your Password",
            "Your Password Reset OTP is: " + otp + "\n\nThis code will expire in 10 minutes. If you did not request this, please ignore this email."
        );
    }

    public void resetPassword(String email, String otp, String newPassword) {
        if (newPassword == null || newPassword.length() < 6) {
            throw new IllegalArgumentException("Password must be at least 6 characters");
        }
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        
        if (user.getEmailVerificationCode() == null || !user.getEmailVerificationCode().equals(otp)) {
            throw new IllegalArgumentException("Invalid OTP");
        }
        if (user.getVerificationCodeExpiry().isBefore(java.time.LocalDateTime.now())) {
            throw new IllegalArgumentException("OTP expired");
        }
        
        user.setPassword(passwordEncoder.encode(newPassword));
        user.setEmailVerificationCode(null);
        user.setVerificationCodeExpiry(null);
        userRepository.save(user);
    }

    private AuthResponse buildResponse(User user) {
        return AuthResponse.builder()
                .accessToken(jwtService.generateToken(user))
                .refreshToken(jwtService.generateRefreshToken(user))
                .userId(user.getId())
                .name(user.getName())
                .email(user.getEmail())
                .role(user.getRole())
                .build();
    }
}
