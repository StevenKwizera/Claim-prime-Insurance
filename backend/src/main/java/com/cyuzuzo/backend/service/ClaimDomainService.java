package com.cyuzuzo.backend.service;

import com.cyuzuzo.backend.model.AnalyticsPoint;
import com.cyuzuzo.backend.model.Claim;
import com.cyuzuzo.backend.model.ClaimActionRequest;
import com.cyuzuzo.backend.model.ClaimAttachmentDownload;
import com.cyuzuzo.backend.model.ClaimDocument;
import com.cyuzuzo.backend.model.ClaimSubmissionRequest;
import com.cyuzuzo.backend.model.NotificationItem;
import com.cyuzuzo.backend.model.TimelineEntry;
import com.cyuzuzo.backend.model.UploadFileInput;
import com.cyuzuzo.backend.repository.ClaimRepository;
import com.cyuzuzo.backend.repository.NotificationRepository;
import java.math.BigDecimal;
import java.time.Instant;
import java.time.ZoneOffset;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

@Service
public class ClaimDomainService {
    private final ClaimRepository claimRepository;
    private final NotificationRepository notificationRepository;
    private final ClaimFileStorage claimFileStorage;
    private final EmailNotificationService emailNotificationService;
    private final ClaimAssessmentService claimAssessmentService;

    public ClaimDomainService(
        ClaimRepository claimRepository,
        NotificationRepository notificationRepository,
        ClaimFileStorage claimFileStorage,
        EmailNotificationService emailNotificationService,
        ClaimAssessmentService claimAssessmentService
    ) {
        this.claimRepository = claimRepository;
        this.notificationRepository = notificationRepository;
        this.claimFileStorage = claimFileStorage;
        this.emailNotificationService = emailNotificationService;
        this.claimAssessmentService = claimAssessmentService;
    }

    public List<Claim> listClaims() {
        return claimRepository.findAll().stream().map(claimAssessmentService::withAssessment).toList();
    }

    public Claim getClaim(String id) {
        Claim claim = claimRepository.findById(id).orElse(null);
        return claim == null ? null : claimAssessmentService.withAssessment(claim);
    }

    public Claim createDraft(ClaimSubmissionRequest request) {
        Claim claim = buildClaim(request, "Draft");
        claimRepository.insert(claim);
        notificationRepository.insert(createNotification(
            "Draft saved successfully",
            claim.id() + " has been saved and can be resumed later.",
            "Read"
        ));
        emailNotificationService.sendPlain(
            "Draft saved: " + claim.id(),
            "Claimant: " + claim.claimantName() + "\nPolicy: " + claim.policyNumber() + "\nStatus: Draft"
        );
        return claim;
    }

    public Claim updateOwnedClaim(String claimId, ClaimSubmissionRequest request) {
        Claim claim = getClaim(claimId);
        if (claim == null) {
            return null;
        }
        if (!isStatusModifiableByClaimant(claim.status())) {
            throw new IllegalArgumentException(
                "This claim can no longer be edited. Only Draft, Pending, and Under Review claims can be updated."
            );
        }
        if (request.claimantName() != null
            && !request.claimantName().trim().equalsIgnoreCase(claim.claimantName().trim())) {
            throw new IllegalArgumentException("Claimant name cannot be changed on an existing claim.");
        }

        String claimType = request.claimType() != null && !request.claimType().isBlank()
            ? request.claimType()
            : claim.type();
        String policyNumber = request.policyNumber() != null && !request.policyNumber().isBlank()
            ? request.policyNumber()
            : claim.policyNumber();

        List<ClaimDocument> documents = mergeDocuments(claim.documents(), buildDocuments(request.files()));
        ClaimAssessmentService.AssessmentResult assessment = claimAssessmentService.assess(
            claimType,
            claim.status(),
            documents
        );
        int riskScore = assessment.fraudRiskScore();
        Map<String, String> route = routeClaim(claimType, riskScore);

        boolean isDraft = "Draft".equals(claim.status());
        String aiSummary = isDraft
            ? resolveDraftSummary(request, claim)
            : assessment.summary();

        List<TimelineEntry> timeline = appendTimeline(
            claim,
            new TimelineEntry(
                "tl-" + claimId + "-upd-" + System.currentTimeMillis(),
                "Claim details updated by claimant",
                now(),
                claim.claimantName(),
                "neutral"
            )
        );

        Claim updated = new Claim(
            claim.id(),
            claim.claimantName(),
            policyNumber,
            claimType,
            claim.status(),
            claim.region(),
            claim.submittedAt(),
            claim.estimatedCompletion(),
            riskScore,
            BigDecimal.ZERO,
            aiSummary,
            isDraft ? claim.assignedTeam() : route.get("team"),
            isDraft ? claim.assignedOfficer() : route.get("officer"),
            documents,
            timeline
        );
        claimRepository.update(updated);
        notificationRepository.insert(createNotification(
            "Claim updated",
            claimId + " was updated by the claimant.",
            "Unread"
        ));
        return updated;
    }

