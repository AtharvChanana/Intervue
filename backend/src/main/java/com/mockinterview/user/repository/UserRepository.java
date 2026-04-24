package com.mockinterview.user.repository;

import com.mockinterview.user.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByEmail(String email);
    boolean existsByEmail(String email);

    @org.springframework.data.jpa.repository.Query("SELECT new com.mockinterview.interview.dto.LeaderboardResponse(u.name, u.email, u.currentJobRole, u.xp, u.profilePictureUrl) FROM User u ORDER BY u.xp DESC")
    java.util.List<com.mockinterview.interview.dto.LeaderboardResponse> getGlobalLeaderboard(org.springframework.data.domain.Pageable pageable);
}
