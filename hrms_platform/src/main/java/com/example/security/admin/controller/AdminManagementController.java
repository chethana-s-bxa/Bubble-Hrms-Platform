package com.example.security.admin.controller;

import com.example.security.admin.dto.RevokeAdminRequest;
import com.example.security.admin.dto.TransferAdminRequest;
import com.example.security.admin.service.AdminManagementService;
import com.example.security.dto.AdminProvisionRequest;
import com.example.security.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/admin/manage")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class AdminManagementController {

    private final AdminManagementService adminManagementService;
    private final UserService userService;

    @PostMapping("/grant")
    public ResponseEntity<String> provisionAdmin(@RequestBody AdminProvisionRequest request,
                                                 Authentication authentication) {

        String currentUsername = authentication.getName();

        userService.provisionAdmin(request, currentUsername);
        return ResponseEntity.ok("Admin access granted to employee with id: "+request.getEmployeeId());
    }

    @PostMapping("/transfer")
    public ResponseEntity<String> transferAdmin(@RequestBody TransferAdminRequest request) {
        adminManagementService.transferAdmin(request);
        return ResponseEntity.ok("Admin access has been transferred from employee "+request.getFromAdminEmployeeId()+" to employee "+request.getToEmployeeId());
    }

    @PostMapping("/revoke")
    public ResponseEntity<String> revokeAdmin(@RequestBody RevokeAdminRequest request) {
        adminManagementService.revokeAdmin(request);
        return ResponseEntity.ok("Admin access has been revoked from employee "+request.getEmployeeId());
    }
}
