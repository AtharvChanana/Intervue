package com.mockinterview.interview.repository;

import com.mockinterview.interview.model.SessionScore;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface SessionScoreRepository extends JpaRepository<SessionScore, Long> {
    Optional<SessionScore> findBySessionId(Long sessionId);

    @Query("SELECT ss FROM SessionScore ss WHERE ss.session.user.id = ?1 ORDER BY ss.calculatedAt DESC")
    List<SessionScore> findByUserId(Long userId);

    @Query("SELECT AVG(ss.totalScore) FROM SessionScore ss WHERE ss.session.user.id = ?1")
    Double findAverageTotalScoreByUserId(Long userId);

    @Query("SELECT new com.mockinterview.interview.dto.LeaderboardResponse(u.name, u.currentJobRole, MAX(ss.totalScore), u.profilePictureUrl) " +
           "FROM SessionScore ss JOIN ss.session s JOIN s.user u " +
           "GROUP BY u.id " +
           "ORDER BY MAX(ss.totalScore) DESC")
    List<com.mockinterview.interview.dto.LeaderboardResponse> getGlobalLeaderboard(org.springframework.data.domain.Pageable pageable);
}
