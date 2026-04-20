package com.mockinterview.config;

import com.mockinterview.jobrole.model.JobRole;
import com.mockinterview.jobrole.repository.JobRoleRepository;
import com.mockinterview.user.model.Role;
import com.mockinterview.user.model.User;
import com.mockinterview.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
@RequiredArgsConstructor
@Slf4j
public class DataSeeder implements CommandLineRunner {

    private final JobRoleRepository jobRoleRepository;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) {
        try {
            seedJobRoles();
            seedAdminUser();
        } catch (Exception e) {
            log.warn("⚠️ DataSeeder encountered an error (non-fatal): {}", e.getMessage());
        }
    }

    private void seedJobRoles() {
        if (jobRoleRepository.count() == 0) {
            List<JobRole> roles = List.of(
                    JobRole.builder().title("Software Engineer")
                            .description("Full-stack, backend, or frontend development roles requiring programming expertise")
                            .category("Engineering").active(true).build(),
                    JobRole.builder().title("Data Scientist")
                            .description("Machine learning, data analysis, and statistical modeling roles")
                            .category("Data").active(true).build(),
                    JobRole.builder().title("Product Manager")
                            .description("Product strategy, roadmap planning, and cross-functional leadership roles")
                            .category("Product").active(true).build(),
                    JobRole.builder().title("Data Analyst")
                            .description("Data analysis, visualization, and business intelligence roles")
                            .category("Data").active(true).build(),
                    JobRole.builder().title("DevOps Engineer")
                            .description("CI/CD, cloud infrastructure, and platform engineering roles")
                            .category("Engineering").active(true).build(),
                    JobRole.builder().title("Machine Learning Engineer")
                            .description("ML model development, training pipelines, and production ML systems")
                            .category("Engineering").active(true).build(),
                    JobRole.builder().title("Frontend Developer")
                            .description("UI/UX development using modern JavaScript frameworks like React, Vue, and Next.js")
                            .category("Engineering").active(true).build(),
                    JobRole.builder().title("Backend Developer")
                            .description("Server-side development, REST APIs, microservices, and database design")
                            .category("Engineering").active(true).build(),
                    JobRole.builder().title("UI/UX Designer")
                            .description("User interface and user experience design, Figma, design systems")
                            .category("Design").active(true).build(),
                    JobRole.builder().title("System Design Architect")
                            .description("High-level system and architecture design for scalable distributed systems")
                            .category("Engineering").active(true).build(),
                    JobRole.builder().title("Cloud Engineer")
                            .description("AWS, Azure, GCP cloud infrastructure, IaC, and cloud-native development")
                            .category("Engineering").active(true).build(),
                    JobRole.builder().title("Cybersecurity Analyst")
                            .description("Network security, threat analysis, penetration testing, and security architecture")
                            .category("Security").active(true).build()
            );
            jobRoleRepository.saveAll(roles);
            log.info("✅ Seeded {} job roles", roles.size());
        }
    }

    private void seedAdminUser() {
        if (!userRepository.existsByEmail("admin@mockinterview.com")) {
            User admin = User.builder()
                    .name("Admin")
                    .email("admin@mockinterview.com")
                    .password(passwordEncoder.encode("Admin@123"))
                    .role(Role.ADMIN)
                    .build();
            userRepository.save(admin);
            log.info("✅ Admin user created: admin@mockinterview.com / Admin@123");
        }
    }
}
