package com.cyuzuzo.backend.controller;

import com.cyuzuzo.backend.service.EmailNotificationService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import java.util.Map;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping({"/api/auth/mail", "/auth/mail"})
public class MailTestController {

    private final EmailNotificationService emailNotificationService;
    private final boolean mailEnabled;
    private final String mailFrom;
    private final String mailUsername;
    private final boolean passwordConfigured;

    public MailTestController(
        EmailNotificationService emailNotificationService,
        @Value("${mail.enabled:false}") boolean mailEnabled,
        @Value("${mail.from:}") String mailFrom,
        @Value("${spring.mail.username:}") String mailUsername,
        @Value("${spring.mail.password:}") String mailPassword
    ) {
        this.emailNotificationService = emailNotificationService;
        this.mailEnabled = mailEnabled;
        this.mailFrom = mailFrom == null ? "" : mailFrom.trim();
        this.mailUsername = mailUsername == null ? "" : mailUsername.trim();
        this.passwordConfigured = mailPassword != null && !mailPassword.replace(" ", "").trim().isEmpty();
    }

    @GetMapping("/status")
    public Map<String, Object> status() {
        return Map.of(
            "mailEnabled", mailEnabled,
            "mailFrom", mailFrom,
            "smtpUsername", mailUsername,
            "passwordConfigured", passwordConfigured,
            "hint", passwordConfigured
                ? "POST /api/auth/mail/test with {\"to\":\"your@email.com\"} to send a test message."
                : "Set MAIL_PASSWORD in backend/local.env to a Gmail App Password (16 chars, no spaces), then restart the backend."
        );
    }

    @PostMapping("/test")
    public ResponseEntity<?> sendTest(@Valid @RequestBody MailTestRequest request) {
        var result = emailNotificationService.sendPlainToWithResult(
            request.to().trim(),
            "Prime Claims Portal — email test",
            "This is a test email from Prime Claims Portal.\n\n"
                + "If you received this, SMTP is configured correctly.\n\n"
                + "Prime Insurance LTD"
        );

        if (!result.sent()) {
            return ResponseEntity.status(503).body(Map.of(
                "sent", false,
                "error", result.error(),
                "fixSteps",
                new String[] {
                    "Open https://myaccount.google.com/apppasswords while signed in as " + mailUsername,
                    "Create a new App Password for Mail",
                    "Put the 16-character password in backend/local.env as MAIL_PASSWORD (no spaces)",
                    "Restart the backend: npm run backend"
                }
            ));
        }

        return ResponseEntity.ok(Map.of(
            "sent", true,
            "to", result.recipient(),
            "from", result.from(),
            "message", "Test email sent. Check inbox and spam folder."
        ));
    }

    public record MailTestRequest(@NotBlank @Email String to) {
    }
}
