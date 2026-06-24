package com.cyuzuzo.backend.model;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

public record PasswordResetConfirmRequest(
    @NotBlank(message = "Email is required")
    @Email(message = "Email must be valid")
    String email,
    @NotBlank(message = "Reset link token is required")
    String code,
    @NotBlank(message = "New password is required")
    @Pattern(
        regexp = "^(?=.*[A-Z])(?=.*\\d)(?=.*[^A-Za-z0-9]).{8,}$",
        message = "Password must be at least 8 characters and include an uppercase letter, number, and symbol"
    )
    String password
) {
}
