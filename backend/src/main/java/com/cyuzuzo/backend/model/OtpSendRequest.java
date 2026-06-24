package com.cyuzuzo.backend.model;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

public record OtpSendRequest(
    @NotBlank @Email String email,
    @NotBlank String purpose
) {
}
