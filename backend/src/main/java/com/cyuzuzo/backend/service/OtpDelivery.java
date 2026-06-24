package com.cyuzuzo.backend.service;

public record OtpDelivery(
    String code,
    EmailNotificationService.EmailDeliveryResult emailResult
) {
    public boolean emailSent() {
        return emailResult != null && emailResult.sent();
    }
}
