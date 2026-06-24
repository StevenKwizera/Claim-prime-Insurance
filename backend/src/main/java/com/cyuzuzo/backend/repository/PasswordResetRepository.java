package com.cyuzuzo.backend.repository;

import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Timestamp;
import java.time.Instant;
import java.util.List;
import java.util.Optional;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.stereotype.Repository;

@Repository
public class PasswordResetRepository {
    private final JdbcTemplate jdbcTemplate;
    private final RowMapper<PasswordResetRecord> rowMapper = this::mapRow;

    public PasswordResetRepository(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    public void invalidateActiveForUser(String userId) {
        jdbcTemplate.update(
            """
            UPDATE password_resets
            SET used_at = NOW()
            WHERE user_id = ? AND used_at IS NULL
            """,
            userId
        );
    }

    public void create(String id, String userId, String codeHash, Instant expiresAt) {
        jdbcTemplate.update(
            """
            INSERT INTO password_resets (id, user_id, token_hash, expires_at)
            VALUES (?, ?, ?, ?)
            """,
            id,
            userId,
            codeHash,
            Timestamp.from(expiresAt)
        );
    }

    public Optional<PasswordResetRecord> findLatestActiveForUser(String userId) {
        List<PasswordResetRecord> records = jdbcTemplate.query(
            """
            SELECT id, user_id, token_hash, expires_at, used_at
            FROM password_resets
            WHERE user_id = ? AND used_at IS NULL AND expires_at > NOW()
            ORDER BY created_at DESC
            LIMIT 1
            """,
            rowMapper,
            userId
        );
        return records.stream().findFirst();
    }

    public void markUsed(String id) {
        jdbcTemplate.update("UPDATE password_resets SET used_at = NOW() WHERE id = ?", id);
    }

    private PasswordResetRecord mapRow(ResultSet rs, int rowNum) throws SQLException {
        return new PasswordResetRecord(
            rs.getString("id"),
            rs.getString("user_id"),
            rs.getString("token_hash"),
            rs.getTimestamp("expires_at").toInstant(),
            rs.getTimestamp("used_at") == null ? null : rs.getTimestamp("used_at").toInstant()
        );
    }

    public record PasswordResetRecord(
        String id,
        String userId,
        String codeHash,
        Instant expiresAt,
        Instant usedAt
    ) {
    }
}
