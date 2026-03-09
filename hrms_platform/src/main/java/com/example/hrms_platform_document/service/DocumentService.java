package com.example.hrms_platform_document.service;

import com.example.EmployeeManagement.Model.Employee;
import com.example.EmployeeManagement.Repository.EmployeeRepository;
import com.example.hrms_platform_document.entity.Document;
import com.example.hrms_platform_document.entity.DocumentVersion;
import com.example.hrms_platform_document.enums.DocumentAuditAction;
import com.example.hrms_platform_document.enums.DocumentStatus;
import com.example.hrms_platform_document.exception.DocumentNotFoundException;
import com.example.hrms_platform_document.exception.InvalidDocumentStateException;
import com.example.hrms_platform_document.repository.DocumentRepository;
import com.example.hrms_platform_document.repository.DocumentVersionRepository;
import com.example.hrms_platform_document.service.storage.StorageService;
import com.example.security.util.SecurityUtil;
import lombok.Data;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;


import java.util.UUID;
import java.util.List;
@Data
@Service
public class DocumentService {

    private static final Logger logger = LoggerFactory.getLogger(DocumentService.class);

    private final DocumentRepository documentRepository;
    private final DocumentVersionRepository versionRepository;
    private final StorageService storageService;
    private final DocumentAuditService auditService;
    private final DocumentAccessLogService accessLogService;
    private final EmployeeRepository employeeRepository;
    private final SecurityUtil securityUtil;

    public DocumentService(
            DocumentRepository documentRepository,
            DocumentVersionRepository versionRepository,
            StorageService storageService,
            DocumentAuditService auditService,
            DocumentAccessLogService accessLogService,
            EmployeeRepository employeeRepository,
            SecurityUtil securityUtil
    ) {
        this.documentRepository = documentRepository;
        this.versionRepository = versionRepository;
        this.storageService = storageService;
        this.auditService = auditService;
        this.accessLogService = accessLogService;
        this.employeeRepository = employeeRepository;
        this.securityUtil = securityUtil;
    }

    private Employee getCurrentEmployee() {
        return securityUtil.getLoggedInEmployee();
    }

    /**
     * Upload document (logged-in employee)
     */
    @Transactional
    public Document uploadDocument(
            MultipartFile file,
            String documentType,
            String documentName,
            boolean isConfidential
    ) {
        return uploadDocument(getCurrentEmployee(), file, documentType, documentName, isConfidential);
    }

    /**
     * Upload document (initial upload)
     */
    @Transactional
    public Document uploadDocument(
            Employee owner,
            MultipartFile file,
            String documentType,
            String documentName,
            boolean isConfidential
    ) {

        // Create Document (logical)
        Document document = new Document();
        document.setEmployee(owner);
        document.setUploadedBy(owner);
        document.setDocumentType(documentType);
        document.setDocumentName(documentName);
        document.setIsConfidential(isConfidential);
        document.setStatus(DocumentStatus.PENDING_VERIFICATION);

        document = documentRepository.save(document);

        //Create S3 key (STAGING)
        String s3Key = buildStagingKey(owner.getEmployeeId(), document.getDocumentId());

        //Upload to S3
        storageService.uploadToStaging(file, s3Key);

        //Create Document Version
        DocumentVersion version = new DocumentVersion();
        version.setDocument(document);
        version.setUploadedBy(owner);
        version.setVersionNumber(1);
        version.setS3Key(s3Key);

        version = versionRepository.save(version);

        //Update document with current version
        document.setCurrentVersion(version);
        documentRepository.save(document);

        //Audit log
        auditService.log(
                document,
                version,
                DocumentAuditAction.UPLOAD,
                owner,
                "Initial document upload"
        );

        return document;
    }

    private String buildStagingKey(Long employeeId, Long documentId) {
        return "staging/employee/"
                + employeeId + "/"
                + documentId + "/"
                + UUID.randomUUID();
    }

