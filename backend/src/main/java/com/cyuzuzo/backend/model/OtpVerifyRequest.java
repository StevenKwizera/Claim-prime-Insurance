package com.cyuzuzo.backend.model;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

public record OtpVerifyRequest(
    @NotBlank @Email String email,
    @NotBlank @Pattern(regexp = "\\d{6}") String code,
    @NotBlank String purpose
) {
}
