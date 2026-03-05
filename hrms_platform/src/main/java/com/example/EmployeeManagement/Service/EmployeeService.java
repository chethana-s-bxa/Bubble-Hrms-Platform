package com.example.EmployeeManagement.Service;

import java.util.ArrayList;
import java.util.List;

import com.example.EmployeeManagement.DTO.EmployeeCreateRequestDTO;
import com.example.EmployeeManagement.DTO.EmployeeSearchDTO;
import com.example.EmployeeManagement.DTO.EmployeeSearchRequestDTO;
import com.example.hrms_platform_document.service.storage.StorageService;
import org.springframework.stereotype.Service;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;

import com.example.EmployeeManagement.DTO.EmployeeDTO;
import com.example.EmployeeManagement.Exception.EmployeeNotFoundException;
import com.example.EmployeeManagement.Model.Employee;
import com.example.EmployeeManagement.Model.EmployeePersonal;
import com.example.EmployeeManagement.Model.JobDetails;
import com.example.EmployeeManagement.Repository.EmployeeRepository;
import com.example.hrms_platform_document.entity.Document;
import com.example.hrms_platform_document.repository.DocumentAccessLogRepository;
import com.example.hrms_platform_document.repository.DocumentAuditRepository;
import com.example.hrms_platform_document.repository.DocumentRepository;
import com.example.hrms_platform_document.repository.DocumentVersionRepository;
import com.example.notifications.service.NotificationService;
import com.example.security.util.SecurityUtil;
import com.example.security.service.UserService;
import com.example.time.repository.AttendanceRepository;
import com.example.time.repository.LeaveBalanceRepository;
import com.example.time.repository.LeaveRequestRepository;
import com.example.time.repository.LeaveTypeRepository;
import com.example.time.entity.LeaveBalance;
import com.example.time.entity.LeaveType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import jakarta.persistence.criteria.Expression;
import jakarta.persistence.criteria.Join;
import jakarta.persistence.criteria.JoinType;
import jakarta.persistence.criteria.Predicate;

import lombok.AllArgsConstructor;
import org.springframework.transaction.annotation.Transactional;

import java.util.Objects;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@AllArgsConstructor
public class EmployeeService {

    private EmployeeRepository employeeRepository;

    private EmployeeAccessService employeeAccessService;

    private UserService userService;

    private SecurityUtil securityUtil;

    private AttendanceRepository attendanceRepository;

    private LeaveRequestRepository leaveRequestRepository;

    private LeaveBalanceRepository leaveBalanceRepository;

    private LeaveTypeRepository leaveTypeRepository;

    private DocumentRepository documentRepository;

    private DocumentVersionRepository documentVersionRepository;

    private DocumentAuditRepository documentAuditRepository;

    private DocumentAccessLogRepository documentAccessLogRepository;

    private NotificationService notificationService;

    private final StorageService storageService;


    private static final List<DefaultLeaveType> DEFAULT_LEAVE_TYPES = List.of(
            new DefaultLeaveType("Bereavement Leave", 3, false),
            new DefaultLeaveType("Casual Leave", 12, false),
            new DefaultLeaveType("Earned Leave", 12, true),
            new DefaultLeaveType("Election Leave", 1, false),
            new DefaultLeaveType("Maternity Leave", 182, false),
            new DefaultLeaveType("Paternity Leave", 8, false)
    );

    public List<EmployeeDTO> getAllEmployee(){
        employeeAccessService.checkHrOrAdmin();
        return employeeRepository.findAll()
                .stream()
                .map(this::mapToDto)
                .toList();
    }

    public EmployeeDTO getEmployeeById(Long id){

        employeeAccessService.checkOwnerOrHr(id);
        Employee employee = employeeRepository.findById(id)
                .orElseThrow(() -> new EmployeeNotFoundException(id));
        return mapToDto(employee);
    }

    public List<EmployeeDTO> getEmployeeByName(String name){
        return employeeRepository.searchByFullName(name)
                .stream()
                .map(this::mapToDto)
                .toList();
    }

    public EmployeeDTO addEmployee(Employee employee){
        Employee employeeSaved = addEmployeeInternal(employee);
        return mapToDto(employeeSaved);
    }

