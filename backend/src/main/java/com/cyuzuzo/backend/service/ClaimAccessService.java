package com.cyuzuzo.backend.service;

import com.cyuzuzo.backend.model.Claim;
import com.cyuzuzo.backend.model.User;
import com.cyuzuzo.backend.repository.UserRepository;
import java.util.List;
import java.util.Locale;
import java.util.Optional;
import java.util.Set;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

@Service
public class ClaimAccessService {

    private static final Set<String> CLAIMANT_MODIFIABLE_STATUSES = Set.of("Draft", "Pending", "Under Review");
    private static final Set<String> CLAIMANT_DELETABLE_STATUSES = Set.of("Draft", "Pending", "Under Review", "Rejected");

    private final UserRepository userRepository;

    public ClaimAccessService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    public Optional<User> currentUser() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated()) {
            return Optional.empty();
        }
        Object principal = auth.getPrincipal();
        if (!(principal instanceof String userId) || userId.isBlank()) {
            return Optional.empty();
        }
        return userRepository.findById(userId);
    }

    public boolean isClaimant(User user) {
        return user != null && "claimant".equalsIgnoreCase(user.role());
    }

    public List<Claim> filterVisible(List<Claim> claims) {
        Optional<User> userOpt = currentUser();
        if (userOpt.isEmpty()) {
            return claims;
        }
        User user = userOpt.get();
        if (!isClaimant(user)) {
            return claims;
        }
        return claims.stream()
            .filter(claim -> namesMatch(user.name(), claim.claimantName()))
            .toList();
    }

    public boolean canView(Claim claim) {
        if (claim == null) {
            return false;
        }
        Optional<User> userOpt = currentUser();
        if (userOpt.isEmpty()) {
            return true;
        }
        User user = userOpt.get();
        if (!isClaimant(user)) {
            return true;
        }
        return namesMatch(user.name(), claim.claimantName());
    }

    public boolean canUploadEvidence(Claim claim) {
        return canView(claim);
    }

    public boolean canModifyAsClaimant(Claim claim) {
        if (claim == null || !canView(claim)) {
            return false;
        }
        Optional<User> userOpt = currentUser();
        if (userOpt.isEmpty() || !isClaimant(userOpt.get())) {
            return false;
        }
        return CLAIMANT_MODIFIABLE_STATUSES.contains(claim.status());
    }

    public boolean canDeleteAsClaimant(Claim claim) {
        if (claim == null || !canView(claim)) {
            return false;
        }
        Optional<User> userOpt = currentUser();
        if (userOpt.isEmpty() || !isClaimant(userOpt.get())) {
            return false;
        }
        return CLAIMANT_DELETABLE_STATUSES.contains(claim.status());
    }

    public boolean canPerformOfficerAction() {
        Optional<User> userOpt = currentUser();
        if (userOpt.isEmpty()) {
            return false;
        }
        String role = userOpt.get().role();
        if (role == null) {
            return false;
        }
        String normalized = role.trim().toLowerCase(Locale.ROOT);
        return switch (normalized) {
            case "officer", "supervisor", "admin", "fraud-investigator" -> true;
            default -> false;
        };
    }

    public void assertClaimantNameMatchesAccount(String claimantName) {
        Optional<User> userOpt = currentUser();
        if (userOpt.isEmpty() || !isClaimant(userOpt.get())) {
            return;
        }
        if (!namesMatch(userOpt.get().name(), claimantName)) {
            throw new IllegalArgumentException(
                "Claimant name must match your account name (" + userOpt.get().name() + ")."
            );
        }
    }

    private static boolean namesMatch(String userName, String claimantName) {
        if (userName == null || claimantName == null) {
            return false;
        }
        return userName.trim().equalsIgnoreCase(claimantName.trim());
    }
}
