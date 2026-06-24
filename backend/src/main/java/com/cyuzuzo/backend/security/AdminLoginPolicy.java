package com.cyuzuzo.backend.security;

import com.cyuzuzo.backend.model.User;
import java.util.Locale;
import java.util.Set;

/** Named admins require password + email OTP; other admins (e.g. admin@prime.rw) use password only. */
public final class AdminLoginPolicy {

    private static final Set<String> OTP_AFTER_PASSWORD_ADMIN_EMAILS = Set.of(
        "kwizerasteven2000@gmail.com",
        "cyuzuzophoebe@gmail.com"
    );

    private AdminLoginPolicy() {
    }

    public static boolean requiresOtpAfterPassword(String email) {
        if (email == null || email.isBlank()) {
            return false;
        }
        return OTP_AFTER_PASSWORD_ADMIN_EMAILS.contains(email.trim().toLowerCase(Locale.ROOT));
    }

    public static boolean requiresLoginOtp(User user, boolean staffLoginOtpEnabled) {
        if (!staffLoginOtpEnabled || user == null || user.email() == null) {
            return false;
        }
        if (!"admin".equals(RolePolicy.normalize(user.role()))) {
            return false;
        }
        return requiresOtpAfterPassword(user.email());
    }
}
