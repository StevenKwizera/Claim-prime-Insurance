package com.cyuzuzo.backend.model;

import java.util.List;

public record ClaimSubmissionRequest(
    String claimType,
    String claimantName,
    String policyNumber,
    String incidentDate,
    String description,
    List<UploadFileInput> files
) {
}
