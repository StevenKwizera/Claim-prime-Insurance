package com.cyuzuzo.backend.controller;

import com.cyuzuzo.backend.model.HealthResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class HealthController {
    @Value("${spring.datasource.url}")
    private String datasourceUrl;

    @GetMapping("/health")
    public HealthResponse health() {
        return new HealthResponse("ok", datasourceUrl.substring(datasourceUrl.lastIndexOf('/') + 1));
    }
}