    public Employee addEmployeeInternal(Employee employee) {
        ensureHrManagerAssignment(employee);
        Employee employeeSaved = employeeRepository.save(employee);
        initializeLeaveBalances(employeeSaved);
        return employeeSaved;
    }

    public EmployeeDTO updateEmployee(Long id, Employee updated){
        Employee existing = employeeRepository.findById(id)
                .orElseThrow(() -> new EmployeeNotFoundException(id));

        existing.setFirstName(updated.getFirstName());
        existing.setLastName(updated.getLastName());
        existing.setCompanyEmail(updated.getCompanyEmail());
        existing.setDateOfJoining(updated.getDateOfJoining());
        existing.setStatus(updated.getStatus());
        existing.setEmployeeType(updated.getEmployeeType());
        existing.setPhoneNumber(updated.getPhoneNumber());
        existing.setCurrentBand(updated.getCurrentBand());
        existing.setCurrentExperience(updated.getCurrentExperience());
        existing.setDesignation(updated.getDesignation());
        existing.setCtc(updated.getCtc());
        existing.setDepartment(updated.getDepartment());
        if (updated.getManager() != null) {
            existing.setManager(updated.getManager());
        }

        ensureHrManagerAssignment(existing);

        Employee saved = employeeRepository.save(existing);
        return mapToDto(saved);
    }

    @Transactional
    public void deleteEmployeeById(Long id) {
        employeeAccessService.checkHrOrAdmin();

        Employee employee = employeeRepository.findById(id)
                .orElseThrow(() -> new EmployeeNotFoundException(id));

        String fullName = (employee.getFirstName() + " " + employee.getLastName()).trim();
        String displayName = !fullName.isBlank() ? fullName : employee.getCompanyEmail();
        String message = "Employee " + displayName + " (ID: " + employee.getEmployeeId() + ") was deleted.";
        notificationService.create("Employee deleted", message, "EMPLOYEE_DELETED", "HR");
        notificationService.create("Employee deleted", message, "EMPLOYEE_DELETED", "ADMIN");

        // Remove manager references for subordinates
        employeeRepository.clearManagerForSubordinates(id);

        // Clear employee's user link to avoid FK issues, then delete user
        if (employee.getUser() != null) {
            employee.setUser(null);
            employeeRepository.save(employee);
        }

        // Delete time records
        attendanceRepository.deleteByEmployeeEmployeeId(id);
        leaveRequestRepository.deleteByEmployeeEmployeeId(id);
        leaveBalanceRepository.deleteByEmployeeEmployeeId(id);

        // Clean document-related references
        documentAccessLogRepository.deleteByEmployeeEmployeeId(id);
        documentAuditRepository.deleteByPerformedByEmployeeId(id);
        documentVersionRepository.deleteByUploadedByEmployeeId(id);

        // For docs approved by this employee, keep docs and clear approver
        documentRepository.clearApprovedByEmployeeId(id);

        // Delete docs owned/uploaded by this employee (and their related records)
        List<Document> docsToDelete = new ArrayList<>(documentRepository.findByEmployeeEmployeeId(id));
        docsToDelete.addAll(documentRepository.findByUploadedByEmployeeId(id));
        if (!docsToDelete.isEmpty()) {
            List<Long> docIds = docsToDelete.stream()
                    .map(Document::getDocumentId)
                    .distinct()
                    .toList();
            for (Long docId : docIds) {
                documentAccessLogRepository.deleteByDocumentDocumentId(docId);
                documentAuditRepository.deleteByDocumentDocumentId(docId);
                documentVersionRepository.deleteByDocumentDocumentId(docId);
            }
            documentRepository.deleteAllById(docIds);
        }

        // Delete the login user so the email (username) is freed for reuse
        userService.deleteByEmployeeId(id);

        employeeRepository.deleteById(id);
    }


