package com.cyuzuzo.backend.controller;

import com.cyuzuzo.backend.model.AnalyticsPoint;
import com.cyuzuzo.backend.service.ClaimDomainService;
import java.util.List;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/analytics")
public class AnalyticsController {
    private final ClaimDomainService claimDomainService;

    public AnalyticsController(ClaimDomainService claimDomainService) {
        this.claimDomainService = claimDomainService;
    }

    @GetMapping
    public List<AnalyticsPoint> listAnalytics() {
        return claimDomainService.buildAnalytics();
    }
}
