package com.mockinterview.admin.service;

import com.mockinterview.admin.dto.AdminStatsDto;
import com.mockinterview.interview.model.SessionStatus;
import com.mockinterview.interview.repository.InterviewSessionRepository;
import com.mockinterview.interview.repository.SessionScoreRepository;
import com.mockinterview.jobrole.repository.JobRoleRepository;
import com.mockinterview.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

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
}
