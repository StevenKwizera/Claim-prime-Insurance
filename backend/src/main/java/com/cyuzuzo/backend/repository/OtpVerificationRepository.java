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
public class OtpVerificationRepository {
    private final JdbcTemplate jdbcTemplate;
    private final RowMapper<OtpRecord> rowMapper = this::mapRow;

    public OtpVerificationRepository(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    public void invalidateActive(String email, String purpose) {
        jdbcTemplate.update(
            """
            UPDATE otp_verifications
            SET verified_at = NOW()
            WHERE LOWER(email) = LOWER(?) AND purpose = ? AND verified_at IS NULL
            """,
            email,
            purpose
        );
    }

    public void create(
        String id,
        String userId,
        String email,
        String phone,
        String otpHash,
        String purpose,
        String channel,
        Instant expiresAt
    ) {
        jdbcTemplate.update(
            """
            INSERT INTO otp_verifications (id, user_id, email, phone, otp_hash, purpose, channel, expires_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            """,
            id,
            userId,
            email,
            phone,
            otpHash,
            purpose,
            channel,
            Timestamp.from(expiresAt)
        );
    }

    public Optional<OtpRecord> findLatestActive(String email, String purpose) {
        List<OtpRecord> rows = jdbcTemplate.query(
            """
            SELECT id, user_id, email, otp_hash, purpose, attempts, expires_at, verified_at
            FROM otp_verifications
            WHERE LOWER(email) = LOWER(?) AND purpose = ? AND verified_at IS NULL AND expires_at > NOW()
            ORDER BY created_at DESC
            LIMIT 1
            """,
            rowMapper,
            email,
            purpose
        );
        return rows.stream().findFirst();
    }

    public void incrementAttempts(String id) {
        jdbcTemplate.update("UPDATE otp_verifications SET attempts = attempts + 1 WHERE id = ?", id);
    }

    public void markVerified(String id) {
        jdbcTemplate.update("UPDATE otp_verifications SET verified_at = NOW() WHERE id = ?", id);
    }

    private OtpRecord mapRow(ResultSet rs, int rowNum) throws SQLException {
        return new OtpRecord(
            rs.getString("id"),
            rs.getString("user_id"),
            rs.getString("email"),
            rs.getString("otp_hash"),
            rs.getString("purpose"),
            rs.getInt("attempts"),
            rs.getTimestamp("expires_at").toInstant(),
            rs.getTimestamp("verified_at") == null ? null : rs.getTimestamp("verified_at").toInstant()
        );
    }

    public record OtpRecord(
        String id,
        String userId,
        String email,
        String otpHash,
        String purpose,
        int attempts,
        Instant expiresAt,
        Instant verifiedAt
    ) {
    }
}
