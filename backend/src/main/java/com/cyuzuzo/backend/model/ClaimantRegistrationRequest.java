package com.cyuzuzo.backend.model;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

public record ClaimantRegistrationRequest(
    @NotBlank(message = "Full name is required")
    String name,
    @NotBlank(message = "Email is required")
    @Email(message = "Email must be valid")
    String email,
    @NotBlank(message = "Phone number is required")
    String phone,
    @NotBlank(message = "National ID or policy number is required")
    String nationalIdOrPolicy,
    @NotBlank(message = "Password is required")
    String password,
    String profilePhoto
) {
}
