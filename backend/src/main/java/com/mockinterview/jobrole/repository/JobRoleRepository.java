package com.mockinterview.jobrole.repository;

import com.mockinterview.jobrole.model.JobRole;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface JobRoleRepository extends JpaRepository<JobRole, Long> {
    List<JobRole> findByActiveTrue();
    boolean existsByTitle(String title);
    java.util.Optional<JobRole> findByTitleIgnoreCase(String title);
}
