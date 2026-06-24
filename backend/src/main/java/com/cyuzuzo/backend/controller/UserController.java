package com.cyuzuzo.backend.controller;

import com.cyuzuzo.backend.model.PublicUser;
import com.cyuzuzo.backend.model.NotificationItem;
import com.cyuzuzo.backend.model.User;
import com.cyuzuzo.backend.model.UserCreateRequest;
import com.cyuzuzo.backend.model.AdminResetPasswordRequest;
import com.cyuzuzo.backend.model.UserUpdateRequest;
import com.cyuzuzo.backend.repository.NotificationRepository;
import com.cyuzuzo.backend.repository.UserRepository;
import com.cyuzuzo.backend.security.RolePolicy;
import com.cyuzuzo.backend.service.EmailNotificationService;
import com.cyuzuzo.backend.service.UserAdminService;
import jakarta.validation.Valid;
import java.time.Instant;
import java.util.List;
import java.util.UUID;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;

@RestController
@RequestMapping("/api/users")
public class UserController {
    private final UserRepository userRepository;
    private final NotificationRepository notificationRepository;
    private final EmailNotificationService emailNotificationService;
    private final PasswordEncoder passwordEncoder;
    private final UserAdminService userAdminService;

    public UserController(
        UserRepository userRepository,
        NotificationRepository notificationRepository,
        EmailNotificationService emailNotificationService,
        PasswordEncoder passwordEncoder,
        UserAdminService userAdminService
    ) {
        this.userRepository = userRepository;
        this.notificationRepository = notificationRepository;
        this.emailNotificationService = emailNotificationService;
        this.passwordEncoder = passwordEncoder;
        this.userAdminService = userAdminService;
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN')")
    public List<PublicUser> listUsers() {
        return userRepository.findAll().stream()
            .filter(user -> RolePolicy.isAllowed(user.role()))
            .map(PublicUser::from)
            .toList();
    }

    /** Read-only directory for officers and supervisors (no passwords). */
    @GetMapping("/directory")
    @PreAuthorize("hasAnyRole('OFFICER', 'SUPERVISOR', 'ADMIN', 'FRAUD_INVESTIGATOR', 'AGENT')")
    public List<PublicUser> listUserDirectory() {
        return userRepository.findAll().stream()
            .filter(user -> RolePolicy.isAllowed(user.role()))
            .map(PublicUser::from)
            .toList();
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN')")
    public ResponseEntity<?> createUser(@Valid @RequestBody UserCreateRequest request) {
        String email = request.email().trim().toLowerCase();
        if (userRepository.findByEmail(email).isPresent()) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body(new ApiErrorResponse("A user with this email already exists."));
        }

        String role = RolePolicy.normalize(request.role());
        if ("claimant".equals(role)) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(new ApiErrorResponse("Claimants must register through the customer sign-up page."));
        }
        if (!RolePolicy.isAllowed(role)) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(new ApiErrorResponse(
                "Role must be one of: agent, officer, supervisor, fraud-investigator, admin."
            ));
        }

        User user = new User(
            "u-" + UUID.randomUUID(),
            request.name().trim(),
            email,
            passwordEncoder.encode(request.temporaryPassword()),
            role,
            request.region().trim(),
            request.phone() == null ? null : request.phone().trim(),
            request.department() == null || request.department().isBlank() ? "Claims Operations" : request.department().trim(),
            "Active",
            false
        );
        userRepository.insert(user);

        String body = "Hello " + user.name() + ",\n\n"
            + "An account has been created for you on the Prime Insurance Digital Claims Portal.\n\n"
            + "Login email: " + user.email() + "\n"
            + "Temporary password: " + request.temporaryPassword() + "\n\n"
            + "You can log in with these credentials. After login, use Forgot password or your dashboard password settings to create a new password.\n\n"
            + "Prime Insurance LTD";

