package com.cyuzuzo.backend.model;

public record LoginResponse(
    String token,
    PublicUser user
) {
}