    public boolean deleteOwnedClaim(String claimId) {
        Claim claim = getClaim(claimId);
        if (claim == null) {
            return false;
        }
        if (!isStatusDeletableByClaimant(claim.status())) {
            throw new IllegalArgumentException(
                "This claim cannot be deleted. Approved and investigation claims are locked."
            );
        }
        int removed = claimRepository.deleteById(claimId);
        if (removed > 0) {
            notificationRepository.insert(createNotification(
                "Claim withdrawn",
                claimId + " was deleted by the claimant.",
                "Read"
            ));
        }
        return removed > 0;
    }

    public Claim createSubmittedClaim(ClaimSubmissionRequest request) {
        Claim claim = buildClaim(request, "Under Review");
        claimRepository.insert(claim);
        notificationRepository.insert(createNotification(
            "Claim submitted successfully",
            claim.id() + " was created and routed to " + claim.assignedTeam() + ".",
            "Unread"
        ));
        notificationRepository.insert(createNotification(
            "Your claim is being reviewed by an officer.",
            claim.id() + ": AI document and fraud checks are complete. Status is Under Review.",
            "Unread"
        ));
        notificationRepository.insert(createNotification(
            "New claim in review queue",
            claim.id() + " from " + claim.claimantName() + " is ready for officer review.",
            "Unread"
        ));
        emailNotificationService.sendPlain(
            "Claim submitted: " + claim.id(),
            "Claimant: " + claim.claimantName()
                + "\nPolicy: " + claim.policyNumber()
                + "\nType: " + claim.type()
                + "\nTeam: " + claim.assignedTeam()
                + "\nRisk score: " + claim.riskScore()
        );
        return claim;
    }

