package com.cyuzuzo.backend.model;

import java.util.List;

public record SeedData(
    List<User> users,
    List<Claim> claims,
    List<NotificationItem> notifications
) {
}
