package com.cyuzuzo.backend.model;

import com.fasterxml.jackson.annotation.JsonInclude;

@JsonInclude(JsonInclude.Include.NON_NULL)
public record LoginChallengeResponse(
    boolean requiresOtp,
    String email,
    String message,
    Boolean emailSent,
    String devCode
) {
    public LoginChallengeResponse(boolean requiresOtp, String email, String message) {
        this(requiresOtp, email, message, true, null);
    }
}
