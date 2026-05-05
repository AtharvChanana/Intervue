package com.mockinterview.admin.service;

import com.mockinterview.admin.dto.AdminSessionDto;
import com.mockinterview.admin.dto.AdminStatsDto;
import com.mockinterview.interview.model.SessionStatus;
import com.mockinterview.interview.repository.InterviewSessionRepository;
import com.mockinterview.interview.repository.SessionScoreRepository;
import com.mockinterview.jobrole.repository.JobRoleRepository;
import com.mockinterview.user.model.User;
import com.mockinterview.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;

import java.util.List;

@Service @RequiredArgsConstructor
public class AdminService {
    private final UserRepository userRepository;
    private final InterviewSessionRepository sessionRepository;
    private final SessionScoreRepository scoreRepository;
    private final JobRoleRepository jobRoleRepository;

    public AdminStatsDto getPlatformStats() {
        long totalUsers = userRepository.count();
        long totalSessions = sessionRepository.count();
        long completed = sessionRepository.findAll().stream()
                .filter(s -> s.getStatus() == SessionStatus.COMPLETED).count();
        long roles = jobRoleRepository.count();
        double avg = scoreRepository.findAll().stream()
                .mapToDouble(s -> s.getTotalScore() != null ? s.getTotalScore() : 0)
                .average().orElse(0.0);
        return AdminStatsDto.builder().totalUsers(totalUsers).totalSessions(totalSessions)
                .completedSessions(completed).totalJobRoles(roles)
                .platformAverageScore(Math.round(avg * 10.0) / 10.0).build();
    }

    public void deleteUser(Long userId) {
        if (!userRepository.existsById(userId)) {
            throw new RuntimeException("User not found with id: " + userId);
        }
        userRepository.deleteById(userId);
    }

    public User toggleBanUser(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found with id: " + userId));
        user.setBanned(user.getBanned() == null || !user.getBanned());
        return userRepository.save(user);
    }

    public List<User> getRecentUsers(int limit) {
        return userRepository.findAll(
            PageRequest.of(0, limit, Sort.by(Sort.Direction.DESC, "createdAt"))
        ).getContent();
    }

    public List<AdminSessionDto> getAllSessions() {
        return sessionRepository.findAll(Sort.by(Sort.Direction.DESC, "createdAt"))
            .stream().map(s -> {
                Double score = scoreRepository.findBySessionId(s.getId())
                        .map(sc -> sc.getTotalScore()).orElse(null);
                return AdminSessionDto.builder()
                        .id(s.getId())
                        .userName(s.getUser().getName())
                        .userEmail(s.getUser().getEmail())
                        .jobRole(s.getJobRole().getTitle())
                        .difficulty(s.getDifficulty().name())
                        .interviewType(s.getInterviewType().name())
                        .status(s.getStatus().name())
                        .score(score)
                        .createdAt(s.getCreatedAt())
                        .build();
            }).toList();
    }
}
