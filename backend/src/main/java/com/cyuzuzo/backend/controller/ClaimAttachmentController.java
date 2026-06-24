package com.cyuzuzo.backend.controller;

import com.cyuzuzo.backend.model.Claim;
import com.cyuzuzo.backend.model.ClaimAttachmentDownload;
import com.cyuzuzo.backend.service.ClaimAccessService;
import com.cyuzuzo.backend.service.ClaimDomainService;
import java.util.List;
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
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/claims")
public class ClaimAttachmentController {

    private final ClaimDomainService claimDomainService;
    private final ClaimAccessService claimAccessService;

    public ClaimAttachmentController(ClaimDomainService claimDomainService, ClaimAccessService claimAccessService) {
        this.claimDomainService = claimDomainService;
        this.claimAccessService = claimAccessService;
    }

    @PostMapping(value = "/{claimId}/attachments", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<?> upload(@PathVariable String claimId, @RequestParam(value = "files", required = false) List<MultipartFile> files) {
        if (files == null || files.stream().allMatch(f -> f == null || f.isEmpty())) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(new ApiErrorResponse("At least one file is required"));
        }
        Claim existing = claimDomainService.getClaim(claimId);
        if (existing == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(new ApiErrorResponse("Claim not found"));
        }
        if (!claimAccessService.canUploadEvidence(existing)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(new ApiErrorResponse("You can only upload evidence to your own claims."));
        }
        try {
            Claim updated = claimDomainService.attachFiles(claimId, files);
            if (updated == null) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body(new ApiErrorResponse("Claim not found"));
            }
            return ResponseEntity.ok(updated);
        } catch (IllegalArgumentException ex) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(new ApiErrorResponse(ex.getMessage()));
        }
    }

    @DeleteMapping("/{claimId}/attachments/{documentId}")
    public ResponseEntity<?> delete(@PathVariable String claimId, @PathVariable String documentId) {
        Claim existing = claimDomainService.getClaim(claimId);
        if (existing == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(new ApiErrorResponse("Claim not found"));
        }
        if (!claimAccessService.canUploadEvidence(existing)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(new ApiErrorResponse("You can only manage evidence on your own claims."));
        }
        Claim updated = claimDomainService.removeAttachment(claimId, documentId);
        if (updated == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(new ApiErrorResponse("Attachment not found"));
        }
        return ResponseEntity.ok(updated);
    }

    @GetMapping("/{claimId}/attachments/{documentId}/download")
    public ResponseEntity<?> download(@PathVariable String claimId, @PathVariable String documentId) {
        Claim claim = claimDomainService.getClaim(claimId);
        if (claim == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(new ApiErrorResponse("Claim not found"));
        }
        if (!claimAccessService.canView(claim)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(new ApiErrorResponse("You can only download evidence from your own claims."));
        }
        try {
            ClaimAttachmentDownload download = claimDomainService.loadAttachment(claimId, documentId);
            if (download == null) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body(new ApiErrorResponse("Attachment not found"));
            }
            String disposition = download.contentType().getType().startsWith("image/")
                ? "inline"
                : "attachment";
            return ResponseEntity.ok()
                .header(
                    HttpHeaders.CONTENT_DISPOSITION,
                    disposition + "; filename=\"" + download.filename().replace("\"", "") + "\""
                )
                .contentType(download.contentType())
                .body(download.resource());
        } catch (java.io.IOException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(new ApiErrorResponse("Attachment not found"));
        }
    }
}
