package com.mockinterview.admin.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "site_visits")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SiteVisit {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "ip_address")
    private String ipAddress;

    @Column(name = "visited_at")
    private LocalDateTime visitedAt;
}
