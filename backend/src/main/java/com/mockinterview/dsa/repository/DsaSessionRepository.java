package com.mockinterview.dsa.repository;

import com.mockinterview.dsa.model.DsaSession;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface DsaSessionRepository extends JpaRepository<DsaSession, Long> {
    Optional<DsaSession> findByIdAndUserId(Long id, Long userId);
    List<DsaSession> findByUserIdOrderByCreatedAtDesc(Long userId);
}
