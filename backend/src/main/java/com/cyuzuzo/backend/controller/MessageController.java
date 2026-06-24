package com.cyuzuzo.backend.controller;

import com.cyuzuzo.backend.model.ConversationSummary;
import com.cyuzuzo.backend.model.DirectMessage;
import com.cyuzuzo.backend.model.PublicUser;
import com.cyuzuzo.backend.model.SendMessageRequest;
import com.cyuzuzo.backend.service.MessageService;
import jakarta.validation.Valid;
import java.util.List;
import java.util.Map;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/messages")
public class MessageController {

    private final MessageService messageService;

    public MessageController(MessageService messageService) {
        this.messageService = messageService;
    }

    @GetMapping("/contacts")
    public List<PublicUser> listContacts() {
        return messageService.listContacts();
    }

    @GetMapping("/conversations")
    public List<ConversationSummary> listConversations() {
        return messageService.listConversations();
    }

    @GetMapping("/with/{userId}")
    public List<DirectMessage> getThread(@PathVariable String userId) {
        return messageService.getThread(userId);
    }

    @PostMapping
    public DirectMessage send(@Valid @RequestBody SendMessageRequest request) {
        return messageService.sendMessage(request);
    }

    @PatchMapping("/with/{userId}/read")
    public ResponseEntity<?> markThreadRead(@PathVariable String userId) {
        messageService.markThreadRead(userId);
        return ResponseEntity.ok(Map.of("message", "Conversation marked as read."));
    }
}
