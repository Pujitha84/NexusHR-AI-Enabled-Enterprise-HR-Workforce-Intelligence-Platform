package com.hr_nexus.documents;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface EmployeeDocumentRepository
        extends JpaRepository<EmployeeDocument, Long> {

    @Query("select new com.hr_nexus.documents.DocumentInfo("
            + "d.id, d.employeeId, d.docType, d.fileName, d.contentType, "
            + "d.fileSize, d.uploadedAt) "
            + "from EmployeeDocument d "
            + "where d.employeeId = :employeeId "
            + "order by d.uploadedAt desc")
    List<DocumentInfo> findInfoByEmployeeId(
            @Param("employeeId") Long employeeId);

    @Query("select new com.hr_nexus.documents.DocumentInfo("
            + "d.id, d.employeeId, d.docType, d.fileName, d.contentType, "
            + "d.fileSize, d.uploadedAt) "
            + "from EmployeeDocument d "
            + "order by d.uploadedAt desc")
    List<DocumentInfo> findAllInfo();

    long countByEmployeeId(Long employeeId);

    void deleteByEmployeeId(Long employeeId);
}