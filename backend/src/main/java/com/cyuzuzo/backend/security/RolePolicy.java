package com.cyuzuzo.backend.security;

import java.util.Set;

/** Platform roles — claimant plus five staff roles. */
public final class RolePolicy {
    public static final Set<String> ALLOWED_ROLES = Set.of(
        "claimant",
        "agent",
        "officer",
        "supervisor",
        "fraud-investigator",
        "admin"
    );

    public static final Set<String> OTP_PURPOSES = Set.of(
        "registration",
        "login",
        "password-reset"
    );

    private RolePolicy() {
    }

    public static boolean isAllowed(String role) {
        return role != null && ALLOWED_ROLES.contains(role.trim().toLowerCase());
    }

    public static boolean isAllowedOtpPurpose(String purpose) {
        return purpose != null && OTP_PURPOSES.contains(purpose.trim().toLowerCase());
    }

    public static String normalize(String role) {
        if (role == null || role.isBlank()) {
            return "";
        }
        String value = role.trim().toLowerCase();
        if ("super-admin".equals(value) || "superadmin".equals(value)) {
            return "admin";
        }
        if ("compliance-officer".equals(value) || "compliance".equals(value)) {
            return "";
        }
        return value;
    }
}
