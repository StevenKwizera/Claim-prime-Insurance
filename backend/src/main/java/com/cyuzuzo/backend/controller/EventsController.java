package com.cyuzuzo.backend.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import java.io.IOException;
import java.time.Instant;
import java.util.HashMap;
import java.util.Map;
import java.util.concurrent.ScheduledExecutorService;
import java.util.concurrent.TimeUnit;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

@RestController
@RequestMapping("/api")
public class EventsController {

    private final ScheduledExecutorService sseHeartbeatExecutor;
    private final ObjectMapper objectMapper;

    public EventsController(ScheduledExecutorService sseHeartbeatExecutor, ObjectMapper objectMapper) {
        this.sseHeartbeatExecutor = sseHeartbeatExecutor;
        this.objectMapper = objectMapper;
    }

    @GetMapping(path = "/events", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public SseEmitter claimEvents() {
        SseEmitter emitter = new SseEmitter(0L);
        var future = sseHeartbeatExecutor.scheduleAtFixedRate(() -> {
            try {
                Map<String, Object> payload = new HashMap<>();
                payload.put("message", "Live claim status updates active");
                payload.put("ts", Instant.now().toString());
                emitter.send(SseEmitter.event().data(objectMapper.writeValueAsString(payload), MediaType.APPLICATION_JSON));
            } catch (IOException ex) {
                emitter.completeWithError(ex);
            } catch (IllegalStateException ex) {
                // emitter already completed
            }
        }, 1500, 15000, TimeUnit.MILLISECONDS);

        emitter.onCompletion(() -> future.cancel(false));
        emitter.onTimeout(() -> future.cancel(false));
        emitter.onError(e -> future.cancel(false));
        return emitter;
    }
}
