package com.example.EmployeeManagement.Model;


import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "audit_log")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AuditLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long auditId;

    private String tableName;
//    private Long recordId;
    private String fieldName;

    @Column(columnDefinition = "text")
    private String oldValue;

    @Column(columnDefinition = "text")
    private String newValue;

    private String actionType;        // INSERT, UPDATE, DELETE

    // FK → employee.employee_id (who made the change)
    private Long changedBy;

    private LocalDateTime changedAt;

    private Boolean approvalRequired;

    // FK → employee.employee_id (who has approved)
    private Long approvedBy;

    private LocalDateTime approvedAt;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}

