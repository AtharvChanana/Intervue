package com.mockinterview.interview.repository;

import com.mockinterview.interview.model.Question;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface QuestionRepository extends JpaRepository<Question, Long> {
    List<Question> findBySessionIdOrderByOrderIndex(Long sessionId);
    long countBySessionId(Long sessionId);
    Optional<Question> findBySessionIdAndOrderIndex(Long sessionId, Integer orderIndex);
}
