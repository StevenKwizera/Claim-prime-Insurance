package com.cyuzuzo.backend.model;

public record NotificationItem(
    String id,
    String title,
    String body,
    String status,
    String at
) {
}