    public Claim applyAction(String claimId, ClaimActionRequest request) {
        Claim claim = getClaim(claimId);
        if (claim == null) {
            return null;
        }

        String actor = request.actor() == null || request.actor().isBlank() ? "System User" : request.actor();
        String timestamp = now();
        TimelineEntry entry;
        Claim updated;
        NotificationItem notification;

        switch (request.action()) {
            case "approve" -> {
                entry = new TimelineEntry("tl-" + claimId + "-" + System.currentTimeMillis(), "Final decision: Approved (officer signature recorded)", timestamp, actor, "success");
                List<TimelineEntry> approvedTimeline = appendTimeline(claim, entry);
                approvedTimeline.add(new TimelineEntry(
                    "tl-" + claimId + "-closed-" + System.currentTimeMillis(),
                    "Claim closed — no payment processed in this system",
                    timestamp,
                    "System",
                    "neutral"
                ));
                String decisionSummary = "Officer decision: Claim valid. Evidence consistent. Documents complete. Approved by " + actor + ".";
                updated = new Claim(
                    claim.id(),
                    claim.claimantName(),
                    claim.policyNumber(),
                    claim.type(),
                    "Approved",
                    claim.region(),
                    claim.submittedAt(),
                    claim.estimatedCompletion(),
                    claim.riskScore(),
                    BigDecimal.ZERO,
                    decisionSummary,
                    claim.assignedTeam(),
                    claim.assignedOfficer(),
                    claim.documents(),
                    approvedTimeline
                );
                notification = createNotification(
                    "Your claim has been approved.",
                    claim.id() + " has been approved. This portal records the decision only — no payment is processed here.",
                    "Unread"
                );
            }
            case "reject" -> {
                entry = new TimelineEntry("tl-" + claimId + "-" + System.currentTimeMillis(), "Claim rejected", timestamp, actor, "danger");
                updated = withClaim(claim, "Rejected", claim.assignedTeam(), claim.assignedOfficer(), appendTimeline(claim, entry));
                notification = createNotification("Claim rejected", claim.id() + " was rejected by " + actor + ".", "Unread");
            }
            case "request-info" -> {
                String officerNote = request.message() == null || request.message().isBlank()
                    ? "Please upload the requested documents (photos or PDFs)."
                    : request.message().trim();
                entry = new TimelineEntry(
                    "tl-" + claimId + "-" + System.currentTimeMillis(),
                    "Officer requested more information: " + officerNote,
                    timestamp,
                    actor,
                    "warning"
                );
                updated = withClaim(claim, "Under Review", claim.assignedTeam(), claim.assignedOfficer(), appendTimeline(claim, entry));
                notification = createNotification(
                    "Additional information required",
                    claim.id() + ": " + officerNote + " Upload evidence at Evidence → Upload with your claim selected.",
                    "Action Needed"
                );
            }
            case "escalate" -> {
                entry = new TimelineEntry("tl-" + claimId + "-" + System.currentTimeMillis(), "Escalated to supervisor", timestamp, actor, "warning");
                updated = withClaim(claim, "Investigation", "Supervisor Review Queue", "David Habineza", appendTimeline(claim, entry));
                notification = createNotification("Claim escalated", claim.id() + " was escalated by " + actor + " for supervisory review.", "Unread");
            }
            case "investigate" -> {
                entry = new TimelineEntry("tl-" + claimId + "-" + System.currentTimeMillis(), "Fraud investigation started", timestamp, actor, "danger");
                updated = withClaim(claim, "Investigation", "Fraud Investigation Team", "Fabrice Iradukunda", appendTimeline(claim, entry));
                notification = createNotification("Investigation started", claim.id() + " entered fraud investigation review.", "Unread");
            }
            default -> {
                return null;
            }
        }

        claimRepository.update(updated);
        notificationRepository.insert(notification);
        emailNotificationService.sendPlain(
            "Claim update: " + claim.id() + " (" + request.action() + ")",
            "Actor: " + actor + "\nNew status: " + updated.status()
        );
        return updated;
    }

    public Claim addInternalNote(String claimId, String note, String actor) {
        Claim claim = getClaim(claimId);
        if (claim == null) {
            return null;
        }
        String safeActor = actor == null || actor.isBlank() ? "System User" : actor.trim();
        String trimmed = note == null ? "" : note.trim();
        if (trimmed.isEmpty()) {
            throw new IllegalArgumentException("Note cannot be empty");
        }
        TimelineEntry entry = new TimelineEntry(
            "tl-" + claimId + "-note-" + System.currentTimeMillis(),
            "Internal note: " + trimmed,
            now(),
            safeActor,
            "neutral"
        );
        Claim updated = new Claim(
            claim.id(),
            claim.claimantName(),
            claim.policyNumber(),
            claim.type(),
            claim.status(),
            claim.region(),
            claim.submittedAt(),
            claim.estimatedCompletion(),
            claim.riskScore(),
            BigDecimal.ZERO,
            claim.aiSummary(),
            claim.assignedTeam(),
            claim.assignedOfficer(),
            claim.documents(),
            appendTimeline(claim, entry)
        );
        claimRepository.update(updated);
        notificationRepository.insert(createNotification(
            "Internal note on " + claim.id(),
            safeActor + ": " + trimmed,
            "Read"
        ));
        return updated;
    }

    public NotificationItem publishNotification(String title, String body, String status) {
        String resolvedStatus = status == null || status.isBlank() ? "Unread" : status.trim();
        NotificationItem item = createNotification(title, body, resolvedStatus);
        notificationRepository.insert(item);
        return item;
    }

    public boolean markNotificationRead(String id) {
        notificationRepository.updateStatus(id, "Read");
        return true;
    }

    public List<NotificationItem> listNotifications() {
        return notificationRepository.findAll();
    }

