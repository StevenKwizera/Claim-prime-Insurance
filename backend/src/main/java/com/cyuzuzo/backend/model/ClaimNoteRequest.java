package com.cyuzuzo.backend.model;

import jakarta.validation.constraints.NotBlank;

public record ClaimNoteRequest(
    @NotBlank String note,
    String actor
) {
}
