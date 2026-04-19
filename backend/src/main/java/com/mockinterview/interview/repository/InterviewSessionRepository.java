package com.mockinterview.interview.repository;

import com.mockinterview.interview.model.InterviewSession;
import com.mockinterview.interview.model.SessionStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface InterviewSessionRepository extends JpaRepository<InterviewSession, Long> {
    List<InterviewSession> findByUserIdOrderByCreatedAtDesc(Long userId);
    Page<InterviewSession> findByUserIdOrderByCreatedAtDesc(Long userId, Pageable pageable);
    List<InterviewSession> findByUserIdAndStatus(Long userId, SessionStatus status);
    long countByUserId(Long userId);
    long countByUserIdAndStatus(Long userId, SessionStatus status);

    @Query("SELECT COUNT(DISTINCT s.jobRole.id) FROM InterviewSession s WHERE s.user.id = ?1")
    long countDistinctRolesByUserId(Long userId);
}
