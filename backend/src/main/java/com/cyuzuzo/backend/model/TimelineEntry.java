package com.cyuzuzo.backend.model;

public record TimelineEntry(
    String id,
    String label,
    String at,
    String actor,
    String tone
) {
}
