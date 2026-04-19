package com.mockinterview.user.repository;

import com.mockinterview.user.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByEmail(String email);
    boolean existsByEmail(String email);

    @org.springframework.data.jpa.repository.Query("SELECT new com.mockinterview.interview.dto.LeaderboardResponse(u.name, u.email, u.currentJobRole, " +
           "(COALESCE(MAX(ss.totalScore), 0.0) + (COUNT(DISTINCT s.id) * 10.0) + COALESCE(SUM(CASE s.difficulty WHEN com.mockinterview.interview.model.Difficulty.HARD THEN 15.0 WHEN com.mockinterview.interview.model.Difficulty.MEDIUM THEN 5.0 ELSE 0.0 END), 0.0)), " +
           "u.profilePictureUrl) " +
           "FROM User u " +
           "LEFT JOIN u.sessions s " +
           "LEFT JOIN SessionScore ss ON ss.session = s " +
           "GROUP BY u.id " +
           "ORDER BY (COALESCE(MAX(ss.totalScore), 0.0) + (COUNT(DISTINCT s.id) * 10.0) + COALESCE(SUM(CASE s.difficulty WHEN com.mockinterview.interview.model.Difficulty.HARD THEN 15.0 WHEN com.mockinterview.interview.model.Difficulty.MEDIUM THEN 5.0 ELSE 0.0 END), 0.0)) DESC")
    java.util.List<com.mockinterview.interview.dto.LeaderboardResponse> getGlobalLeaderboard(org.springframework.data.domain.Pageable pageable);
}
