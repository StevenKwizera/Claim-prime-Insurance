package com.cyuzuzo.backend.service;

import com.cyuzuzo.backend.model.Claim;
import com.cyuzuzo.backend.model.ClaimDocument;
import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import org.springframework.stereotype.Service;

@Service
public class ClaimAssessmentService {

    public record AssessmentResult(
        int fraudRiskScore,
        String riskBand,
        int verificationPercent,
        int confidencePercent,
        int completenessPercent,
        String verificationStatus,
        String riskLabel,
        String summary
    ) {
    }

    private static final Map<String, Integer> TYPE_BASE = Map.of(
        "auto", 5,
        "health", 2,
        "property", 8
    );

    public AssessmentResult assess(String claimType, String status, List<ClaimDocument> documents) {
        List<String> required = requiredTypes(claimType);
        List<AssessmentFactor> factors = new ArrayList<>();
        int score = TYPE_BASE.getOrDefault(claimType, 5);

        Set<String> matched = new java.util.HashSet<>();
        for (ClaimDocument doc : documents) {
            String type = documentTypeFor(doc);
            if (required.contains(type) && !"Missing".equals(doc.aiStatus())) {
                matched.add(type);
            }
        }

        List<String> missing = required.stream().filter(item -> !matched.contains(item)).toList();
        int completeness = required.isEmpty() ? 100 : Math.round((matched.size() * 100f) / required.size());

        if (!missing.isEmpty()) {
            int impact = Math.min(35, missing.size() * 10);
            score += impact;
            factors.add(new AssessmentFactor("Missing required documents", impact, "Not on file: " + String.join(", ", missing)));
        }

        List<ClaimDocument> flagged = documents.stream().filter(doc -> "Flagged".equals(doc.aiStatus())).toList();
        if (!flagged.isEmpty()) {
            int impact = Math.min(35, flagged.size() * 14);
            score += impact;
            factors.add(new AssessmentFactor("Flagged evidence", impact, flagged.size() + " file(s) failed consistency checks."));
        }

        List<Integer> confidences = documents.stream().map(this::confidenceFor).toList();
        int confidencePercent = confidences.isEmpty()
            ? 0
            : Math.round((float) confidences.stream().mapToInt(Integer::intValue).average().orElse(0));

        if (!confidences.isEmpty() && confidencePercent < 80) {
            int impact = Math.round((80 - confidencePercent) * 0.45f);
            if (impact > 0) {
                score += impact;
                factors.add(new AssessmentFactor("Low AI document confidence", impact, "Average confidence is " + confidencePercent + "%."));
            }
        }

        long flaggedReceipts = flagged.stream()
            .filter(doc -> doc.name() != null && doc.name().toLowerCase(Locale.ROOT).matches(".*(receipt|invoice|estimate|pharmacy).*"))
            .count();
        if (flaggedReceipts >= 2) {
            score += 8;
            factors.add(new AssessmentFactor("Duplicate invoice signals", 8, "Multiple cost documents flagged."));
        }

        if ("Investigation".equals(status)) {
            score = Math.max(score, 72);
        }

        int fraudRiskScore = Math.max(0, Math.min(100, score));
        String band = riskBand(fraudRiskScore);
        int verificationPercent = Math.max(0, Math.min(100, Math.round(completeness * 0.55f + confidencePercent * 0.45f)));

        String verificationStatus;
        if (!missing.isEmpty()) {
            verificationStatus = "Incomplete — required documents missing";
        } else if (fraudRiskScore >= 75) {
            verificationStatus = "Failed auto-verification — fraud review required";
        } else if (!flagged.isEmpty() || fraudRiskScore >= 40) {
            verificationStatus = "Needs officer review";
        } else {
            verificationStatus = "AI verified — ready for officer sign-off";
        }

        StringBuilder summary = new StringBuilder();
        summary.append("Document compliance: ").append(completeness).append("% (")
            .append(matched.size()).append("/").append(required.size()).append(" required types). ");
        summary.append("AI confidence: ").append(confidencePercent).append("% across ")
            .append(documents.size()).append(" file(s). ");
        if (!flagged.isEmpty()) {
            summary.append(flagged.size()).append(" document(s) flagged. ");
        }
        summary.append("Fraud risk: ").append(band).append(" (").append(fraudRiskScore).append("/100). ")
            .append(riskLabel(band)).append(".");

        return new AssessmentResult(
            fraudRiskScore,
            band,
            verificationPercent,
            confidencePercent,
            completeness,
            verificationStatus,
            riskLabel(band),
            summary.toString()
        );
    }

