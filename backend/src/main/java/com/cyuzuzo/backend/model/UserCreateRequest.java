package com.cyuzuzo.backend.model;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

public record UserCreateRequest(
    @NotBlank(message = "Full name is required")
    String name,
    @NotBlank(message = "Email is required")
    @Email(message = "Email must be valid")
    String email,
    String phone,
    @NotBlank(message = "Role is required")
    String role,
    String department,
    @NotBlank(message = "Region is required")
    String region,
    @NotBlank(message = "Temporary password is required")
    String temporaryPassword
) {
}
