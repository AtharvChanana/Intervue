package com.mockinterview;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableAsync;
import org.springframework.scheduling.annotation.EnableScheduling;

import org.springframework.context.annotation.Bean;
import org.springframework.boot.CommandLineRunner;
import org.springframework.jdbc.core.JdbcTemplate;

@SpringBootApplication
@EnableAsync
@EnableScheduling
public class BackendApplication {
    public static void main(String[] args) {
        SpringApplication.run(BackendApplication.class, args);
    }

    @Bean
    public CommandLineRunner forceDropConstraint(JdbcTemplate jdbcTemplate) {
        return args -> {
            try {
                jdbcTemplate.execute("ALTER TABLE interview_sessions DROP CONSTRAINT IF EXISTS interview_sessions_difficulty_check;");
                System.out.println("Successfully removed rigid difficulty schema constraints!");
            } catch (Exception e) {
                System.out.println("Constraint removal skipped: " + e.getMessage());
            }
        };
    }
}
