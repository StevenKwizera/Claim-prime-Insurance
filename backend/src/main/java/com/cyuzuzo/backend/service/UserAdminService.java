package com.cyuzuzo.backend.service;

import com.cyuzuzo.backend.model.NotificationItem;
import com.cyuzuzo.backend.model.User;
import com.cyuzuzo.backend.repository.NotificationRepository;
import com.cyuzuzo.backend.repository.PasswordResetRepository;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.security.SecureRandom;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Base64;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.UUID;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
public class UserAdminService {

    private final OtpService otpService;
    private final PasswordResetRepository passwordResetRepository;
    private final NotificationRepository notificationRepository;
    private final EmailNotificationService emailNotificationService;
    private final PasswordEncoder passwordEncoder;
    private final String frontendResetUrl;
    private final boolean exposeResetCodeToAdmin;
    private final SecureRandom secureRandom = new SecureRandom();

    public UserAdminService(
        OtpService otpService,
        PasswordResetRepository passwordResetRepository,
        NotificationRepository notificationRepository,
        EmailNotificationService emailNotificationService,
        PasswordEncoder passwordEncoder,
        @Value("${app.frontend.reset-url:http://localhost:5173/forgot-password}") String frontendResetUrl,
        @Value("${app.auth.expose-otp-in-response:true}") boolean exposeResetCodeToAdmin
    ) {
        this.otpService = otpService;
        this.passwordResetRepository = passwordResetRepository;
        this.notificationRepository = notificationRepository;
        this.emailNotificationService = emailNotificationService;
        this.passwordEncoder = passwordEncoder;
        this.frontendResetUrl = frontendResetUrl;
        this.exposeResetCodeToAdmin = exposeResetCodeToAdmin;
    }

    public Map<String, Object> sendPasswordResetEmail(User user) {
        String email = user.email().trim().toLowerCase();
        String resetToken = generateResetToken();
        Instant expiresAt = Instant.now().plus(15, ChronoUnit.MINUTES);
        passwordResetRepository.invalidateActiveForUser(user.id());
        passwordResetRepository.create("pr-" + UUID.randomUUID(), user.id(), passwordEncoder.encode(resetToken), expiresAt);

        String resetLink = frontendResetUrl
            + "?reset=true&email=" + URLEncoder.encode(email, StandardCharsets.UTF_8)
            + "&token=" + URLEncoder.encode(resetToken, StandardCharsets.UTF_8);
        OtpDelivery delivery = otpService.sendPasswordReset(user, resetLink);

        notificationRepository.insert(new NotificationItem(
            "n-" + UUID.randomUUID(),
            "Password reset requested by admin",
            "Admin sent password reset instructions to " + email + ".",
            "Unread",
            Instant.now().toString()
        ));

        Map<String, Object> result = new LinkedHashMap<>();
        if (delivery.emailSent()) {
            result.put("message", "Password reset email sent to " + email + ". Tell the user to check inbox and spam.");
            result.put("emailSent", true);
            return result;
        }

        String error = delivery.emailResult().error() == null || delivery.emailResult().error().isBlank()
            ? "SMTP not configured or email failed."
            : delivery.emailResult().error();
        result.put("message", "Reset prepared but email failed: " + error);
        result.put("emailSent", false);
        result.put("resetLink", resetLink);
        if (exposeResetCodeToAdmin) {
            result.put("devCode", delivery.code());
        }
        return result;
    }

    public Map<String, Object> buildTemporaryPasswordResult(User user, String plainPassword) {
        String body = "Hello " + user.name() + ",\n\n"
            + "Your Prime Insurance portal password was reset by an administrator.\n\n"
            + "Temporary password: " + plainPassword + "\n\n"
            + "Sign in and change your password immediately.\n\n"
            + "Prime Insurance LTD";

        boolean emailSent = emailNotificationService.sendPlainTo(user.email(), "Prime Claims — password reset by admin", body);

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("temporaryPassword", plainPassword);
        result.put("emailSent", emailSent);
        result.put(
            "message",
            emailSent
                ? "Temporary password set and emailed to " + user.email() + "."
                : "Temporary password set. Share with the user manually: " + plainPassword
        );
        return result;
    }

    public String generateTemporaryPassword() {
        return "Prime@" + UUID.randomUUID().toString().substring(0, 8);
    }

    private String generateResetToken() {
        byte[] bytes = new byte[32];
        secureRandom.nextBytes(bytes);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
    }
}
