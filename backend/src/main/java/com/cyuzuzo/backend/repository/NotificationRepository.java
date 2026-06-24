package com.cyuzuzo.backend.repository;

import com.cyuzuzo.backend.model.NotificationItem;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.List;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.stereotype.Repository;

@Repository
public class NotificationRepository {
    private final JdbcTemplate jdbcTemplate;
    private final RowMapper<NotificationItem> rowMapper = this::mapRow;

    public NotificationRepository(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    public int count() {
        Integer count = jdbcTemplate.queryForObject("SELECT COUNT(*) FROM notifications", Integer.class);
        return count == null ? 0 : count;
    }

    public void insert(NotificationItem notification) {
        jdbcTemplate.update(
            "INSERT INTO notifications (id, title, body, status, at) VALUES (?, ?, ?, ?, ?::timestamptz)",
            notification.id(), notification.title(), notification.body(), notification.status(), notification.at()
        );
    }

    public List<NotificationItem> findAll() {
        return jdbcTemplate.query("SELECT * FROM notifications ORDER BY at DESC, id DESC", rowMapper);
    }

    public void updateStatus(String id, String status) {
        jdbcTemplate.update("UPDATE notifications SET status = ? WHERE id = ?", status, id);
    }

    private NotificationItem mapRow(ResultSet rs, int rowNum) throws SQLException {
        return new NotificationItem(
            rs.getString("id"),
            rs.getString("title"),
            rs.getString("body"),
            rs.getString("status"),
            rs.getTimestamp("at").toInstant().toString()
        );
    }
}
