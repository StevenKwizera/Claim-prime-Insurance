package com.cyuzuzo.backend.model;

public record PublicUser(
    String id,
    String name,
    String email,
    String role,
    String region,
    String phone,
    String department,
    String status,
    Boolean mfaEnabled
) {
    public static PublicUser from(User user) {
        return new PublicUser(
            user.id(),
            user.name(),
            user.email(),
            user.role(),
            user.region(),
            user.phone(),
            user.department(),
            user.status(),
            user.mfaEnabled()
        );
    }
}
