package com.example.security.controller;


import com.example.security.dto.AdminProvisionRequest;
import com.example.security.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
public class AdminController {

    private final UserService userService;
    @PreAuthorize("hasRole('ADMIN')")
    @PostMapping("/provision")
    public ResponseEntity<String>  provisionAdmin(@RequestBody AdminProvisionRequest request,
                                                Authentication authentication) {

        String currentUsername = authentication.getName();

        userService.provisionAdmin(request, currentUsername);
        return ResponseEntity.ok("Admin access granted to employee with id: "+request.getEmployeeId());
    }
}
