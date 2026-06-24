package com.cyuzuzo.backend.model;

public record User(
    String id,
    String name,
    String email,
    String password,
    String role,
    String region,
    String phone,
    String department,
    String status,
    Boolean mfaEnabled
) {
    public User(String id, String name, String email, String password, String role, String region) {
        this(id, name, email, password, role, region, null, null, "Active", false);
    }
}
