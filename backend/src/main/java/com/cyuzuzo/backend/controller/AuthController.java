package com.cyuzuzo.backend.controller;

import com.cyuzuzo.backend.model.ClaimantRegistrationRequest;
import com.cyuzuzo.backend.model.DemoAccountResponse;
import com.cyuzuzo.backend.model.LoginChallengeResponse;
import com.cyuzuzo.backend.model.LoginOtpRequest;
import com.cyuzuzo.backend.model.LoginRequest;
import com.cyuzuzo.backend.model.LoginResponse;
import com.cyuzuzo.backend.model.OtpSendRequest;
import com.cyuzuzo.backend.model.OtpVerifyRequest;
import com.cyuzuzo.backend.model.NotificationItem;
import com.cyuzuzo.backend.model.PasswordResetConfirmRequest;
import com.cyuzuzo.backend.model.PasswordResetRequest;
import com.cyuzuzo.backend.model.PublicUser;
import com.cyuzuzo.backend.model.User;
import com.cyuzuzo.backend.repository.NotificationRepository;
import com.cyuzuzo.backend.repository.PasswordResetRepository;
import com.cyuzuzo.backend.repository.UserRepository;
import com.cyuzuzo.backend.security.AdminLoginPolicy;
import com.cyuzuzo.backend.security.RolePolicy;
import com.cyuzuzo.backend.service.AuthService;
import com.cyuzuzo.backend.service.EmailNotificationService;
import com.cyuzuzo.backend.service.OtpDelivery;
import com.cyuzuzo.backend.service.OtpService;
import jakarta.validation.Valid;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.security.SecureRandom;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Base64;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping({"/api/auth", "/auth"})
public class AuthController {
    private final AuthService authService;
    private final OtpService otpService;
    private final UserRepository userRepository;
    private final PasswordResetRepository passwordResetRepository;
    private final NotificationRepository notificationRepository;
    private final EmailNotificationService emailNotificationService;
    private final PasswordEncoder passwordEncoder;
    private final String frontendResetUrl;
    private final boolean staffLoginOtpEnabled;
    private final boolean allowLoginWithoutOtpWhenMailFails;
    private final boolean exposeOtpInResponse;
    private final SecureRandom secureRandom = new SecureRandom();

    public AuthController(
        AuthService authService,
        OtpService otpService,
        UserRepository userRepository,
        PasswordResetRepository passwordResetRepository,
        NotificationRepository notificationRepository,
        EmailNotificationService emailNotificationService,
        PasswordEncoder passwordEncoder,
        @Value("${app.frontend.reset-url:http://localhost:5173/forgot-password}") String frontendResetUrl,
        @Value("${app.auth.staff-login-otp-enabled:true}") boolean staffLoginOtpEnabled,
        @Value("${app.auth.allow-login-without-otp-when-mail-fails:false}") boolean allowLoginWithoutOtpWhenMailFails,
        @Value("${app.auth.expose-otp-in-response:true}") boolean exposeOtpInResponse
    ) {
        this.authService = authService;
        this.otpService = otpService;
        this.userRepository = userRepository;
        this.passwordResetRepository = passwordResetRepository;
        this.notificationRepository = notificationRepository;
        this.emailNotificationService = emailNotificationService;
        this.passwordEncoder = passwordEncoder;
        this.frontendResetUrl = frontendResetUrl;
        this.staffLoginOtpEnabled = staffLoginOtpEnabled;
        this.allowLoginWithoutOtpWhenMailFails = allowLoginWithoutOtpWhenMailFails;
        this.exposeOtpInResponse = exposeOtpInResponse;
    }

