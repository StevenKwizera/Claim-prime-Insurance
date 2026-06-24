package com.cyuzuzo.backend.repository;

import com.cyuzuzo.backend.model.DirectMessage;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Timestamp;
import java.util.List;
import java.util.Optional;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.stereotype.Repository;

@Repository
public class DirectMessageRepository {
    private final JdbcTemplate jdbcTemplate;

    public DirectMessageRepository(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    public void insert(
        String id,
        String fromUserId,
        String toUserId,
        String body,
        String relatedClaimId,
        String createdAt
    ) {
        jdbcTemplate.update(
            """
            INSERT INTO direct_messages (id, from_user_id, to_user_id, body, related_claim_id, created_at)
            VALUES (?, ?, ?, ?, ?, ?::timestamptz)
            """,
            id,
            fromUserId,
            toUserId,
            body,
            relatedClaimId,
            createdAt
        );
    }

    public List<DirectMessage> findAllForUser(String userId) {
        return jdbcTemplate.query(
            """
            SELECT m.id, m.from_user_id, fu.name AS from_name, m.to_user_id, tu.name AS to_name,
                   m.body, m.related_claim_id, m.read_at, m.created_at
            FROM direct_messages m
            JOIN users fu ON fu.id = m.from_user_id
            JOIN users tu ON tu.id = m.to_user_id
            WHERE m.from_user_id = ? OR m.to_user_id = ?
            ORDER BY m.created_at ASC, m.id ASC
            """,
            rowMapper(userId),
            userId,
            userId
        );
    }

    public List<DirectMessage> findBetween(String userId, String otherUserId) {
        return jdbcTemplate.query(
            """
            SELECT m.id, m.from_user_id, fu.name AS from_name, m.to_user_id, tu.name AS to_name,
                   m.body, m.related_claim_id, m.read_at, m.created_at
            FROM direct_messages m
            JOIN users fu ON fu.id = m.from_user_id
            JOIN users tu ON tu.id = m.to_user_id
            WHERE (m.from_user_id = ? AND m.to_user_id = ?)
               OR (m.from_user_id = ? AND m.to_user_id = ?)
            ORDER BY m.created_at ASC, m.id ASC
            """,
            rowMapper(userId),
            userId,
            otherUserId,
            otherUserId,
            userId
        );
    }

    public Optional<DirectMessage> findById(String id, String viewerUserId) {
        List<DirectMessage> rows = jdbcTemplate.query(
            """
            SELECT m.id, m.from_user_id, fu.name AS from_name, m.to_user_id, tu.name AS to_name,
                   m.body, m.related_claim_id, m.read_at, m.created_at
            FROM direct_messages m
            JOIN users fu ON fu.id = m.from_user_id
            JOIN users tu ON tu.id = m.to_user_id
            WHERE m.id = ?
            """,
            rowMapper(viewerUserId),
            id
        );
        return rows.isEmpty() ? Optional.empty() : Optional.of(rows.get(0));
    }

    public int markThreadRead(String recipientUserId, String senderUserId) {
        return jdbcTemplate.update(
            """
            UPDATE direct_messages
            SET read_at = NOW()
            WHERE to_user_id = ? AND from_user_id = ? AND read_at IS NULL
            """,
            recipientUserId,
            senderUserId
        );
    }

    private RowMapper<DirectMessage> rowMapper(String viewerUserId) {
        return (rs, rowNum) -> mapRow(rs, viewerUserId);
    }

    private DirectMessage mapRow(ResultSet rs, String viewerUserId) throws SQLException {
        String fromUserId = rs.getString("from_user_id");
        Timestamp readAt = rs.getTimestamp("read_at");
        return new DirectMessage(
            rs.getString("id"),
            fromUserId,
            rs.getString("from_name"),
            rs.getString("to_user_id"),
            rs.getString("to_name"),
            rs.getString("body"),
            rs.getString("related_claim_id"),
            readAt == null ? null : readAt.toInstant().toString(),
            rs.getTimestamp("created_at").toInstant().toString(),
            viewerUserId != null && viewerUserId.equals(fromUserId)
        );
    }
}