    public Claim withAssessment(Claim claim) {
        AssessmentResult result = assess(claim.type(), claim.status(), claim.documents());
        return new Claim(
            claim.id(),
            claim.claimantName(),
            claim.policyNumber(),
            claim.type(),
            claim.status(),
            claim.region(),
            claim.submittedAt(),
            claim.estimatedCompletion(),
            result.fraudRiskScore(),
            BigDecimal.ZERO,
            result.summary(),
            claim.assignedTeam(),
            claim.assignedOfficer(),
            claim.documents(),
            claim.timeline()
        );
    }

    private record AssessmentFactor(String label, int impact, String detail) {
    }

    private List<String> requiredTypes(String claimType) {
        return switch (claimType) {
            case "health" -> List.of("ID Document", "Medical Report", "Invoice");
            case "property" -> List.of("ID Document", "Property Ownership", "Photos", "Damage Report", "Invoice");
            default -> List.of("ID Document", "Police Report", "Invoice", "Photos", "Damage Report");
        };
    }

    private String documentTypeFor(ClaimDocument doc) {
        if (doc.documentType() != null && !doc.documentType().isBlank()) {
            return doc.documentType();
        }
        return classifyUpload(doc.name(), doc.kind()).documentType();
    }

    private int confidenceFor(ClaimDocument doc) {
        if (doc.confidenceScore() != null) {
            return doc.confidenceScore();
        }
        return classifyUpload(doc.name(), doc.kind()).confidenceScore();
    }

    private String riskBand(int score) {
        if (score >= 75) {
            return "Critical";
        }
        if (score >= 60) {
            return "High";
        }
        if (score >= 40) {
            return "Medium";
        }
        return "Low";
    }

    private String riskLabel(String band) {
        return switch (band) {
            case "Critical" -> "Critical — immediate fraud investigation";
            case "High" -> "High — priority officer and fraud review";
            case "Medium" -> "Medium — review required by officer";
            default -> "Low — standard processing";
        };
    }

    /** Align with frontend documentAI.classifyUpload heuristics. */
    public Classification classifyUpload(String name, String kind) {
        String lower = name == null ? "" : name.toLowerCase(Locale.ROOT);
        if (lower.contains("blur") || lower.contains("fake")) {
            return new Classification("Unclassified", "Flagged", 63, "Potential quality or authenticity issue.");
        }
        if (lower.contains("id") || lower.contains("national") || lower.contains("passport")) {
            return new Classification("ID Document", "Valid", 94, "Identity document pattern matched.");
        }
        if (lower.contains("police")) {
            return new Classification("Police Report", "Valid", 96, "Police report format recognized.");
        }
        if (lower.contains("medical") || lower.contains("hospital") || lower.contains("discharge")) {
            return new Classification("Medical Report", "Valid", 94, "Medical evidence appears complete.");
        }
        if (lower.contains("deed") || lower.contains("ownership")) {
            if (lower.contains("flagged") || lower.contains("suspicious")) {
                return new Classification("Property Ownership", "Flagged", 58, "Ownership document requires manual verification.");
            }
            return new Classification("Property Ownership", "Valid", 91, "Ownership document recognized.");
        }
        if (lower.contains("estimate") || lower.contains("quotation") || lower.contains("garage")) {
            return new Classification("Damage Report", "Flagged", 72, "Repair estimate — cost inconsistency detected.");
        }
        if (lower.contains("receipt") || lower.contains("invoice") || lower.contains("bill")) {
            if (lower.contains("pharmacy") && lower.contains("2")) {
                return new Classification("Invoice", "Flagged", 68, "Duplicate pharmacy receipt pattern.");
            }
            return new Classification("Invoice", "Flagged", 78, "Invoice validated; details need officer confirmation.");
        }
        if (lower.contains("photo") || lower.contains("image") || lower.contains("damage")
            || lower.contains("accident") || lower.contains("dent") || lower.contains("bumper")
            || "image".equals(kind)) {
            return new Classification("Photos", "Valid", 88, "Damage photo acceptable for review.");
        }
        if (lower.contains("report") || lower.contains("assessment") || lower.contains("engineer")) {
            return new Classification("Damage Report", "Valid", 90, "Damage report recognized.");
        }
        if (lower.contains("witness") || lower.contains("statement")) {
            return new Classification("Witness Statement", "Valid", 86, "Witness statement queued for review.");
        }
        return new Classification("Unclassified", "Flagged", 44, "Filename did not match expected claim document types.");
    }

    public record Classification(String documentType, String aiStatus, int confidenceScore, String reviewNote) {
    }
}