    public Claim attachFiles(String claimId, List<MultipartFile> incoming) {
        Claim claim = getClaim(claimId);
        if (claim == null) {
            return null;
        }
        List<ClaimDocument> documents = new ArrayList<>(claim.documents());
        List<String> uploadNames = incoming.stream()
            .filter(f -> f != null && !f.isEmpty())
            .map(MultipartFile::getOriginalFilename)
            .filter(n -> n != null && !n.isBlank())
            .map(String::trim)
            .toList();
        documents.removeIf(doc ->
            uploadNames.stream().anyMatch(name -> name.equalsIgnoreCase(doc.name()))
                && (doc.storageKey() == null || doc.storageKey().isBlank())
        );
        List<TimelineEntry> timeline = new ArrayList<>(claim.timeline());
        String timestamp = now();
        int storedCount = 0;
        for (MultipartFile file : incoming) {
            if (file == null || file.isEmpty()) {
                continue;
            }
            String storageKey = claimFileStorage.store(claimId, file);
            String kind = detectKind(file);
            String originalName = file.getOriginalFilename() == null || file.getOriginalFilename().isBlank()
                ? "document"
                : file.getOriginalFilename();
            ClaimAssessmentService.Classification classification = claimAssessmentService.classifyUpload(originalName, kind);
            documents.add(new ClaimDocument(
                "doc-" + UUID.randomUUID(),
                originalName,
                kind,
                classification.aiStatus(),
                timestamp,
                1,
                "stored",
                classification.documentType(),
                classification.confidenceScore(),
                classification.reviewNote(),
                storageKey,
                file.getSize(),
                null
            ));
            storedCount++;
        }
        if (storedCount == 0) {
            throw new IllegalArgumentException("No valid files to store");
        }
        timeline.add(new TimelineEntry(
            "tl-" + claimId + "-ev-" + System.currentTimeMillis(),
            storedCount == 1
                ? "Claimant uploaded additional evidence (1 file)"
                : "Claimant uploaded additional evidence (" + storedCount + " files)",
            timestamp,
            claim.claimantName(),
            "success"
        ));
        notificationRepository.insert(createNotification(
            "Evidence received on " + claimId,
            claim.claimantName() + " uploaded " + storedCount + " file(s). Review in the officer workspace.",
            "Unread"
        ));
        Claim updated = claimAssessmentService.withAssessment(new Claim(
            claim.id(),
            claim.claimantName(),
            claim.policyNumber(),
            claim.type(),
            claim.status(),
            claim.region(),
            claim.submittedAt(),
            claim.estimatedCompletion(),
            claim.riskScore(),
            BigDecimal.ZERO,
            claim.aiSummary(),
            claim.assignedTeam(),
            claim.assignedOfficer(),
            documents,
            timeline
        ));
        claimRepository.update(updated);
        emailNotificationService.sendPlain(
            "Evidence uploaded: " + claimId,
            storedCount + " file(s) attached to claim " + claimId + " for " + claim.claimantName()
        );
        return updated;
    }

    public ClaimAttachmentDownload loadAttachment(String claimId, String documentId) throws java.io.IOException {
        Claim claim = getClaim(claimId);
        if (claim == null) {
            return null;
        }
        for (ClaimDocument document : claim.documents()) {
            if (!document.id().equals(documentId)) {
                continue;
            }
            if (document.storageKey() == null || document.storageKey().isBlank()) {
                return null;
            }
            var resource = claimFileStorage.loadAsResource(document.storageKey());
            MediaType contentType = contentTypeForDocument(document);
            return new ClaimAttachmentDownload(resource, document.name(), contentType);
        }
        return null;
    }

    public Claim removeAttachment(String claimId, String documentId) {
        Claim claim = getClaim(claimId);
        if (claim == null) {
            return null;
        }
        ClaimDocument target = null;
        for (ClaimDocument document : claim.documents()) {
            if (document.id().equals(documentId)) {
                target = document;
                break;
            }
        }
        if (target == null) {
            return null;
        }
        if (target.storageKey() != null && !target.storageKey().isBlank()) {
            claimFileStorage.deleteIfPresent(target.storageKey());
        }
        List<ClaimDocument> documents = claim.documents().stream()
            .filter(doc -> !doc.id().equals(documentId))
            .toList();
        List<TimelineEntry> timeline = appendTimeline(
            claim,
            new TimelineEntry(
                "tl-" + claimId + "-rm-" + System.currentTimeMillis(),
                "Evidence removed: " + target.name(),
                now(),
                claim.claimantName(),
                "neutral"
            )
        );
        Claim updated = new Claim(
            claim.id(),
            claim.claimantName(),
            claim.policyNumber(),
            claim.type(),
            claim.status(),
            claim.region(),
            claim.submittedAt(),
            claim.estimatedCompletion(),
            claim.riskScore(),
            BigDecimal.ZERO,
            claim.aiSummary(),
            claim.assignedTeam(),
            claim.assignedOfficer(),
            documents,
            timeline
        );
        claimRepository.update(claimAssessmentService.withAssessment(updated));
        notificationRepository.insert(createNotification(
            "Evidence removed on " + claimId,
            target.name() + " was removed from the claim file.",
            "Read"
        ));
        return getClaim(claimId);
    }