    public EmployeeDTO mapToDto(Employee employee){
        EmployeeDTO dto = new EmployeeDTO();
        dto.setEmployeeId(employee.getEmployeeId());
        dto.setFirstName(employee.getFirstName());
        dto.setLastName(employee.getLastName());
        dto.setCompanyEmail(employee.getCompanyEmail());
        dto.setDesignation(employee.getDesignation());
        dto.setStatus(employee.getStatus());
        dto.setCurrentBand(employee.getCurrentBand());
        dto.setDateOfJoining(employee.getDateOfJoining());
        dto.setEmployeeType(employee.getEmployeeType());
        dto.setPhoneNumber(employee.getPhoneNumber());
        dto.setCurrentExperience(employee.getCurrentExperience());
        dto.setCtc(employee.getCtc());
        if (employee.getEmployeePersonal() != null) {
            dto.setPersonalEmail(employee.getEmployeePersonal().getPersonalMail());
        }

        if (employee.getJobDetails() != null)
            dto.setDepartment(employee.getJobDetails().getDepartmentName());
        else if (employee.getDepartment() != null)
            dto.setDepartment(employee.getDepartment());
        if(employee.getManager()!=null)
            dto.setManagerName(employee.getManager().getFirstName()+" "+employee.getManager().getLastName());
        if (employee.getManager() != null)
            dto.setManagerId(employee.getManager().getEmployeeId());
        dto.setSubBusinessUnit(employee.getSubBusinessUnit());
        dto.setCurrentOfficeLocation(employee.getCurrentOfficeLocation());
        return dto;
    }

    private void initializeLeaveBalances(Employee employee) {
        if (employee == null) {
            return;
        }
        ensureDefaultLeaveTypes();
        List<LeaveType> leaveTypes = leaveTypeRepository.findAll();
        Set<Long> existingTypeIds = leaveBalanceRepository.findByEmployee(employee)
                .stream()
                .map(LeaveBalance::getLeaveTypeId)
                .filter(Objects::nonNull)
                .collect(Collectors.toSet());

        for (LeaveType type : leaveTypes) {
            if (type.getLeaveTypeId() == null || existingTypeIds.contains(type.getLeaveTypeId())) {
                continue;
            }
            LeaveBalance balance = new LeaveBalance();
            balance.setEmployee(employee);
            balance.setLeaveTypeId(type.getLeaveTypeId());
            Integer total = type.getMaxPerYear();
            balance.setTotalLeaves(total);
            balance.setUsedLeaves(0);
            balance.setRemainingLeaves(total);
            leaveBalanceRepository.save(balance);
        }
    }

    private void ensureDefaultLeaveTypes() {
        for (DefaultLeaveType def : DEFAULT_LEAVE_TYPES) {
            LeaveType existing = leaveTypeRepository.findByLeaveNameIgnoreCase(def.name).orElse(null);
            if (existing == null) {
                LeaveType created = new LeaveType();
                created.setLeaveName(def.name);
                created.setMaxPerYear(def.maxPerYear);
                created.setCarryForwardAllowed(def.carryForwardAllowed);
                leaveTypeRepository.save(created);
                continue;
            }

            boolean updated = false;
            if (!Objects.equals(existing.getMaxPerYear(), def.maxPerYear)) {
                existing.setMaxPerYear(def.maxPerYear);
                updated = true;
            }
            if (!Objects.equals(existing.getCarryForwardAllowed(), def.carryForwardAllowed)) {
                existing.setCarryForwardAllowed(def.carryForwardAllowed);
                updated = true;
            }
            if (updated) {
                leaveTypeRepository.save(existing);
            }
        }
    }

    private static class DefaultLeaveType {
        private final String name;
        private final Integer maxPerYear;
        private final Boolean carryForwardAllowed;

        private DefaultLeaveType(String name, Integer maxPerYear, Boolean carryForwardAllowed) {
            this.name = name;
            this.maxPerYear = maxPerYear;
            this.carryForwardAllowed = carryForwardAllowed;
        }
    }

    public List<EmployeeDTO> getEmployeesUnderManager(Long managerId) {

        // HR can view anyone, EMPLOYEE only their own subordinates
        employeeAccessService.checkManagerAccess(managerId);

        return employeeRepository.findByManager_EmployeeId(managerId)
                .stream()
                .map(this::mapToDto)
                .toList();
    }

