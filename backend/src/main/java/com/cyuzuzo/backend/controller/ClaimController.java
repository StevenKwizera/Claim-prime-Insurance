package com.cyuzuzo.backend.controller;

import com.cyuzuzo.backend.model.Claim;
import com.cyuzuzo.backend.model.ClaimActionRequest;
import com.cyuzuzo.backend.model.ClaimNoteRequest;
import com.cyuzuzo.backend.model.ClaimSubmissionRequest;
import jakarta.validation.Valid;
import com.cyuzuzo.backend.service.ClaimAccessService;
import com.cyuzuzo.backend.service.ClaimDomainService;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/claims")
public class ClaimController {
    private final ClaimDomainService claimDomainService;
    private final ClaimAccessService claimAccessService;

    public ClaimController(ClaimDomainService claimDomainService, ClaimAccessService claimAccessService) {
        this.claimDomainService = claimDomainService;
        this.claimAccessService = claimAccessService;
    }

    @GetMapping
    public List<Claim> listClaims() {
        return claimAccessService.filterVisible(claimDomainService.listClaims());
    }

    @GetMapping("/{claimId}")
    public ResponseEntity<?> getClaim(@PathVariable String claimId) {
        Claim claim = claimDomainService.getClaim(claimId);
        if (claim == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(new ErrorResponse("Claim not found"));
        }
        if (!claimAccessService.canView(claim)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(new ErrorResponse("You can only view your own claims."));
        }
        return ResponseEntity.ok(claim);
    }

    @PostMapping
    public ResponseEntity<?> createClaim(@RequestBody ClaimSubmissionRequest request) {
        try {
            claimAccessService.assertClaimantNameMatchesAccount(request.claimantName());
            return ResponseEntity.status(HttpStatus.CREATED).body(claimDomainService.createSubmittedClaim(request));
        } catch (IllegalArgumentException ex) {
            return ResponseEntity.badRequest().body(new ErrorResponse(ex.getMessage()));
        }
    }

    @PostMapping("/draft")
    public ResponseEntity<?> createDraft(@RequestBody ClaimSubmissionRequest request) {
        try {
            claimAccessService.assertClaimantNameMatchesAccount(request.claimantName());
            return ResponseEntity.status(HttpStatus.CREATED).body(claimDomainService.createDraft(request));
        } catch (IllegalArgumentException ex) {
            return ResponseEntity.badRequest().body(new ErrorResponse(ex.getMessage()));
        }
    }

    @PutMapping("/{claimId}")
    public ResponseEntity<?> updateOwnedClaim(@PathVariable String claimId, @RequestBody ClaimSubmissionRequest request) {
        Claim existing = claimDomainService.getClaim(claimId);
        if (existing == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(new ErrorResponse("Claim not found"));
        }
        if (!claimAccessService.canModifyAsClaimant(existing)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                .body(new ErrorResponse("You can only edit your own claims while they are Draft, Pending, or Under Review."));
        }
        try {
            Claim updated = claimDomainService.updateOwnedClaim(claimId, request);
            if (updated == null) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body(new ErrorResponse("Claim not found"));
            }
            return ResponseEntity.ok(updated);
        } catch (IllegalArgumentException ex) {
            return ResponseEntity.badRequest().body(new ErrorResponse(ex.getMessage()));
        }
    }

    @DeleteMapping("/{claimId}")
    public ResponseEntity<?> deleteOwnedClaim(@PathVariable String claimId) {
        Claim existing = claimDomainService.getClaim(claimId);
        if (existing == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(new ErrorResponse("Claim not found"));
        }
        if (!claimAccessService.canDeleteAsClaimant(existing)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                .body(new ErrorResponse("You can only delete your own claims that are not approved or under investigation."));
        }
        try {
            boolean deleted = claimDomainService.deleteOwnedClaim(claimId);
            if (!deleted) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body(new ErrorResponse("Claim not found"));
            }
            return ResponseEntity.ok(new java.util.LinkedHashMap<>(java.util.Map.of("message", "Claim deleted.", "claimId", claimId)));
        } catch (IllegalArgumentException ex) {
            return ResponseEntity.badRequest().body(new ErrorResponse(ex.getMessage()));
        }
    }

    @PatchMapping("/{claimId}/action")
    public ResponseEntity<?> updateClaim(@PathVariable String claimId, @RequestBody ClaimActionRequest request) {
        if (!claimAccessService.canPerformOfficerAction()) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                .body(new ErrorResponse("Only officers, supervisors, and investigators can perform this action."));
        }
        Claim updated = claimDomainService.applyAction(claimId, request);
        if (updated == null) {
            Claim claim = claimDomainService.getClaim(claimId);
            if (claim == null) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body(new ErrorResponse("Claim not found"));
            }
            return ResponseEntity.badRequest().body(new ErrorResponse("Unsupported action"));
        }
        return ResponseEntity.ok(updated);
    }

    @PostMapping("/{claimId}/notes")
    public ResponseEntity<?> addNote(@PathVariable String claimId, @Valid @RequestBody ClaimNoteRequest request) {
        try {
            Claim updated = claimDomainService.addInternalNote(claimId, request.note(), request.actor());
            if (updated == null) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body(new ErrorResponse("Claim not found"));
            }
            return ResponseEntity.ok(updated);
        } catch (IllegalArgumentException ex) {
            return ResponseEntity.badRequest().body(new ErrorResponse(ex.getMessage()));
        }
    }

    private record ErrorResponse(String message) {
    }
}
