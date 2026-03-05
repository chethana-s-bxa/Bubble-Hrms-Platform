package com.example.security.admin.service;

import com.example.security.admin.dto.GrantAdminRequest;
import com.example.security.admin.dto.RevokeAdminRequest;
import com.example.security.admin.dto.TransferAdminRequest;
import com.example.security.constants.RoleConstants;
import com.example.security.model.Role;
import com.example.security.model.User;
import com.example.security.repository.RoleRepository;
import com.example.security.repository.UserRepository;
import com.example.EmployeeManagement.Model.Employee;
import com.example.EmployeeManagement.Repository.EmployeeRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class AdminManagementService {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final EmployeeRepository employeeRepository;

    /**
     * Grant admin role
     */
    @Transactional
    public void grantAdmin(GrantAdminRequest request) {

        Employee employee = employeeRepository.findById(request.getEmployeeId())
                .orElseThrow(() -> new RuntimeException("Employee not found"));

        User user = userRepository.findByEmployeeId(employee.getEmployeeId())
                .orElseThrow(() -> new RuntimeException("User account not found"));

        Role adminRole = roleRepository.findByName(RoleConstants.ROLE_ADMIN)
                .orElseThrow(() -> new RuntimeException("ROLE_ADMIN not found"));

        boolean alreadyAdmin = user.getRoles()
                .stream()
                .anyMatch(r -> r.getName().equals(RoleConstants.ROLE_ADMIN));

        if (alreadyAdmin) {
            throw new IllegalStateException("User is already admin");
        }

        user.getRoles().add(adminRole);

        userRepository.save(user);
    }

    /**
     * Transfer admin role
     */
    @Transactional
    public void transferAdmin(TransferAdminRequest request) {

        User fromAdmin = userRepository.findByEmployeeId(request.getFromAdminEmployeeId())
                .orElseThrow(() -> new RuntimeException("Source admin not found"));

        User targetUser = userRepository.findByEmployeeId(request.getToEmployeeId())
                .orElseThrow(() -> new RuntimeException("Target user not found"));

        Role adminRole = roleRepository.findByName(RoleConstants.ROLE_ADMIN)
                .orElseThrow(() -> new RuntimeException("ROLE_ADMIN not found"));

        boolean isAdmin = fromAdmin.getRoles()
                .stream()
                .anyMatch(r -> r.getName().equals(RoleConstants.ROLE_ADMIN));

        if (!isAdmin) {
            throw new IllegalStateException("Source user is not admin");
        }

        fromAdmin.getRoles().remove(adminRole);
        targetUser.getRoles().add(adminRole);

        userRepository.save(fromAdmin);
        userRepository.save(targetUser);
    }

    /**
     * Revoke admin role
     */
    @Transactional
    public void revokeAdmin(RevokeAdminRequest request) {

        User user = userRepository.findByEmployeeId(request.getEmployeeId())
                .orElseThrow(() -> new RuntimeException("User not found"));

        long adminCount = userRepository.countAdmins();

        if (adminCount <= 1) {
            throw new IllegalStateException("Cannot remove last admin");
        }

        Role adminRole = roleRepository.findByName(RoleConstants.ROLE_ADMIN)
                .orElseThrow(() -> new RuntimeException("ROLE_ADMIN not found"));

        user.getRoles().remove(adminRole);

        userRepository.save(user);
    }

}