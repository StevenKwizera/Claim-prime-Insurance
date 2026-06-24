package com.cyuzuzo.backend.model;

public record AnalyticsPoint(
    String label,
    int claims,
    int approved,
    int avgDays
) {
}
