package com.cyuzuzo.backend.model;

import com.fasterxml.jackson.annotation.JsonProperty;
import java.math.BigDecimal;
import java.util.List;

public record Claim(
    String id,
    String claimantName,
    String policyNumber,
    String type,
    String status,
    String region,
    String submittedAt,
    String estimatedCompletion,
    int riskScore,
    @JsonProperty(access = JsonProperty.Access.WRITE_ONLY) BigDecimal amount,
    String aiSummary,
    String assignedTeam,
    String assignedOfficer,
    List<ClaimDocument> documents,
    List<TimelineEntry> timeline
) {
}
