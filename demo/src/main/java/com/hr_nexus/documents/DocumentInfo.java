package com.hr_nexus.documents;

import java.time.LocalDateTime;

// Document details without the file bytes, used for lists.
public record DocumentInfo(
        Long id,
        Long employeeId,
        String docType,
        String fileName,
        String contentType,
        Long fileSize,
        LocalDateTime uploadedAt) {
}