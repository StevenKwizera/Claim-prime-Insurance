package com.cyuzuzo.backend.repository;

import com.cyuzuzo.backend.model.Claim;
import com.cyuzuzo.backend.model.ClaimDocument;
import com.cyuzuzo.backend.model.TimelineEntry;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.io.IOException;
import java.math.BigDecimal;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.List;
import java.util.Optional;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.stereotype.Repository;

@Repository
public class ClaimRepository {
    private final JdbcTemplate jdbcTemplate;
    private final ObjectMapper objectMapper;
    private final RowMapper<Claim> rowMapper = this::mapRow;

    public ClaimRepository(JdbcTemplate jdbcTemplate, ObjectMapper objectMapper) {
        this.jdbcTemplate = jdbcTemplate;
        this.objectMapper = objectMapper;
    }

    public int count() {
        Integer count = jdbcTemplate.queryForObject("SELECT COUNT(*) FROM claims", Integer.class);
        return count == null ? 0 : count;
    }

    public List<String> findAllIds() {
        return jdbcTemplate.query("SELECT id FROM claims", (rs, rowNum) -> rs.getString("id"));
    }

    public List<Claim> findAll() {
        return jdbcTemplate.query("SELECT * FROM claims ORDER BY submitted_at DESC, id DESC", rowMapper);
    }

    public Optional<Claim> findById(String id) {
        List<Claim> claims = jdbcTemplate.query("SELECT * FROM claims WHERE id = ?", rowMapper, id);
        return claims.stream().findFirst();
    }

    public void insert(Claim claim) {
        jdbcTemplate.update(
            """
            INSERT INTO claims (
                id, claimant_name, policy_number, type, status, region,
                submitted_at, estimated_completion, risk_score, amount,
                ai_summary, assigned_team, assigned_officer, documents, timeline
            ) VALUES (?, ?, ?, ?, ?, ?, ?::timestamptz, ?::timestamptz, ?, ?, ?, ?, ?, ?::jsonb, ?::jsonb)
            """,
            claim.id(),
            claim.claimantName(),
            claim.policyNumber(),
            claim.type(),
            claim.status(),
            claim.region(),
            claim.submittedAt(),
            claim.estimatedCompletion(),
            claim.riskScore(),
            resolveAmount(claim.amount()),
            claim.aiSummary(),
            claim.assignedTeam(),
            claim.assignedOfficer(),
            writeJson(claim.documents()),
            writeJson(claim.timeline())
        );
    }

    public int deleteById(String id) {
        return jdbcTemplate.update("DELETE FROM claims WHERE id = ?", id);
    }

    public void update(Claim claim) {
        jdbcTemplate.update(
            """
            UPDATE claims
            SET claimant_name = ?, policy_number = ?, type = ?, status = ?, region = ?,
                submitted_at = ?::timestamptz, estimated_completion = ?::timestamptz, risk_score = ?, amount = ?,
                ai_summary = ?, assigned_team = ?, assigned_officer = ?, documents = ?::jsonb, timeline = ?::jsonb
            WHERE id = ?
            """,
            claim.claimantName(),
            claim.policyNumber(),
            claim.type(),
            claim.status(),
            claim.region(),
            claim.submittedAt(),
            claim.estimatedCompletion(),
            claim.riskScore(),
            resolveAmount(claim.amount()),
            claim.aiSummary(),
            claim.assignedTeam(),
            claim.assignedOfficer(),
            writeJson(claim.documents()),
            writeJson(claim.timeline()),
            claim.id()
        );
    }

    private Claim mapRow(ResultSet rs, int rowNum) throws SQLException {
        return new Claim(
            rs.getString("id"),
            rs.getString("claimant_name"),
            rs.getString("policy_number"),
            rs.getString("type"),
            rs.getString("status"),
            rs.getString("region"),
            rs.getTimestamp("submitted_at").toInstant().toString(),
            rs.getTimestamp("estimated_completion").toInstant().toString(),
            rs.getInt("risk_score"),
            resolveAmount(rs.getBigDecimal("amount")),
            rs.getString("ai_summary"),
            rs.getString("assigned_team"),
            rs.getString("assigned_officer"),
            readDocuments(rs.getString("documents")),
            readTimeline(rs.getString("timeline"))
        );
    }

    private List<ClaimDocument> readDocuments(String raw) {
        try {
            return objectMapper.readValue(raw, new TypeReference<List<ClaimDocument>>() {});
        } catch (IOException e) {
            throw new IllegalStateException("Failed to parse claim documents", e);
        }
    }

    private List<TimelineEntry> readTimeline(String raw) {
        try {
            return objectMapper.readValue(raw, new TypeReference<List<TimelineEntry>>() {});
        } catch (IOException e) {
            throw new IllegalStateException("Failed to parse claim timeline", e);
        }
    }

    private String writeJson(Object value) {
        try {
            return objectMapper.writeValueAsString(value);
        } catch (IOException e) {
            throw new IllegalStateException("Failed to write claim json", e);
        }
    }

    private static BigDecimal resolveAmount(BigDecimal amount) {
        return amount == null ? BigDecimal.ZERO : amount;
    }
}
