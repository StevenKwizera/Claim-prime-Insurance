package com.cyuzuzo.backend.service;

import com.cyuzuzo.backend.model.SeedData;
import com.cyuzuzo.backend.repository.ClaimRepository;
import com.cyuzuzo.backend.model.User;
import com.cyuzuzo.backend.repository.NotificationRepository;
import com.cyuzuzo.backend.repository.UserRepository;
import com.cyuzuzo.backend.security.RolePolicy;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Component
public class SeedService implements CommandLineRunner {
    private final ObjectMapper objectMapper;
    private final PasswordEncoder passwordEncoder;
    private final UserRepository userRepository;
    private final ClaimRepository claimRepository;
    private final NotificationRepository notificationRepository;

    public SeedService(
        ObjectMapper objectMapper,
        PasswordEncoder passwordEncoder,
        UserRepository userRepository,
        ClaimRepository claimRepository,
        NotificationRepository notificationRepository
    ) {
        this.objectMapper = objectMapper;
        this.passwordEncoder = passwordEncoder;
        this.userRepository = userRepository;
        this.claimRepository = claimRepository;
        this.notificationRepository = notificationRepository;
    }

    @Override
    public void run(String... args) throws Exception {
        Path seedPath = resolveSeedPath();
        if (Files.exists(seedPath)) {
        SeedData seedData = readSeedData(seedPath);
        seedData.users().forEach(user -> {
            String role = normalizeRole(user.role());
            if (!RolePolicy.isAllowed(role)) {
                return;
            }
            if (userRepository.findByEmail(user.email()).isPresent()) {
                return;
            }
            User withHash = new User(
                user.id(),
                user.name(),
                user.email(),
                passwordEncoder.encode(user.password()),
                role,
                user.region()
            );
            userRepository.insert(withHash);
        });
        seedData.claims().forEach(claim -> {
            if (claimRepository.findById(claim.id()).isEmpty()) {
                claimRepository.insert(claim);
            } else {
                claimRepository.update(claim);
            }
        });
        if (notificationRepository.count() == 0) {
            seedData.notifications().forEach(notificationRepository::insert);
        }
        }

        ensureAdminUser("kwizerasteven2000@gmail.com", "Cyuzuzo", "u-admin-steven");
        ensureAdminUser("cyuzuzophoebe@gmail.com", "Phoebe Cyuzuzo", "u-admin-phoebe");
        removeUserByEmail("superadmin@prime.rw");
    }

    private void removeUserByEmail(String email) {
        String normalizedEmail = email.trim().toLowerCase();
        userRepository.findByEmail(normalizedEmail).ifPresent(user -> userRepository.deleteById(user.id()));
    }

    private void ensureAdminUser(String email, String name, String id) {
        String normalizedEmail = email.trim().toLowerCase();
        var existing = userRepository.findByEmail(normalizedEmail);
        if (existing.isPresent()) {
            userRepository.updateRoleByEmail(normalizedEmail, "admin");
            userRepository.updateStatusByEmail(normalizedEmail, "Active");
            userRepository.updatePasswordByEmail(normalizedEmail, passwordEncoder.encode("password"));
            return;
        }

        User admin = new User(
            id,
            name,
            normalizedEmail,
            passwordEncoder.encode("password"),
            "admin",
            "HQ",
            null,
            "Platform Administration",
            "Active",
            false
        );
        userRepository.insert(admin);
    }

    private Path resolveSeedPath() {
        Path rootSeed = Path.of("database.json");
        if (Files.exists(rootSeed)) {
            return rootSeed;
        }
        return Path.of("backend", "database.json");
    }

    private SeedData readSeedData(Path seedPath) throws IOException {
        return objectMapper.readValue(Files.readString(seedPath), SeedData.class);
    }

    private String normalizeRole(String role) {
        return RolePolicy.normalize(role);
    }
}
