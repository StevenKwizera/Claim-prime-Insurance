package com.cyuzuzo.backend.service;

import java.io.IOException;
import java.io.UncheckedIOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.Locale;
import java.util.UUID;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.stereotype.Component;
import org.springframework.web.multipart.MultipartFile;

@Component
public class ClaimFileStorage {

    private final Path baseDirectory;
    private final long maxFileBytes;

    public ClaimFileStorage(
        @Value("${app.claims.upload-dir:./data/claim-uploads}") String uploadDir,
        @Value("${app.claims.max-file-bytes:15728640}") long maxFileBytes
    ) {
        this.baseDirectory = Paths.get(uploadDir).toAbsolutePath().normalize();
        this.maxFileBytes = maxFileBytes;
    }

    public Path basePath() {
        return baseDirectory;
    }

    /**
     * @return storage key relative to base (e.g. CLM-24101/uuid_filename.pdf)
     */
    public String store(String claimId, MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("Empty file");
        }
        if (file.getSize() > maxFileBytes) {
            throw new IllegalArgumentException("File exceeds maximum allowed size");
        }
        String original = file.getOriginalFilename();
        if (original == null || original.isBlank()) {
            original = "upload.bin";
        }
        String safeName = sanitizeFilename(original);
        String extension = extensionOf(safeName);
        if (!isAllowedExtension(extension)) {
            throw new IllegalArgumentException("Unsupported file type");
        }

        Path claimDir = baseDirectory.resolve(sanitizeClaimId(claimId)).normalize();
        if (!claimDir.startsWith(baseDirectory)) {
            throw new IllegalArgumentException("Invalid claim id");
        }
        try {
            Files.createDirectories(claimDir);
        } catch (IOException e) {
            throw new UncheckedIOException(e);
        }

        String stored = UUID.randomUUID() + "_" + safeName;
        Path target = claimDir.resolve(stored).normalize();
        if (!target.startsWith(claimDir)) {
            throw new IllegalStateException("Invalid path");
        }
        try {
            file.transferTo(target);
        } catch (IOException e) {
            throw new UncheckedIOException(e);
        }
        return sanitizeClaimId(claimId) + "/" + stored;
    }

    public void deleteIfPresent(String storageKey) {
        if (storageKey == null || storageKey.isBlank()) {
            return;
        }
        Path resolved = baseDirectory.resolve(storageKey).normalize();
        if (!resolved.startsWith(baseDirectory)) {
            return;
        }
        try {
            Files.deleteIfExists(resolved);
        } catch (IOException e) {
            throw new UncheckedIOException(e);
        }
    }

    public Resource loadAsResource(String storageKey) throws IOException {
        Path resolved = baseDirectory.resolve(storageKey).normalize();
        if (!resolved.startsWith(baseDirectory)) {
            throw new IllegalArgumentException("Invalid storage key");
        }
        if (!Files.isReadable(resolved)) {
            throw new java.io.FileNotFoundException("File not found");
        }
        return new UrlResource(resolved.toUri());
    }

    private static String sanitizeClaimId(String claimId) {
        if (claimId == null || !claimId.matches("CLM-[A-Za-z0-9\\-]+")) {
            throw new IllegalArgumentException("Invalid claim id");
        }
        return claimId;
    }

    private static String sanitizeFilename(String name) {
        String trimmed = name.trim().replace("..", "");
        StringBuilder out = new StringBuilder();
        for (int i = 0; i < trimmed.length(); i++) {
            char c = trimmed.charAt(i);
            if (Character.isLetterOrDigit(c) || c == '.' || c == '-' || c == '_') {
                out.append(c);
            } else if (Character.isWhitespace(c)) {
                out.append('_');
            }
        }
        String s = out.toString();
        if (s.isBlank()) {
            return "file";
        }
        return s.length() > 120 ? s.substring(0, 120) : s;
    }

    private static String extensionOf(String name) {
        int dot = name.lastIndexOf('.');
        if (dot < 0 || dot == name.length() - 1) {
            return "";
        }
        return name.substring(dot + 1).toLowerCase(Locale.ROOT);
    }

    private static boolean isAllowedExtension(String ext) {
        return switch (ext) {
            case "pdf", "png", "jpg", "jpeg", "webp", "gif" -> true;
            default -> false;
        };
    }
}
