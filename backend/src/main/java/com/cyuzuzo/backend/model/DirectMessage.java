package com.cyuzuzo.backend.model;

public record DirectMessage(
    String id,
    String fromUserId,
    String fromUserName,
    String toUserId,
    String toUserName,
    String body,
    String relatedClaimId,
    String readAt,
    String createdAt,
    boolean mine
) {
}