    @GetMapping("/demo-accounts")
    public List<DemoAccountResponse> demoAccounts() {
        return userRepository.findAll().stream()
            .filter(user -> RolePolicy.isAllowed(user.role()))
            .map(user -> new DemoAccountResponse(user.email(), user.name(), user.role()))
            .toList();
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@Valid @RequestBody LoginRequest request) {
        var userOpt = authService.authenticate(request);
        if (userOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(new ApiErrorResponse("Login failed. Use a registered email address and password."));
        }
        User user = userOpt.get();
        if ("Pending".equalsIgnoreCase(user.status())) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                .body(new ApiErrorResponse("Verify your email first. Check your inbox for the 6-digit code or request a new one."));
        }
        if ("Suspended".equalsIgnoreCase(user.status()) || "Inactive".equalsIgnoreCase(user.status()) || "Locked".equalsIgnoreCase(user.status())) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                .body(new ApiErrorResponse("This account is suspended or inactive. Contact your administrator."));
        }
        if (loginOtpAppliesTo(user)) {
            return buildStaffLoginOtpResponse(user);
        }
        return ResponseEntity.ok(authService.issueToken(user));
    }

    @PostMapping("/login/verify-otp")
    public ResponseEntity<?> verifyLoginOtp(@Valid @RequestBody LoginOtpRequest request) {
        var userOpt = authService.authenticate(new LoginRequest(request.email(), request.password()));
        if (userOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(new ApiErrorResponse("Invalid email or password."));
        }
        User user = userOpt.get();
        if (!loginOtpAppliesTo(user)) {
            return ResponseEntity.ok(authService.issueToken(user));
        }
        if (!otpService.verify(user.email(), "login", request.code())) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(new ApiErrorResponse("Invalid or expired verification code."));
        }
        return ResponseEntity.ok(authService.issueToken(user));
    }

    @PostMapping("/otp/send")
    public ResponseEntity<?> sendOtp(@Valid @RequestBody OtpSendRequest request) {
        String email = request.email().trim().toLowerCase();
        var userOpt = userRepository.findByEmail(email);
        if (userOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(new ApiErrorResponse("No account found for that email."));
        }
        String purpose = request.purpose().trim().toLowerCase();
        if (!RolePolicy.isAllowedOtpPurpose(purpose)) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(new ApiErrorResponse("Invalid verification purpose."));
        }
        if (!RolePolicy.isAllowed(userOpt.get().role())) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(new ApiErrorResponse("This account role is not permitted on the platform."));
        }
        if ("registration".equals(purpose)) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(new ApiErrorResponse("Claimant registration does not use email verification. Sign up on the register page, then sign in."));
        }
        User user = userOpt.get();
        if ("login".equals(purpose) && !loginOtpAppliesTo(user)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                .body(new ApiErrorResponse("Sign-in verification codes apply only after password login for designated administrator accounts."));
        }
        OtpDelivery delivery = otpService.sendOtp(user, purpose);
        if (!delivery.emailSent()) {
            String error = delivery.emailResult().error() == null || delivery.emailResult().error().isBlank()
                ? "Email could not be sent. Set MAIL_ENABLED=true and MAIL_PASSWORD in backend/local.env."
                : delivery.emailResult().error();
            if (exposeOtpInResponse) {
                return ResponseEntity.ok(Map.of(
                    "message",
                    "Email could not be sent. Use the verification code below.",
                    "emailSent",
                    false,
                    "devCode",
                    delivery.code(),
                    "smtpError",
                    error
                ));
            }
            return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE).body(new ApiErrorResponse(error));
        }
        return ResponseEntity.ok(Map.of(
            "message",
            "Verification code sent to " + delivery.emailResult().recipient() + " from " + delivery.emailResult().from() + ".",
            "emailSent",
            true
        ));
    }

    @PostMapping("/otp/verify")
    public ResponseEntity<?> verifyOtp(@Valid @RequestBody OtpVerifyRequest request) {
        String email = request.email().trim().toLowerCase();
        String purpose = request.purpose().trim().toLowerCase();
        if (!RolePolicy.isAllowedOtpPurpose(purpose)) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(new ApiErrorResponse("Invalid verification purpose."));
        }
        var userOpt = userRepository.findByEmail(email);
        if (userOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(new ApiErrorResponse("No account found for that email."));
        }
        if (!RolePolicy.isAllowed(userOpt.get().role())) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(new ApiErrorResponse("This account role is not permitted on the platform."));
        }
        if (!otpService.verify(email, purpose, request.code())) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(new ApiErrorResponse("Invalid or expired verification code."));
        }
        if ("registration".equalsIgnoreCase(purpose)) {
            userRepository.updateStatusByEmail(email, "Active");
        }
        return ResponseEntity.ok(Map.of("message", "Verification successful. You can sign in now."));
    }

    @PostMapping("/register")
    public ResponseEntity<?> registerClaimant(@Valid @RequestBody ClaimantRegistrationRequest request) {
        String email = request.email().trim().toLowerCase();
        if (userRepository.findByEmail(email).isPresent()) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body(new ApiErrorResponse("An account already exists for this email address."));
        }

        User user = new User(
            "u-" + UUID.randomUUID(),
            request.name().trim(),
            email,
            passwordEncoder.encode(request.password()),
            "claimant",
            "Customer Portal",
            request.phone().trim(),
            "Claims Customer",
            "Active",
            false
        );
        userRepository.insert(user);
        notificationRepository.insert(new NotificationItem(
            "n-" + UUID.randomUUID(),
            "New claimant registration",
            user.name() + " (" + email + ") registered via customer sign-up.",
            "Unread",
            Instant.now().toString()
        ));

        return ResponseEntity.status(HttpStatus.CREATED).body(Map.of(
            "user",
            PublicUser.from(user),
            "message",
            "Account created successfully. You can sign in now."
        ));
    }

    @PostMapping("/password-reset/request")
    public ResponseEntity<?> requestPasswordReset(@Valid @RequestBody PasswordResetRequest request) {
        String email = request.email().trim().toLowerCase();
        var userOpt = userRepository.findByEmail(email);
        if (userOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(new ApiErrorResponse("No account found for that email address."));
        }

        User user = userOpt.get();
        String resetToken = generateResetToken();
        Instant expiresAt = Instant.now().plus(15, ChronoUnit.MINUTES);
        passwordResetRepository.invalidateActiveForUser(user.id());
        passwordResetRepository.create("pr-" + UUID.randomUUID(), user.id(), passwordEncoder.encode(resetToken), expiresAt);

        String resetLink = frontendResetUrl
            + "?reset=true&email=" + URLEncoder.encode(email, StandardCharsets.UTF_8)
            + "&token=" + URLEncoder.encode(resetToken, StandardCharsets.UTF_8);
        OtpDelivery resetDelivery = otpService.sendPasswordReset(user, resetLink);

        if (!resetDelivery.emailSent()) {
            String error = resetDelivery.emailResult().error() == null || resetDelivery.emailResult().error().isBlank()
                ? "Check the Gmail app password and SMTP settings."
                : resetDelivery.emailResult().error();
            if (exposeOtpInResponse) {
                return ResponseEntity.ok(Map.of(
                    "message",
                    "Email could not be sent. Use the 6-digit code below on the reset page.",
                    "emailSent",
                    false,
                    "devCode",
                    resetDelivery.code(),
                    "resetLink",
                    resetLink,
                    "smtpError",
                    error
                ));
            }
            return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE)
                .body(new ApiErrorResponse("Password reset email was not sent to " + email + ". " + error));
        }

        notificationRepository.insert(new NotificationItem(
            "n-" + UUID.randomUUID(),
            "Password reset email sent",
            "Password reset instructions sent to " + email + ".",
            "Unread",
            Instant.now().toString()
        ));
        return ResponseEntity.ok(Map.of(
            "message", "Password reset link sent to " + email + " from " + resetDelivery.emailResult().from() + ".",
            "recipient", resetDelivery.emailResult().recipient(),
            "from", resetDelivery.emailResult().from(),
            "emailSent",
            true
        ));
    }

    @PostMapping("/password-reset/confirm")
    public ResponseEntity<?> confirmPasswordReset(@Valid @RequestBody PasswordResetConfirmRequest request) {
        String email = request.email().trim().toLowerCase();
        var userOpt = userRepository.findByEmail(email);
        if (userOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(new ApiErrorResponse("No account found for that email address."));
        }

        User user = userOpt.get();
        if (!RolePolicy.isAllowed(user.role())) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(new ApiErrorResponse("This account role is not permitted on the platform."));
        }

        String code = request.code().trim();
        boolean verified;
        if (code.matches("\\d{6}")) {
            verified = otpService.verify(email, "password-reset", code);
        } else {
            var resetOpt = passwordResetRepository.findLatestActiveForUser(user.id());
            verified = resetOpt.isPresent() && passwordEncoder.matches(code, resetOpt.get().codeHash());
            if (verified) {
                passwordResetRepository.markUsed(resetOpt.get().id());
            }
        }
        if (!verified) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(new ApiErrorResponse("Invalid or expired reset code or link."));
        }

        userRepository.updatePasswordByEmail(email, passwordEncoder.encode(request.password()));
        notificationRepository.insert(new NotificationItem(
            "n-" + UUID.randomUUID(),
            "Password changed",
            email + " created a new password successfully.",
            "Unread",
            Instant.now().toString()
        ));
        return ResponseEntity.ok(Map.of("message", "Password changed successfully."));
    }

    private String generateResetToken() {
        byte[] bytes = new byte[32];
        secureRandom.nextBytes(bytes);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
    }

    /** Password + OTP for named admins; password only for admin@prime.rw. */
    private boolean loginOtpAppliesTo(User user) {
        return AdminLoginPolicy.requiresLoginOtp(user, staffLoginOtpEnabled);
    }

    private ResponseEntity<?> buildStaffLoginOtpResponse(User user) {
        OtpDelivery delivery = otpService.sendOtp(user, "login");
        if (delivery.emailSent()) {
            return ResponseEntity.ok(new LoginChallengeResponse(
                true,
                user.email(),
                "A 6-digit code was sent to " + user.email() + " from " + delivery.emailResult().from() + ".",
                true,
                null
            ));
        }

        String error = delivery.emailResult().error() == null || delivery.emailResult().error().isBlank()
            ? "Configure SMTP (MAIL_PASSWORD) in backend/local.env."
            : delivery.emailResult().error();

        if (allowLoginWithoutOtpWhenMailFails) {
            return ResponseEntity.ok(authService.issueToken(user));
        }

        if (exposeOtpInResponse) {
            return ResponseEntity.ok(new LoginChallengeResponse(
                true,
                user.email(),
                "Email could not be sent (" + error + "). Enter the code shown below.",
                false,
                delivery.code()
            ));
        }

        return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE)
            .body(new ApiErrorResponse("Password accepted, but the sign-in code email could not be sent. " + error));
    }
}
