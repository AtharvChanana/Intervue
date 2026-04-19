package com.mockinterview.jobrole.service;

import com.mockinterview.exception.ResourceNotFoundException;
import com.mockinterview.jobrole.dto.JobRoleRequest;
import com.mockinterview.jobrole.dto.JobRoleResponse;
import com.mockinterview.jobrole.model.JobRole;
import com.mockinterview.jobrole.repository.JobRoleRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import java.util.List;

@Service @RequiredArgsConstructor
public class JobRoleService {
    private final JobRoleRepository jobRoleRepository;

    public List<JobRoleResponse> getAllActive() {
        return jobRoleRepository.findByActiveTrue().stream().map(this::toResponse).toList();
    }
    public List<JobRoleResponse> getAll() {
        return jobRoleRepository.findAll().stream().map(this::toResponse).toList();
    }
    public JobRoleResponse create(JobRoleRequest req) {
        if (jobRoleRepository.existsByTitle(req.getTitle()))
            throw new IllegalArgumentException("Job role with this title already exists");
        return toResponse(jobRoleRepository.save(JobRole.builder().title(req.getTitle())
                .description(req.getDescription()).category(req.getCategory())
                .iconUrl(req.getIconUrl()).active(true).build()));
    }
    public JobRoleResponse update(Long id, JobRoleRequest req) {
        JobRole r = jobRoleRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Job role not found"));
        r.setTitle(req.getTitle()); r.setDescription(req.getDescription());
        r.setCategory(req.getCategory()); r.setIconUrl(req.getIconUrl());
        return toResponse(jobRoleRepository.save(r));
    }
    public void toggleActive(Long id) {
        JobRole r = jobRoleRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Job role not found"));
        r.setActive(!r.isActive()); jobRoleRepository.save(r);
    }
    private JobRoleResponse toResponse(JobRole r) {
        return JobRoleResponse.builder().id(r.getId()).title(r.getTitle())
                .description(r.getDescription()).category(r.getCategory())
                .iconUrl(r.getIconUrl()).active(r.isActive()).build();
    }
}