    public Employee toEntity(EmployeeDTO dto, Long hrUserId) {
        Employee e = new Employee();
        e.setFirstName(dto.getFirstName());
        e.setLastName(dto.getLastName());
        e.setCompanyEmail(dto.getCompanyEmail());
        e.setDateOfJoining(dto.getDateOfJoining());
        e.setStatus(dto.getStatus());
        e.setEmployeeType(dto.getEmployeeType());
        e.setPhoneNumber(dto.getPhoneNumber());
        e.setCurrentBand(dto.getCurrentBand());
        e.setCurrentExperience(dto.getCurrentExperience());
        e.setDesignation(dto.getDesignation());
        e.setCtc(dto.getCtc());
        e.setDepartment(dto.getDepartment());
        e.setCreatedByHrUserId(hrUserId);
        if (dto.getPersonalEmail() != null && !dto.getPersonalEmail().isBlank()) {
            EmployeePersonal personal = new EmployeePersonal();
            personal.setPersonalMail(dto.getPersonalEmail().trim());
            personal.setEmployee(e);
            e.setEmployeePersonal(personal);
        }
        if (dto.getManagerId() != null) {
            Employee manager = employeeRepository.findById(dto.getManagerId())
                    .orElseThrow(() -> new EmployeeNotFoundException(dto.getManagerId()));
            e.setManager(manager);
        }
        ensureHrManagerAssignment(e);
        return e;
    }

    private void ensureHrManagerAssignment(Employee employee) {
        if (!securityUtil.isHrEmployee(employee)) {
            return;
        }
        if (securityUtil.isHrManager(employee)) {
            return;
        }
        if (employee.getManager() == null) {
            Employee autoManager = securityUtil.findHrManagerForDepartment(employee.getDepartment())
                    .orElseThrow(() -> new RuntimeException("HR Manager not found for department"));
            employee.setManager(autoManager);
        }
        Employee manager = employee.getManager();
        if (!securityUtil.isHrManager(manager)) {
            throw new RuntimeException("HR employee must have an HR Manager");
        }
        if (!sameDepartment(employee.getDepartment(), manager.getDepartment())) {
            throw new RuntimeException("HR Manager must be in same department");
        }
    }

    private boolean sameDepartment(String deptA, String deptB) {
        if (deptA == null || deptB == null) {
            return false;
        }
        return deptA.trim().equalsIgnoreCase(deptB.trim());
    }

//    Employee Search based on name, department, id, location, band
    public List<EmployeeSearchDTO> searchEmployees(EmployeeSearchRequestDTO request) {


        Specification<Employee> spec = (root, query, cb) -> {

            List<Predicate> predicates = new ArrayList<>();

            if (request.getEmployeeId() != null) {
                predicates.add(cb.equal(root.get("employeeId"), request.getEmployeeId()));
            }

            if (request.getName() != null && !request.getName().isBlank()) {
                String like = "%" + request.getName().trim().toLowerCase() + "%";

                Predicate firstName = cb.like(cb.lower(root.get("firstName")), like);
                Predicate lastName = cb.like(cb.lower(root.get("lastName")), like);

                Expression<String> fullName =
                        cb.concat(cb.concat(root.get("firstName"), " "), root.get("lastName"));

                Predicate fullNamePredicate = cb.like(cb.lower(fullName), like);

                predicates.add(cb.or(firstName, lastName, fullNamePredicate));
            }

            if (request.getDesignation() != null && !request.getDesignation().isBlank()) {
                String like = "%" + request.getDesignation().trim().toLowerCase() + "%";
                predicates.add(cb.like(cb.lower(root.get("designation")), like));
            }

            Join<Employee, JobDetails> jobJoin = root.join("jobDetails", JoinType.LEFT);

            if (request.getDepartment() != null && !request.getDepartment().isBlank()) {
                String like = "%" + request.getDepartment().trim().toLowerCase() + "%";

                Predicate deptOnEmployee = cb.like(cb.lower(root.get("department")), like);
                Predicate deptOnJobDetails = cb.like(cb.lower(jobJoin.get("departmentName")), like);

                predicates.add(cb.or(deptOnEmployee, deptOnJobDetails));
            }

            if (request.getCompanyBaseLocation() != null && !request.getCompanyBaseLocation().isBlank()) {
                String like = "%" + request.getCompanyBaseLocation().trim().toLowerCase() + "%";
                predicates.add(cb.like(cb.lower(jobJoin.get("baseLocation")), like));
            }

            if (request.getBand() != null && !request.getBand().isBlank()) {
                String like = "%" + request.getBand().trim().toLowerCase() + "%";
                predicates.add(cb.like(cb.lower(root.get("currentBand")), like));
            }

            query.distinct(true);
            return cb.or(predicates.toArray(new Predicate[0]));
        };

        Page<Employee> page = employeeRepository.findAll(
                spec,
                PageRequest.of(
                        0,
                        10,
                        Sort.by("firstName").ascending()
                                .and(Sort.by("lastName").ascending())
                )
        );

        return page.getContent()
                .stream()
                .map(this::convertToSearchDTO)
                .toList();
    }

