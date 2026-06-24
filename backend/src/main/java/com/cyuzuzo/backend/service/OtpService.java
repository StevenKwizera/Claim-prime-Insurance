package com.cyuzuzo.backend.service;

import com.cyuzuzo.backend.model.User;
import com.cyuzuzo.backend.repository.OtpVerificationRepository;
import com.cyuzuzo.backend.repository.OtpVerificationRepository.OtpRecord;
import java.security.SecureRandom;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.UUID;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
public class OtpService {
    private static final Logger log = LoggerFactory.getLogger(OtpService.class);
    private static final int MAX_ATTEMPTS = 5;
    private static final int OTP_MINUTES = 10;

    private final OtpVerificationRepository otpRepository;
    private final EmailNotificationService emailNotificationService;
    private final PasswordEncoder passwordEncoder;
    private final SecureRandom secureRandom = new SecureRandom();

    public OtpService(
        OtpVerificationRepository otpRepository,
        EmailNotificationService emailNotificationService,
        PasswordEncoder passwordEncoder
    ) {
        this.otpRepository = otpRepository;
        this.emailNotificationService = emailNotificationService;
        this.passwordEncoder = passwordEncoder;
    }

    public OtpDelivery sendOtp(User user, String purpose) {
        String normalizedPurpose = purpose == null ? "" : purpose.trim().toLowerCase();
        String code = generateSixDigitCode();
        otpRepository.invalidateActive(user.email(), normalizedPurpose);
        otpRepository.create(
            "otp-" + UUID.randomUUID(),
            user.id(),
            user.email(),
            user.phone(),
            passwordEncoder.encode(code),
            normalizedPurpose,
            "email",
            Instant.now().plus(OTP_MINUTES, ChronoUnit.MINUTES)
        );

        String subject = switch (normalizedPurpose) {
            case "login" -> "Prime Claims Portal — sign-in verification code";
            case "password-reset" -> "Prime Claims Portal — password reset code";
            default -> "Prime Claims Portal — verify your email";
        };
        String body =
            "Hello " + user.name() + ",\n\n"
                + "Your one-time verification code is:\n\n"
                + "    " + code + "\n\n"
                + "This code expires in " + OTP_MINUTES + " minutes. Do not share it with anyone.\n\n"
                + "If you did not request this, ignore this email.\n\n"
                + "Prime Insurance LTD";

        var emailResult = emailNotificationService.sendPlainToWithResult(user.email(), subject, body);
        if (!emailResult.sent()) {
            log.warn("OTP email not sent to {} (purpose={}): {}", user.email(), normalizedPurpose, emailResult.error());
        }
        return new OtpDelivery(code, emailResult);
    }

    public OtpDelivery sendPasswordReset(User user, String resetLink) {
        String code = generateSixDigitCode();
        otpRepository.invalidateActive(user.email(), "password-reset");
        otpRepository.create(
            "otp-" + UUID.randomUUID(),
            user.id(),
            user.email(),
            user.phone(),
            passwordEncoder.encode(code),
            "password-reset",
            "email",
            Instant.now().plus(OTP_MINUTES, ChronoUnit.MINUTES)
        );

        String body =
            "Hello " + user.name() + ",\n\n"
                + "You requested a password reset for your Prime Claims Portal account.\n\n"
                + "Option 1 — open this secure link (expires in 15 minutes):\n"
                + resetLink + "\n\n"
                + "Option 2 — on the forgot-password page, enter this 6-digit code:\n\n"
                + "    " + code + "\n\n"
                + "This code expires in " + OTP_MINUTES + " minutes.\n\n"
                + "If you did not request this, ignore this email.\n\n"
                + "Prime Insurance LTD";

        var emailResult = emailNotificationService.sendPlainToWithResult(
            user.email(),
            "Prime Claims Portal — reset your password",
            body
        );
        return new OtpDelivery(code, emailResult);
    }

    public boolean verify(String email, String purpose, String rawCode) {
        String normalizedPurpose = purpose == null ? "" : purpose.trim().toLowerCase();
        String normalizedCode = rawCode == null ? "" : rawCode.trim();
        var recordOpt = otpRepository.findLatestActive(email, normalizedPurpose);
        if (recordOpt.isEmpty()) {
            return false;
        }
        OtpRecord record = recordOpt.get();
        if (record.attempts() >= MAX_ATTEMPTS) {
            return false;
        }
        if (!passwordEncoder.matches(normalizedCode, record.otpHash())) {
            otpRepository.incrementAttempts(record.id());
            return false;
        }
        otpRepository.markVerified(record.id());
        return true;
    }

    /** Staff login OTP is required for administrators only (not officers, agents, etc.). */
    public static boolean staffRequiresLoginOtp(User user) {
        if (user == null || user.role() == null) {
            return false;
        }
        return "admin".equalsIgnoreCase(com.cyuzuzo.backend.security.RolePolicy.normalize(user.role()));
    }

    private String generateSixDigitCode() {
        int value = 100000 + secureRandom.nextInt(900000);
        return String.valueOf(value);
    }
}
