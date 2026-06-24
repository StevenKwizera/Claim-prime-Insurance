package com.cyuzuzo.backend.model;

public record ClaimActionRequest(
    String action,
    String actor,
    String message
) {
}
