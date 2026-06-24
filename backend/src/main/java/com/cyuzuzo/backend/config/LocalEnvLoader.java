package com.cyuzuzo.backend.config;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/** Loads backend/local.env before Spring starts (same keys as start-backend.ps1). */
public final class LocalEnvLoader {
    private static final Logger log = LoggerFactory.getLogger(LocalEnvLoader.class);

    private LocalEnvLoader() {
    }

    public static Map<String, Object> loadDefaultProperties() {
        Map<String, Object> properties = new HashMap<>();
        Path path = findEnvFile();
        if (path == null) {
            log.debug("No local.env file found; using defaults and OS environment only.");
            return properties;
        }

        try {
            int count = 0;
            for (String line : Files.readAllLines(path)) {
                String trimmed = line.trim();
                if (trimmed.isEmpty() || trimmed.startsWith("#")) {
                    continue;
                }
                int separator = trimmed.indexOf('=');
                if (separator <= 0) {
                    continue;
                }
                String key = trimmed.substring(0, separator).trim();
                String value = trimmed.substring(separator + 1).trim();
                if (key.isEmpty()) {
                    continue;
                }
                if (System.getenv(key) != null || System.getProperty(key) != null) {
                    continue;
                }
                System.setProperty(key, value);
                properties.put(key, value);
                count++;
            }
            applySpringMailMappings(properties);
            log.info("Loaded {} variable(s) from {}", count, path.toAbsolutePath());
        } catch (IOException ex) {
            log.warn("Could not read {}: {}", path, ex.getMessage());
        }
        return properties;
    }

    private static Path findEnvFile() {
        for (Path candidate : List.of(Path.of("local.env"), Path.of("backend", "local.env"))) {
            if (Files.isRegularFile(candidate)) {
                return candidate;
            }
        }
        return null;
    }

    private static void applySpringMailMappings(Map<String, Object> properties) {
        copyProperty(properties, "MAIL_USERNAME", "spring.mail.username");
        String password = stringValue(properties.get("MAIL_PASSWORD"));
        if (!password.isBlank()) {
            properties.put("spring.mail.password", password.replace(" ", ""));
        }
        copyProperty(properties, "MAIL_HOST", "spring.mail.host");
        copyProperty(properties, "MAIL_PORT", "spring.mail.port");
        copyProperty(properties, "MAIL_ENABLED", "mail.enabled");
        copyProperty(properties, "MAIL_FROM", "mail.from");
        copyProperty(properties, "MAIL_SMTP_STARTTLS", "spring.mail.properties.mail.smtp.starttls.enable");
    }

    private static void copyProperty(Map<String, Object> properties, String sourceKey, String targetKey) {
        String value = stringValue(properties.get(sourceKey));
        if (!value.isBlank()) {
            properties.put(targetKey, value);
        }
    }

    private static String stringValue(Object value) {
        return value == null ? "" : String.valueOf(value).trim();
    }
}
