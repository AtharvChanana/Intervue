package com.mockinterview.admin.repository;

import com.mockinterview.admin.model.SiteVisit;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface SiteVisitRepository extends JpaRepository<SiteVisit, Long> {
}