    private static MediaType contentTypeForDocument(ClaimDocument document) {
        if ("pdf".equalsIgnoreCase(document.kind())) {
            return MediaType.APPLICATION_PDF;
        }
        String name = document.name() == null ? "" : document.name().toLowerCase(Locale.ROOT);
        if (name.endsWith(".png")) {
            return MediaType.IMAGE_PNG;
        }
        if (name.endsWith(".gif")) {
            return MediaType.IMAGE_GIF;
        }
        if (name.endsWith(".webp")) {
            return MediaType.parseMediaType("image/webp");
        }
        if ("image".equals(document.kind()) || name.endsWith(".jpg") || name.endsWith(".jpeg")) {
            return MediaType.IMAGE_JPEG;
        }
        return MediaType.APPLICATION_OCTET_STREAM;
    }

    private static String detectKind(MultipartFile file) {
        String contentType = file.getContentType() == null ? "" : file.getContentType().toLowerCase();
        String name = file.getOriginalFilename() == null ? "" : file.getOriginalFilename().toLowerCase();
        if (contentType.contains("pdf") || name.endsWith(".pdf")) {
            return "pdf";
        }
        if (contentType.startsWith("video/") || name.matches(".*\\.(mp4|webm|mov|m4v)$")) {
            return "video";
        }
        if (contentType.startsWith("image/") || name.matches(".*\\.(jpe?g|png|gif|webp|bmp)$")) {
            return "image";
        }
        return "document";
    }

    public List<AnalyticsPoint> buildAnalytics() {
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("MMM").withZone(ZoneOffset.UTC);
        Map<String, List<Claim>> grouped = listClaims().stream().collect(Collectors.groupingBy(claim -> {
            Instant instant = Instant.parse(claim.submittedAt());
            return instant.atZone(ZoneOffset.UTC).getYear() + "-" + instant.atZone(ZoneOffset.UTC).getMonthValue();
        }));

        return grouped.entrySet().stream()
            .map(entry -> {
                List<Claim> claims = entry.getValue();
                Instant instant = Instant.parse(claims.get(0).submittedAt());
                int approved = (int) claims.stream().filter(claim -> "Approved".equals(claim.status())).count();
                int avgDays = Math.max(2, (int) Math.round(
                    claims.stream().mapToInt(claim -> Math.max(2, Math.round(claim.riskScore() / 12f))).average().orElse(2)
                ));

                return new AnalyticsPoint(formatter.format(instant), claims.size(), approved, avgDays);
            })
            .sorted(Comparator.comparing(AnalyticsPoint::label))
            .toList();
    }

    private Claim buildClaim(ClaimSubmissionRequest request, String status) {
        String claimId = "CLM-" + (maxClaimNumber() + 1);
        List<ClaimDocument> documents = buildDocuments(request.files());
        String resolvedStatus = "Draft".equals(status) ? "Draft" : ("Under Review".equals(status) ? "Under Review" : status);
        boolean isDraft = "Draft".equals(status);

        ClaimAssessmentService.AssessmentResult assessment = claimAssessmentService.assess(
            request.claimType(),
            resolvedStatus,
            documents
        );
        int riskScore = assessment.fraudRiskScore();
        Map<String, String> route = routeClaim(request.claimType(), riskScore);
        String aiSummary = isDraft ? "Draft saved and waiting for final submission." : assessment.summary();

        List<TimelineEntry> timeline = new ArrayList<>();
        timeline.add(new TimelineEntry("tl-" + claimId + "-1", isDraft ? "Draft saved" : "Claim submitted", now(), request.claimantName(), "success"));

        if (!isDraft) {
            timeline.add(new TimelineEntry("tl-" + claimId + "-2", "AI document analysis completed (OCR & validation)", now(), "AI System", "neutral"));
            timeline.add(new TimelineEntry(
                "tl-" + claimId + "-3",
                "AI fraud detection — risk score " + riskScore + "/100",
                now(),
                "AI System",
                riskScore >= 60 ? "danger" : "warning"
            ));
            timeline.add(new TimelineEntry(
                "tl-" + claimId + "-4",
                "Routed to " + route.get("officer") + " · Status: Under Review",
                now(),
                "System",
                "success"
            ));
        }

        return new Claim(
            claimId,
            request.claimantName(),
            request.policyNumber(),
            request.claimType(),
            resolvedStatus,
            "Kigali",
            now(),
            "2026-05-06T17:00:00Z",
            riskScore,
            BigDecimal.ZERO,
            aiSummary,
            route.get("team"),
            route.get("officer"),
            documents,
            timeline
        );
    }

