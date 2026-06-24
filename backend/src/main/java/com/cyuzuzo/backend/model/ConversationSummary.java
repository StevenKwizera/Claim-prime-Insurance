package com.cyuzuzo.backend.model;

public record ConversationSummary(
    String userId,
    String userName,
    String userRole,
    String lastMessage,
    String lastAt,
    int unreadCount
) {
}
