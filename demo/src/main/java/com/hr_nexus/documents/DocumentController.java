package com.hr_nexus.documents;

import java.io.IOException;
import java.util.List;
import java.util.Locale;
import java.util.Set;

import com.hr_nexus.employee.EmployeeRepository;

import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api/documents")
public class DocumentController {

    private static final long MAX_BYTES = 2L * 1024 * 1024;

    private static final Set<String> DOC_TYPES = Set.of(
            "ID_PROOF", "OFFER_LETTER", "EDUCATION", "ADDRESS_PROOF", "OTHER");

    private final EmployeeDocumentRepository repository;
    private final EmployeeRepository employeeRepository;

    public DocumentController(
            EmployeeDocumentRepository repository,
            EmployeeRepository employeeRepository) {
        this.repository = repository;
        this.employeeRepository = employeeRepository;
    }

    @GetMapping
    public List<DocumentInfo> list(
            @RequestParam(required = false) Long employeeId) {
        if (employeeId != null) {
            return repository.findInfoByEmployeeId(employeeId);
        }
        return repository.findAllInfo();
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public DocumentInfo upload(
            @RequestParam Long employeeId,
            @RequestParam String docType,
            @RequestParam MultipartFile file) throws IOException {

        if (!employeeRepository.existsById(employeeId)) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST, "Employee does not exist");
        }

        String type = docType.trim().toUpperCase(Locale.ROOT);
        if (!DOC_TYPES.contains(type)) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST, "Choose a valid document type");
        }

        if (file.isEmpty()) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST, "Choose a file to upload");
        }
        if (file.getSize() > MAX_BYTES) {
            throw new ResponseStatusException(
                    HttpStatus.PAYLOAD_TOO_LARGE,
                    "File is too large. The maximum size is 2 MB.");
        }

        String originalName = file.getOriginalFilename();
        if (originalName == null || originalName.isBlank()) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST, "The file has no name");
        }

        String safeName = originalName.replaceAll("[^A-Za-z0-9._ -]", "_");
        if (safeName.length() > 150) {
            safeName = safeName.substring(safeName.length() - 150);
        }

        int dot = safeName.lastIndexOf('.');
        String extension = dot >= 0
                ? safeName.substring(dot + 1).toLowerCase(Locale.ROOT)
                : "";

        byte[] bytes = file.getBytes();
        String contentType = detectContentType(extension, bytes);

        EmployeeDocument document = new EmployeeDocument();
        document.setEmployeeId(employeeId);
        document.setDocType(type);
        document.setFileName(safeName);
        document.setContentType(contentType);
        document.setFileSize((long) bytes.length);
        document.setData(bytes);

        EmployeeDocument saved = repository.save(document);

        return new DocumentInfo(
                saved.getId(),
                saved.getEmployeeId(),
                saved.getDocType(),
                saved.getFileName(),
                saved.getContentType(),
                saved.getFileSize(),
                saved.getUploadedAt());
    }

    @GetMapping("/{id}/download")
    public ResponseEntity<byte[]> download(@PathVariable Long id) {
        EmployeeDocument document = repository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "Document not found"));

        ContentDisposition disposition = ContentDisposition
                .builder("attachment")
                .filename(document.getFileName())
                .build();

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, disposition.toString())
                .header("X-Content-Type-Options", "nosniff")
                .contentType(MediaType.parseMediaType(document.getContentType()))
                .body(document.getData());
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable Long id) {
        if (!repository.existsById(id)) {
            throw new ResponseStatusException(
                    HttpStatus.NOT_FOUND, "Document not found");
        }
        repository.deleteById(id);
    }

    // Accept only PDF, PNG and JPEG, and check the file really starts like one.
    private String detectContentType(String extension, byte[] bytes) {
        if (extension.equals("pdf") && startsWith(bytes, 0x25, 0x50, 0x44, 0x46)) {
            return "application/pdf";
        }
        if (extension.equals("png")
                && startsWith(bytes, 0x89, 0x50, 0x4E, 0x47)) {
            return "image/png";
        }
        if ((extension.equals("jpg") || extension.equals("jpeg"))
                && startsWith(bytes, 0xFF, 0xD8, 0xFF)) {
            return "image/jpeg";
        }
        throw new ResponseStatusException(
                HttpStatus.BAD_REQUEST,
                "Only PDF, PNG and JPG files are allowed");
    }

    private boolean startsWith(byte[] bytes, int... signature) {
        if (bytes.length < signature.length) {
            return false;
        }
        for (int i = 0; i < signature.length; i++) {
            if ((bytes[i] & 0xFF) != signature[i]) {
                return false;
            }
        }
        return true;
    }
}