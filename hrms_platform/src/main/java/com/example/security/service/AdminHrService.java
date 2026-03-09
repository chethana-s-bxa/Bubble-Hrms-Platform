package com.example.security.service;

import java.time.LocalDate;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

import com.example.EmployeeManagement.DTO.EmployeeCreateResponse;
import com.example.EmployeeManagement.Model.Employee;
import com.example.EmployeeManagement.Repository.EmployeeRepository;
import com.example.security.dto.CreateHrRequestDTO;
import com.example.security.util.CompanyEmailGenerator;
import com.example.security.util.PasswordGenerator;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import com.example.security.constants.RoleConstants;
import com.example.security.dto.CreateHrRequest;
import com.example.security.dto.HrListResponse;
import com.example.security.dto.UpdateHrRequest;
import com.example.security.model.Role;
import com.example.security.model.User;
import com.example.security.repository.RoleRepository;
import com.example.security.repository.UserRepository;

import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class AdminHrService {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final PasswordEncoder passwordEncoder;
    private final CompanyEmailGenerator companyEmailGenerator;
    private final PasswordGenerator passwordGenerator;
    private final EmailService emailService;
    private final EmployeeRepository employeeRepository;

    @Transactional
    public EmployeeCreateResponse createHr(CreateHrRequestDTO request) {

        // Validate HR role strictly
        if (!isValidHrRole(request.getRole())) {
            throw new IllegalArgumentException("Invalid HR role.");
        }

        // Generate company email
        String companyEmail = companyEmailGenerator.generate(
                request.getFirstName(),
                request.getLastName()
        );

        // Generate password
        String tempPassword = passwordGenerator.generateTempPassword();

        // Fetch roles
        Role employeeRole = roleRepository.findByName(RoleConstants.ROLE_EMPLOYEE)
                .orElseThrow(() -> new RuntimeException("ROLE_EMPLOYEE not found"));

        Role hrRole = roleRepository.findByName(request.getRole())
                .orElseThrow(() -> new RuntimeException("HR role not found in DB"));

        Set<Role> roles = new HashSet<>();
        roles.add(employeeRole);
        roles.add(hrRole);

        // Create User
        User user = User.builder()
                .username(companyEmail)
                .password(passwordEncoder.encode(tempPassword))
                .enabled(true)
                .roles(roles)
                .mustChangePassword(true)
                .build();

        User savedUser = userRepository.save(user);

        // Create Employee record
        Employee employee = new Employee();
        employee.setFirstName(request.getFirstName());
        employee.setLastName(request.getLastName());
        employee.setCompanyEmail(companyEmail);
        employee.setDepartment(request.getDepartment());
        employee.setDesignation(request.getDesignation());
        employee.setStatus("ACTIVE");
        employee.setEmployeeType("FULL_TIME");
        employee.setCurrentBand(request.getCurrentBand());
        employee.setCurrentExperience(
                request.getCurrentExperience() != null ? request.getCurrentExperience() : 0
        );
        employee.setCtc(
                request.getCtc() != null ? request.getCtc() : 0
        );
        employee.setPhoneNumber(request.getPhoneNumber());
        employee.setDateOfJoining(
                request.getDateOfJoining() != null ? request.getDateOfJoining() : LocalDate.now()
        );
        employee.setDateOfJoining(java.time.LocalDate.now());
        employee.setCreatedByHrUserId(savedUser.getId());
        employee.setUser(savedUser);


        Employee savedEmployee = employeeRepository.save(employee);

        // Link user to employee
        savedUser.setEmployeeId(savedEmployee.getEmployeeId());
        userRepository.save(savedUser);

        // Send email
        if (request.getPersonalEmail() != null && !request.getPersonalEmail().isBlank()) {
            emailService.sendEmployeeOnboardingEmail(
                    request.getPersonalEmail(),
                    companyEmail,
                    tempPassword
            );
        }

        return new EmployeeCreateResponse(
                savedEmployee.getEmployeeId(),
                companyEmail,
                tempPassword
        );
    }

    @Transactional
    public EmployeeCreateResponse createAdmin(CreateHrRequestDTO request) {

        // Generate company email
        String companyEmail = companyEmailGenerator.generate(
                request.getFirstName(),
                request.getLastName()
        );

        // Generate password
        String tempPassword = passwordGenerator.generateTempPassword();

        // Fetch roles
        Role adminRole = roleRepository.findByName(RoleConstants.ROLE_ADMIN)
                .orElseThrow(() -> new RuntimeException("ROLE_ADMIN not found"));

        Role employeeRole = roleRepository.findByName(RoleConstants.ROLE_EMPLOYEE)
                .orElseThrow(() -> new RuntimeException("ROLE_EMPLOYEE not found"));

        Set<Role> roles = new HashSet<>();
        roles.add(employeeRole);
        roles.add(adminRole);

        // Create User
        User user = User.builder()
                .username(companyEmail)
                .password(passwordEncoder.encode(tempPassword))
                .enabled(true)
                .roles(roles)
                .mustChangePassword(true)
                .build();

        User savedUser = userRepository.save(user);

        // Create Employee record
        Employee employee = new Employee();
        employee.setFirstName(request.getFirstName());
        employee.setLastName(request.getLastName());
        employee.setCompanyEmail(companyEmail);
        employee.setDepartment(request.getDepartment());
        employee.setDesignation(request.getDesignation());
        employee.setStatus("ACTIVE");
        employee.setEmployeeType("FULL_TIME");
        employee.setCurrentBand(request.getCurrentBand());
        employee.setCurrentExperience(
                request.getCurrentExperience() != null ? request.getCurrentExperience() : 0
        );
        employee.setCtc(
                request.getCtc() != null ? request.getCtc() : 0
        );
        employee.setPhoneNumber(request.getPhoneNumber());
        employee.setDateOfJoining(
                request.getDateOfJoining() != null ? request.getDateOfJoining() : LocalDate.now()
        );
        employee.setCreatedByHrUserId(savedUser.getId());
        employee.setUser(savedUser);

        Employee savedEmployee = employeeRepository.save(employee);

        // Link user to employee
        savedUser.setEmployeeId(savedEmployee.getEmployeeId());
        userRepository.save(savedUser);

        // Send email
        if (request.getPersonalEmail() != null && !request.getPersonalEmail().isBlank()) {
            emailService.sendEmployeeOnboardingEmail(
                    request.getPersonalEmail(),
                    companyEmail,
                    tempPassword
            );
        }

        return new EmployeeCreateResponse(
                savedEmployee.getEmployeeId(),
                companyEmail,
                tempPassword
        );
    }

    public List<HrListResponse> getAllHrUsers() {
        return userRepository.findAllWithHrRole().stream()
                .map(u -> new HrListResponse(
                        u.getId(),
                        u.getUsername(),
                        u.isEnabled(),
                        u.getRoles().stream().map(Role::getName).collect(Collectors.toSet())
                ))
                .collect(Collectors.toList());
    }

    private boolean isValidHrRole(String role) {
        return RoleConstants.ROLE_HR_OPERATIONS.equals(role)
                || RoleConstants.ROLE_HR_MANAGER.equals(role)
                || RoleConstants.ROLE_HR_BP.equals(role)
                || RoleConstants.ROLE_HR_PAYROLL.equals(role)
                || RoleConstants.ROLE_TALENT_ACQUISITION.equals(role);
    }

    public HrListResponse getHrById(Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("HR user not found"));
        return new HrListResponse(
                user.getId(),
                user.getUsername(),
                user.isEnabled(),
                user.getRoles().stream().map(Role::getName).collect(Collectors.toSet())
        );
    }

    @Transactional
    public HrListResponse updateHr(UpdateHrRequest request) {
        if (request.getId() == null) {
            throw new IllegalArgumentException("HR id is required");
        }
        User user = userRepository.findById(request.getId())
                .orElseThrow(() -> new IllegalArgumentException("HR user not found"));

        if (request.getEnabled() != null) {
            user.setEnabled(request.getEnabled());
        }

        if (request.getHrRole() != null && !request.getHrRole().isBlank()) {
            String hrRoleName = request.getHrRole().trim();
            if (!hrRoleName.startsWith("ROLE_HR") &&
                    !RoleConstants.ROLE_TALENT_ACQUISITION.equals(hrRoleName)) {
                throw new IllegalArgumentException("Invalid HR role assignment");
            }

            Role employeeRole = roleRepository.findByName(RoleConstants.ROLE_EMPLOYEE)
                    .orElseThrow(() -> new RuntimeException("ROLE_EMPLOYEE not found"));

            Role hrRole = roleRepository.findByName(hrRoleName)
                    .orElseThrow(() -> new RuntimeException("Invalid HR role"));

            Set<Role> roles = new HashSet<>();
            roles.add(employeeRole);
            roles.add(hrRole);
            user.setRoles(roles);
        }

        User saved = userRepository.save(user);
        return new HrListResponse(
                saved.getId(),
                saved.getUsername(),
                saved.isEnabled(),
                saved.getRoles().stream().map(Role::getName).collect(Collectors.toSet())
        );
    }

    @Transactional
    public void deleteHr(Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("HR user not found"));
        boolean hasHrRole = user.getRoles().stream()
                .anyMatch(r -> r.getName().startsWith("ROLE_HR") || RoleConstants.ROLE_TALENT_ACQUISITION.equals(r.getName()));
        if (!hasHrRole) {
            throw new IllegalArgumentException("User is not an HR");
        }
        userRepository.delete(user);
    }
}