    private EmployeeSearchDTO convertToSearchDTO(Employee employee) {

        EmployeeSearchDTO dto = new EmployeeSearchDTO();

        dto.setEmployeeId(employee.getEmployeeId());
        dto.setFirstName(employee.getFirstName());
        dto.setLastName(employee.getLastName());
        dto.setCompanyEmail(employee.getCompanyEmail());
        dto.setDesignation(employee.getDesignation());

        // Department (JobDetails priority)
        if (employee.getJobDetails() != null
                && employee.getJobDetails().getDepartmentName() != null
                && !employee.getJobDetails().getDepartmentName().isBlank()) {
            dto.setDepartment(employee.getJobDetails().getDepartmentName());
        } else {
            dto.setDepartment(employee.getDepartment());
        }

        // Base location
        if (employee.getJobDetails() != null) {
            dto.setCompanyBaseLocation(employee.getJobDetails().getBaseLocation());
        }

        dto.setBand(employee.getCurrentBand());

        // Manager details
        if (employee.getManager() != null) {

            dto.setManagerName(
                    employee.getManager().getFirstName() + " " +
                            employee.getManager().getLastName()
            );

            EmployeeDTO managerDTO = new EmployeeDTO();
            managerDTO.setEmployeeId(employee.getManager().getEmployeeId());
            managerDTO.setFirstName(employee.getManager().getFirstName());
            managerDTO.setLastName(employee.getManager().getLastName());

            dto.setManager(managerDTO);
        }

        // Profile image URL (Presigned)
        if (employee.getProfileImageKey() != null) {
            dto.setProfileImageUrl(
                    storageService.generatePresignedUrl(employee.getProfileImageKey())
            );
        }

        return dto;
    }

    public Employee toEntityFromCreateRequest(
            EmployeeCreateRequestDTO request,
            Long hrUserId,
            String companyEmail
    ) {

        Employee e = new Employee();

        e.setFirstName(request.getFirstName());
        e.setLastName(request.getLastName());
        e.setCompanyEmail(companyEmail);
        e.setDateOfJoining(request.getDateOfJoining());
        e.setEmployeeType(request.getEmployeeType());
        e.setPhoneNumber(request.getPhoneNumber());
        e.setCurrentBand(request.getCurrentBand());
        e.setCurrentExperience(
                request.getCurrentExperience() != null ? request.getCurrentExperience() : 0
        );
        e.setDesignation(request.getDesignation());
        e.setCtc(request.getCtc() != null ? request.getCtc() : 0);
        e.setDepartment(request.getDepartment());
        e.setStatus("ACTIVE");
        e.setCreatedByHrUserId(hrUserId);
        e.setSubBusinessUnit(request.getSubBusinessUnit());
        e.setCurrentOfficeLocation(request.getCurrentOfficeLocation());

        if (request.getManagerId() != null) {
            Employee manager = employeeRepository.findById(request.getManagerId())
                    .orElseThrow(() ->
                            new EmployeeNotFoundException(request.getManagerId()));

            e.setManager(manager);
        }

        if (request.getPersonalEmail() != null && !request.getPersonalEmail().isBlank()) {
            EmployeePersonal personal = new EmployeePersonal();
            personal.setPersonalMail(request.getPersonalEmail().trim());
            personal.setEmployee(e);
            e.setEmployeePersonal(personal);
        }

        ensureHrManagerAssignment(e);

        return e;
    }

}
