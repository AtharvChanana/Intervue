package com.mockinterview.jobrole.controller;

import com.mockinterview.jobrole.dto.JobRoleRequest;
import com.mockinterview.jobrole.dto.JobRoleResponse;
import com.mockinterview.jobrole.service.JobRoleService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController @RequestMapping("/api/roles") @RequiredArgsConstructor
public class JobRoleController {
    private final JobRoleService jobRoleService;

    @GetMapping public ResponseEntity<List<JobRoleResponse>> getAllActive() {
        return ResponseEntity.ok(jobRoleService.getAllActive());
    }
    @GetMapping("/all") @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<JobRoleResponse>> getAll() {
        return ResponseEntity.ok(jobRoleService.getAll());
    }
    @PostMapping @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<JobRoleResponse> create(@Valid @RequestBody JobRoleRequest req) {
        return ResponseEntity.ok(jobRoleService.create(req));
    }
    @PutMapping("/{id}") @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<JobRoleResponse> update(@PathVariable Long id, @Valid @RequestBody JobRoleRequest req) {
        return ResponseEntity.ok(jobRoleService.update(id, req));
    }
    @PatchMapping("/{id}/toggle") @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> toggle(@PathVariable Long id) {
        jobRoleService.toggleActive(id); return ResponseEntity.ok().build();
    }
}