    @Transactional
    public Document reuploadDocument(
            Long documentId,
            Employee employee,
            MultipartFile file
    ) {
        Document document = documentRepository.findById(documentId)
                .orElseThrow(() -> new DocumentNotFoundException(documentId));

        if (document.getStatus() != DocumentStatus.REJECTED) {
            throw new InvalidDocumentStateException("Only REJECTED documents can be re-uploaded");

        }

        //Get next version number
        int nextVersion = versionRepository
                .findTopByDocumentDocumentIdOrderByVersionNumberDesc(documentId)
                .map(v -> v.getVersionNumber() + 1)
                .orElse(1);

        //Build staging key
        String s3Key = "staging/employee/"
                + document.getEmployee().getEmployeeId()
                + "/" + documentId
                + "/v" + nextVersion;

        //Upload to S3
        storageService.uploadToStaging(file, s3Key);

        //Create new version
        DocumentVersion version = new DocumentVersion();
        version.setDocument(document);
        version.setUploadedBy(employee);
        version.setVersionNumber(nextVersion);
        version.setS3Key(s3Key);

        versionRepository.save(version);

        //Update document
        document.setCurrentVersion(version);
        document.setStatus(DocumentStatus.PENDING_VERIFICATION);
        documentRepository.save(document);

        //Audit
        auditService.log(
                document,
                version,
                DocumentAuditAction.REUPLOAD,
                employee,
                "Document re-uploaded after rejection"
        );

        return document;
    }

    /**
     * Re-upload document (logged-in employee, owner only)
     */
    @Transactional
    public Document reuploadDocument(Long documentId, MultipartFile file) {
        Employee currentEmployee = getCurrentEmployee();
        Document document = documentRepository.findById(documentId)
                .orElseThrow(() -> new DocumentNotFoundException(documentId));

        if (!document.getEmployee().getEmployeeId().equals(currentEmployee.getEmployeeId())) {
            throw new RuntimeException("You are not allowed to re-upload this document");
        }

        return reuploadDocument(documentId, currentEmployee, file);
    }

    @Transactional(readOnly = true)
    @Cacheable(value = "documents", key = "#documentId")
    public Document getDocumentById(Long documentId) {
        return documentRepository.findById(documentId)
                .orElseThrow(() -> new DocumentNotFoundException(documentId));
    }

    /**
     * Download (owner only, verified only)
     */
    @Transactional(readOnly = true)
    public Document getDocumentForDownload(Long documentId) {
        Employee currentEmployee = getCurrentEmployee();
        Document document = getDocumentById(documentId);

        boolean isOwner = document.getEmployee().getEmployeeId().equals(currentEmployee.getEmployeeId());
        boolean canDownload = isOwner
                || securityUtil.hasRole("ADMIN")
                || securityUtil.isHrUser();
        if (!canDownload) {
            throw new RuntimeException("You are not allowed to download this document");
        }

        if (document.getCurrentVersion() == null) {
            versionRepository
                    .findTopByDocumentDocumentIdOrderByVersionNumberDesc(documentId)
                    .ifPresent(document::setCurrentVersion);
        }

        if (document.getCurrentVersion() == null) {
            throw new InvalidDocumentStateException("Document file not found. Please reupload.");
        }

        return document;
    }

    @Transactional
    public String resolveDownloadKey(Document document) {
        if (document.getCurrentVersion() == null) {
            versionRepository
                    .findTopByDocumentDocumentIdOrderByVersionNumberDesc(document.getDocumentId())
                    .ifPresent(document::setCurrentVersion);
        }

        if (document.getCurrentVersion() == null || document.getCurrentVersion().getS3Key() == null) {
            throw new InvalidDocumentStateException("Document file not found. Please reupload.");
        }

        String currentKey = document.getCurrentVersion().getS3Key();
        if (storageService.exists(currentKey)) {
            return currentKey;
        }

        // Auto-repair: try the latest file from staging when verified key is missing.
        String stagingPrefix = "staging/employee/"
                + document.getEmployee().getEmployeeId()
                + "/"
                + document.getDocumentId()
                + "/";

        String latestStagingKey = storageService.findLatestKey(stagingPrefix);
        if (latestStagingKey != null) {
            // If document is verified, restore the verified key and keep data consistent.
            if (DocumentStatus.VERIFIED.equals(document.getStatus())) {
                String verifiedKey = "verified/employee/"
                        + document.getEmployee().getEmployeeId()
                        + "/"
                        + document.getDocumentId()
                        + "/v"
                        + document.getCurrentVersion().getVersionNumber();
                try {
                    storageService.moveToVerified(latestStagingKey, verifiedKey);
                    document.getCurrentVersion().setS3Key(verifiedKey);
                    versionRepository.save(document.getCurrentVersion());
                    return verifiedKey;
                } catch (Exception e) {
                    logger.warn("Failed to restore verified key for document {}. Falling back to staging.", document.getDocumentId(), e);
                    return latestStagingKey;
                }
            }
            return latestStagingKey;
        }

        throw new InvalidDocumentStateException("Document file not found in storage. Please reupload.");
    }