    private List<ClaimDocument> buildDocuments(List<UploadFileInput> files) {
        if (files == null) {
            return List.of();
        }

        List<ClaimDocument> documents = new ArrayList<>();
        for (int index = 0; index < files.size(); index++) {
            UploadFileInput file = files.get(index);
            ClaimAssessmentService.Classification classification = claimAssessmentService.classifyUpload(file.name(), file.kind());
            documents.add(new ClaimDocument(
                "doc-" + System.currentTimeMillis() + "-" + index,
                file.name(),
                file.kind(),
                classification.aiStatus(),
                now(),
                1,
                "uploaded",
                classification.documentType(),
                classification.confidenceScore(),
                classification.reviewNote(),
                null,
                null,
                null
            ));
        }
        return documents;
    }

    private int maxClaimNumber() {
        return claimRepository.findAllIds().stream()
            .map(id -> id.replaceAll("^.*?(\\d+)$", "$1"))
            .mapToInt(Integer::parseInt)
            .max()
            .orElse(24090);
    }

    private NotificationItem createNotification(String title, String body, String status) {
        return new NotificationItem("n-" + UUID.randomUUID(), title, body, status, now());
    }

    private Claim withClaim(Claim claim, String status, String team, String officer, List<TimelineEntry> timeline) {
        return new Claim(
            claim.id(),
            claim.claimantName(),
            claim.policyNumber(),
            claim.type(),
            status,
            claim.region(),
            claim.submittedAt(),
            claim.estimatedCompletion(),
            claim.riskScore(),
            BigDecimal.ZERO,
            claim.aiSummary(),
            team,
            officer,
            claim.documents(),
            timeline
        );
    }

    private List<TimelineEntry> appendTimeline(Claim claim, TimelineEntry entry) {
        List<TimelineEntry> timeline = new ArrayList<>(claim.timeline());
        timeline.add(entry);
        return timeline;
    }

    private Map<String, String> routeClaim(String type, int riskScore) {
        if (riskScore >= 60) {
            return Map.of("team", "Fraud Investigation Team", "officer", "Fabrice Iradukunda");
        }
        if ("health".equals(type)) {
            return Map.of("team", "Health Claims Unit", "officer", "Daniel Mugisha");
        }
        if ("property".equals(type)) {
            return Map.of("team", "Property Claims Unit", "officer", "Claire Uwimana");
        }
        return Map.of("team", "Motor Claims Unit", "officer", "Grace Uwase");
    }

    private static boolean isStatusModifiableByClaimant(String status) {
        return "Draft".equals(status) || "Pending".equals(status) || "Under Review".equals(status);
    }

    private static boolean isStatusDeletableByClaimant(String status) {
        return isStatusModifiableByClaimant(status) || "Rejected".equals(status);
    }

    private static List<ClaimDocument> mergeDocuments(List<ClaimDocument> existing, List<ClaimDocument> incoming) {
        List<ClaimDocument> merged = new ArrayList<>(existing);
        for (ClaimDocument doc : incoming) {
            boolean alreadyListed = merged.stream()
                .anyMatch(item -> item.name().equalsIgnoreCase(doc.name()));
            if (!alreadyListed) {
                merged.add(doc);
            }
        }
        return merged;
    }

    private String resolveDraftSummary(ClaimSubmissionRequest request, Claim claim) {
        if (request.description() != null && !request.description().isBlank()) {
            return request.description().trim();
        }
        return claim.aiSummary();
    }

    private String now() {
        return Instant.now().toString();
    }
}