        boolean emailSent = emailNotificationService.sendPlainTo(user.email(), "Prime Claims Portal account created", body);
        notificationRepository.insert(new NotificationItem(
            "n-" + UUID.randomUUID(),
            emailSent ? "Staff account email sent" : "Staff account created",
            emailSent
                ? "Credentials email sent to " + user.email() + ". Temporary password was provided by admin."
                : "Account was saved in the database for " + user.email() + ", but SMTP email is not configured or failed. Enable MAIL_ENABLED and SMTP settings to deliver credentials by email.",
            "Unread",
            Instant.now().toString()
        ));

        return ResponseEntity.status(HttpStatus.CREATED).body(PublicUser.from(user));
    }

    @PatchMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN')")
    public ResponseEntity<?> updateUser(@PathVariable String id, @RequestBody UserUpdateRequest request) {
        var userOpt = userRepository.findById(id);
        if (userOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(new ApiErrorResponse("User not found."));
        }

        User existing = userOpt.get();
        if (request.name() != null || request.phone() != null || request.department() != null || request.region() != null) {
            userRepository.updateProfileById(
                id,
                request.name() != null && !request.name().isBlank() ? request.name().trim() : existing.name(),
                request.phone() != null ? request.phone().trim() : existing.phone(),
                request.department() != null && !request.department().isBlank() ? request.department().trim() : existing.department(),
                request.region() != null && !request.region().isBlank() ? request.region().trim() : existing.region()
            );
        }

        if (request.role() != null && !request.role().isBlank()) {
            String role = RolePolicy.normalize(request.role());
            if (!RolePolicy.isAllowed(role)) {
                return ResponseEntity.badRequest().body(new ApiErrorResponse("Invalid role."));
            }
            userRepository.updateRoleById(id, role);
        }
        if (request.status() != null && !request.status().isBlank()) {
            userRepository.updateStatusById(id, request.status().trim());
        }
        if (request.mfaEnabled() != null) {
            userRepository.updateMfaById(id, request.mfaEnabled());
        }

        var updated = userRepository.findById(id);
        if (updated.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(new ApiErrorResponse("User not found."));
        }
        return ResponseEntity.ok(PublicUser.from(updated.get()));
    }

    @PostMapping("/{id}/reset-password")
    @PreAuthorize("hasAnyRole('ADMIN')")
    public ResponseEntity<?> adminResetPassword(@PathVariable String id, @RequestBody(required = false) AdminResetPasswordRequest request) {
        var userOpt = userRepository.findById(id);
        if (userOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(new ApiErrorResponse("User not found."));
        }
        User user = userOpt.get();
        String tempPassword = request != null && request.temporaryPassword() != null && !request.temporaryPassword().isBlank()
            ? request.temporaryPassword().trim()
            : userAdminService.generateTemporaryPassword();

        userRepository.updatePasswordById(id, passwordEncoder.encode(tempPassword));
        userRepository.updateStatusById(id, "Active");

        return ResponseEntity.ok(userAdminService.buildTemporaryPasswordResult(user, tempPassword));
    }

    @PostMapping("/{id}/request-reset-email")
    @PreAuthorize("hasAnyRole('ADMIN')")
    public ResponseEntity<?> requestPasswordResetEmail(@PathVariable String id) {
        var userOpt = userRepository.findById(id);
        if (userOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(new ApiErrorResponse("User not found."));
        }
        return ResponseEntity.ok(userAdminService.sendPasswordResetEmail(userOpt.get()));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN')")
    public ResponseEntity<?> deleteUser(@PathVariable String id) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && id.equals(auth.getName())) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(new ApiErrorResponse("You cannot delete your own account while logged in."));
        }
        var userOpt = userRepository.findById(id);
        if (userOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(new ApiErrorResponse("User not found."));
        }
        if (userRepository.deleteById(id) == 0) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(new ApiErrorResponse("User not found."));
        }
        return ResponseEntity.ok(new java.util.LinkedHashMap<>(java.util.Map.of("message", "User deleted.")));
    }
}
