package com.cyuzuzo.backend.config;

import java.util.concurrent.Executors;
import java.util.concurrent.ScheduledExecutorService;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class AsyncConfig {

    @Bean(destroyMethod = "shutdown")
    public ScheduledExecutorService sseHeartbeatExecutor() {
        return Executors.newScheduledThreadPool(2, r -> {
            Thread t = new Thread(r, "sse-heartbeat");
            t.setDaemon(true);
            return t;
        });
    }
}
