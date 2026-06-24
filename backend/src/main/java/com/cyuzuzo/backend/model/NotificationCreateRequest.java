package com.cyuzuzo.backend.model;

import jakarta.validation.constraints.NotBlank;

public record NotificationCreateRequest(
    @NotBlank String title,
    @NotBlank String body,
    String status
) {
}
