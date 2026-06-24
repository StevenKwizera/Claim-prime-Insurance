package com.cyuzuzo.backend.model;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record SendMessageRequest(
    @NotNull(message = "Recipient is required.")
    String toUserId,
    @NotBlank(message = "Message body is required.")
    @Size(max = 4000, message = "Message must be at most 4000 characters.")
    String body,
    String relatedClaimId
) {
}
