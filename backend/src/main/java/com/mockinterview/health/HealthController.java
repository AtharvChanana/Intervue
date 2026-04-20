package com.mockinterview.health;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.bind.annotation.CrossOrigin;

@RestController
@CrossOrigin(origins = "*") // Allow Render health checkers
public class HealthController {

    @GetMapping("/")
    public ResponseEntity<String> rootHealthCheck() {
        return ResponseEntity.ok("Backend is healthy and live!");
    }
    
    @GetMapping("/api/health")
    public ResponseEntity<String> apiHealthCheck() {
        return ResponseEntity.ok("API is healthy!");
    }
}
