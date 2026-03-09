package com.example.security.controller;

import java.util.List;

import com.example.EmployeeManagement.DTO.EmployeeCreateResponse;
import com.example.security.dto.CreateHrRequestDTO;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.example.security.dto.CreateHrRequest;
import com.example.security.dto.HrListResponse;
import com.example.security.dto.UpdateHrRequest;
import com.example.security.service.AdminHrService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/v1/admin/hr")
@RequiredArgsConstructor
public class AdminHrController {

    private final AdminHrService adminHrService;

    @GetMapping("/all")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<HrListResponse>> getAllHr() {
        return ResponseEntity.ok(adminHrService.getAllHrUsers());
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<EmployeeCreateResponse> createHr(
            @Valid @RequestBody CreateHrRequestDTO request) {

        return ResponseEntity.ok(adminHrService.createHr(request));
    }

    @PostMapping("/admin")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<EmployeeCreateResponse> createAdmin(
            @Valid @RequestBody CreateHrRequestDTO request) {

        return ResponseEntity.ok(adminHrService.createAdmin(request));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<HrListResponse> getById(@PathVariable Long id) {
        return ResponseEntity.ok(adminHrService.getHrById(id));
    }

    @PutMapping("/update")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<HrListResponse> update(@RequestBody UpdateHrRequest request) {
        return ResponseEntity.ok(adminHrService.updateHr(request));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> deleteHr(@PathVariable Long id) {
        adminHrService.deleteHr(id);
        return ResponseEntity.noContent().build();
    }
}


