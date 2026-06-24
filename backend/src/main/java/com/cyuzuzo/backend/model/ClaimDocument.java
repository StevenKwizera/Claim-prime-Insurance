package com.cyuzuzo.backend.model;

public record ClaimDocument(
    String id,
    String name,
    String kind,
    String aiStatus,
    String uploadedAt,
    int version,
    String tag,
    String documentType,
    Integer confidenceScore,
    String reviewNote,
    String storageKey,
    Long sizeBytes,
    String previewUrl
) {
}
