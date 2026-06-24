package com.cyuzuzo.backend.service;

import com.cyuzuzo.backend.model.ConversationSummary;
import com.cyuzuzo.backend.model.DirectMessage;
import com.cyuzuzo.backend.model.PublicUser;
import com.cyuzuzo.backend.model.SendMessageRequest;
import com.cyuzuzo.backend.model.User;
import com.cyuzuzo.backend.repository.DirectMessageRepository;
import com.cyuzuzo.backend.repository.UserRepository;
import com.cyuzuzo.backend.security.RolePolicy;
import java.util.LinkedHashMap;
import java.time.Instant;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

@Service
public class MessageService {

    private final DirectMessageRepository directMessageRepository;
    private final UserRepository userRepository;
    private final ClaimAccessService claimAccessService;
    public MessageService(
        DirectMessageRepository directMessageRepository,
        UserRepository userRepository,
        ClaimAccessService claimAccessService
    ) {
        this.directMessageRepository = directMessageRepository;
        this.userRepository = userRepository;
        this.claimAccessService = claimAccessService;
    }

    public List<PublicUser> listContacts() {
        User current = requireCurrentUser();
        return userRepository.findAll().stream()
            .filter(user -> RolePolicy.isAllowed(user.role()))
            .filter(user -> !user.id().equals(current.id()))
            .filter(user -> user.status() == null || "Active".equalsIgnoreCase(user.status()))
            .map(PublicUser::from)
            .sorted(Comparator.comparing(PublicUser::name, String.CASE_INSENSITIVE_ORDER))
            .toList();
    }

    public List<ConversationSummary> listConversations() {
        User current = requireCurrentUser();
        List<DirectMessage> messages = directMessageRepository.findAllForUser(current.id());
        Map<String, List<DirectMessage>> byPartner = new LinkedHashMap<>();

        for (DirectMessage message : messages) {
            String partnerId = message.mine() ? message.toUserId() : message.fromUserId();
            byPartner.computeIfAbsent(partnerId, key -> new ArrayList<>()).add(message);
        }

        List<ConversationSummary> summaries = new ArrayList<>();
        for (Map.Entry<String, List<DirectMessage>> entry : byPartner.entrySet()) {
            List<DirectMessage> thread = entry.getValue();
            DirectMessage last = thread.get(thread.size() - 1);
            String partnerId = entry.getKey();
            String partnerName = last.mine() ? last.toUserName() : last.fromUserName();
            int unread = (int) thread.stream().filter(m -> !m.mine() && m.readAt() == null).count();
            summaries.add(
                new ConversationSummary(
                    partnerId,
                    partnerName,
                    resolveRole(partnerId),
                    last.body(),
                    last.createdAt(),
                    unread
                )
            );
        }

        summaries.sort(Comparator.comparing(ConversationSummary::lastAt).reversed());
        return summaries;
    }

    public List<DirectMessage> getThread(String otherUserId) {
        User current = requireCurrentUser();
        assertUserExists(otherUserId);
        if (otherUserId.equals(current.id())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "You cannot message yourself.");
        }
        List<DirectMessage> thread = directMessageRepository.findBetween(current.id(), otherUserId);
        directMessageRepository.markThreadRead(current.id(), otherUserId);
        return thread;
    }

    public DirectMessage sendMessage(SendMessageRequest request) {
        User current = requireCurrentUser();
        String toUserId = request.toUserId() == null ? "" : request.toUserId().trim();
        if (toUserId.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Recipient is required.");
        }
        if (toUserId.equals(current.id())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "You cannot message yourself.");
        }
        User recipient = assertUserExists(toUserId);

        String body = request.body() == null ? "" : request.body().trim();
        if (body.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Message body is required.");
        }

        String relatedClaimId = request.relatedClaimId() == null || request.relatedClaimId().isBlank()
            ? null
            : request.relatedClaimId().trim();

        String id = "dm-" + UUID.randomUUID();
        String createdAt = Instant.now().toString();
        directMessageRepository.insert(id, current.id(), toUserId, body, relatedClaimId, createdAt);

        return new DirectMessage(
            id,
            current.id(),
            current.name(),
            recipient.id(),
            recipient.name(),
            body,
            relatedClaimId,
            null,
            createdAt,
            true
        );
    }

    public void markThreadRead(String otherUserId) {
        User current = requireCurrentUser();
        assertUserExists(otherUserId);
        directMessageRepository.markThreadRead(current.id(), otherUserId);
    }

    private User requireCurrentUser() {
        return claimAccessService.currentUser()
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Authentication required."));
    }

    private User assertUserExists(String userId) {
        Optional<User> userOpt = userRepository.findById(userId);
        if (userOpt.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found.");
        }
        return userOpt.get();
    }

    private String resolveRole(String userId) {
        return userRepository.findById(userId).map(User::role).orElse("user");
    }
}