    @Transactional(readOnly = true)
    public List<Document> getDocumentsByEmployee(Long employeeId) {
        return documentRepository.findByEmployeeEmployeeId(employeeId);
    }

    /**
     * Delete document (owner or HR/ADMIN)
     */
    @Transactional
    public void deleteDocument(Long documentId) {
        Document document = getDocumentById(documentId);
        boolean isOwner = isOwner(documentId);
        boolean canDelete = isOwner || securityUtil.hasRole("ADMIN") || securityUtil.isHrUser();
        if (!canDelete) {
            throw new RuntimeException("You are not allowed to delete this document");
        }

        // Remove access logs and audit references before deleting versions to satisfy FK constraints.
        accessLogService.deleteByDocumentId(documentId);
        auditService.deleteByDocumentId(documentId);

        if (document.getCurrentVersion() != null) {
            try {
                storageService.delete(document.getCurrentVersion().getS3Key());
            } catch (Exception e) {
                logger.warn("Failed to delete S3 object for document {}. Continuing DB delete.", documentId, e);
            }
        }
        document.setCurrentVersion(null);
        documentRepository.save(document);
        versionRepository.deleteByDocumentDocumentId(documentId);
        documentRepository.delete(document);
    }

    @Transactional(readOnly = true)
    public List<Document> getPendingDocuments() {
        return documentRepository.findByStatus(DocumentStatus.PENDING_VERIFICATION);
    }

    @Transactional(readOnly = true)
    public List<Document> getPendingDocumentsForHrManager(String department) {
        return documentRepository.findByStatus(DocumentStatus.PENDING_VERIFICATION)
                .stream()
                .filter(doc -> securityUtil.isHrEmployee(doc.getEmployee()))
                .filter(doc -> sameDepartment(doc.getEmployee(), department))
                .toList();
    }

    @Transactional(readOnly = true)
    public List<Document> getPendingDocumentsNonHr() {
        return documentRepository.findByStatus(DocumentStatus.PENDING_VERIFICATION)
                .stream()
                .filter(doc -> !securityUtil.isHrEmployee(doc.getEmployee()))
                .toList();
    }

    public Employee getEmployee(Long employeeId) {
        return employeeRepository.findById(employeeId)
                .orElseThrow(() -> new RuntimeException("Employee not found"));
    }

    public boolean isOwner(Long documentId) {
        Employee loggedIn = securityUtil.getLoggedInEmployee();
        Document document = getDocumentById(documentId);
        return document.getEmployee().getEmployeeId().equals(loggedIn.getEmployeeId());
    }

    public void enforceHrManagerForHrEmployee(Document document) {
        if (!securityUtil.isHrEmployee(document.getEmployee())) {
            return;
        }
        if (securityUtil.hasRole("ADMIN")) {
            return;
        }
        if (!securityUtil.hasRole("HR_MANAGER")) {
            throw new RuntimeException("Only HR Manager can approve/reject HR team documents");
        }
        Employee approver = securityUtil.getLoggedInEmployeeOptional()
                .orElseThrow(() -> new RuntimeException("HR Manager employee record not found"));
        String approverDept = approver.getDepartment();
        String employeeDept = document.getEmployee().getDepartment();
        if (!sameDepartment(employeeDept, approverDept)) {
            throw new RuntimeException("HR Manager must be in same department");
        }
    }

    public void enforceHrManagerOnlyForHrTeam(Document document) {
        if (securityUtil.hasRole("ADMIN")) {
            return;
        }
        if (securityUtil.hasRole("HR_MANAGER") && !securityUtil.isHrEmployee(document.getEmployee())) {
            throw new RuntimeException("HR Manager can approve only HR team documents");
        }
    }

    private boolean sameDepartment(Employee employee, String department) {
        if (employee == null) return false;
        return sameDepartment(employee.getDepartment(), department);
    }

    private boolean sameDepartment(String deptA, String deptB) {
        if (deptA == null || deptB == null) {
            return false;
        }
        return deptA.trim().equalsIgnoreCase(deptB.trim());
    }

}

