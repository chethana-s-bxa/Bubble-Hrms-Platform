package com.example.EmployeeManagement.Controller;



import com.example.EmployeeManagement.DTO.EmployeeSearchDTO;
import com.example.EmployeeManagement.DTO.EmployeeSearchRequestDTO;
import com.example.EmployeeManagement.Service.EmployeeService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/employees")
@RequiredArgsConstructor
public class EmployeeSearchController {

    private final EmployeeService employeeService;

//    Search is active for all
    @PreAuthorize("hasAnyRole('HR_MANAGER','HR','HR_OPERATIONS','HR_BP','HR_PAYROLL','TALENT_ACQUISITION','ADMIN','EMPLOYEE')")
    @PostMapping("/search")
    public ResponseEntity<List<EmployeeSearchDTO>> searchEmployees(
            @RequestBody EmployeeSearchRequestDTO request) {

        return ResponseEntity.ok(employeeService.searchEmployees(request));
    }

}


