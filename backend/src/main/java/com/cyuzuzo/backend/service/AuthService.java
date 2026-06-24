package com.cyuzuzo.backend.service;

import com.cyuzuzo.backend.model.LoginRequest;
import com.cyuzuzo.backend.model.LoginResponse;
import com.cyuzuzo.backend.model.PublicUser;
import com.cyuzuzo.backend.model.User;
import com.cyuzuzo.backend.repository.UserRepository;
import com.cyuzuzo.backend.security.JwtService;
import com.cyuzuzo.backend.security.RolePolicy;
import java.util.Optional;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
public class AuthService {
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;

    public AuthService(UserRepository userRepository, PasswordEncoder passwordEncoder, JwtService jwtService) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
    }

    public Optional<User> authenticate(LoginRequest request) {
        String normalizedEmail = request.email() == null ? null : request.email().trim().toLowerCase();
        String normalizedPassword = request.password() == null ? null : request.password().trim();

        Optional<User> userOpt = userRepository.findByEmail(normalizedEmail);
        if (userOpt.isEmpty()) {
            return Optional.empty();
        }
        User user = userOpt.get();
        if (!passwordMatches(normalizedPassword, user.password())) {
            return Optional.empty();
        }
        if (!RolePolicy.isAllowed(user.role())) {
            return Optional.empty();
        }
        return Optional.of(user);
    }

    public LoginResponse issueToken(User user) {
        return new LoginResponse(jwtService.generateToken(user), PublicUser.from(user));
    }

    public LoginResponse login(LoginRequest request) {
        return authenticate(request).map(this::issueToken).orElse(null);
    }

    private boolean passwordMatches(String raw, String stored) {
        if (stored == null || raw == null) {
            return false;
        }
        if (stored.startsWith("$2a$") || stored.startsWith("$2b$") || stored.startsWith("$2y$")) {
            return passwordEncoder.matches(raw, stored);
        }
        return raw.equals(stored);
    }
}
