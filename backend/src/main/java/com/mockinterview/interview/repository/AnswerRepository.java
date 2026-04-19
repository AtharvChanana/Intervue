package com.mockinterview.interview.repository;

import com.mockinterview.interview.model.Answer;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface AnswerRepository extends JpaRepository<Answer, Long> {
    Optional<Answer> findByQuestionId(Long questionId);

    @Query("SELECT a FROM Answer a WHERE a.question.session.id = ?1")
    List<Answer> findBySessionId(Long sessionId);

    @Query("SELECT AVG(a.score) FROM Answer a WHERE a.question.session.id = ?1")
    Double findAverageScoreBySessionId(Long sessionId);

    @Query("SELECT AVG(a.score) FROM Answer a WHERE a.question.session.user.id = ?1")
    Double findAverageScoreByUserId(Long userId);
}
