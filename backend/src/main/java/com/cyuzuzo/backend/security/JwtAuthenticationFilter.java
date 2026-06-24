package com.cyuzuzo.backend.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.util.List;
import java.util.stream.Collectors;
import org.springframework.http.HttpHeaders;
import org.springframework.lang.NonNull;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

@Component
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private final JwtService jwtService;

    public JwtAuthenticationFilter(JwtService jwtService) {
        this.jwtService = jwtService;
    }

    @Override
    protected void doFilterInternal(
        @NonNull HttpServletRequest request,
        @NonNull HttpServletResponse response,
        @NonNull FilterChain filterChain
    ) throws ServletException, IOException {
        String token = resolveToken(request);
        if (token != null) {
            try {
                var claims = jwtService.parseToken(token);
                String userId = claims.getSubject();
                String role = claims.get("role", String.class);
                List<SimpleGrantedAuthority> authorities = JwtService.authoritiesFromRole(role).stream()
                    .map(SimpleGrantedAuthority::new)
                    .collect(Collectors.toList());

                UsernamePasswordAuthenticationToken authentication =
                    new UsernamePasswordAuthenticationToken(userId, null, authorities);
                authentication.setDetails(claims.get("email"));
                SecurityContextHolder.getContext().setAuthentication(authentication);
            } catch (Exception ignored) {
                SecurityContextHolder.clearContext();
            }
        }
        filterChain.doFilter(request, response);
    }

    private String resolveToken(HttpServletRequest request) {
        String auth = request.getHeader(HttpHeaders.AUTHORIZATION);
        if (auth != null && auth.startsWith("Bearer ")) {
            return auth.substring(7).trim();
        }
        String uri = request.getRequestURI();
        if (uri != null && uri.endsWith("/api/events")) {
            String queryToken = request.getParameter("access_token");
            if (queryToken != null && !queryToken.isBlank()) {
                return queryToken.trim();
            }
        }
        return null;
    }
}
