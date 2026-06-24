package com.cyuzuzo.backend.repository;

import com.cyuzuzo.backend.model.User;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.List;
import java.util.Optional;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.stereotype.Repository;

@Repository
public class UserRepository {
    private final JdbcTemplate jdbcTemplate;
    private final RowMapper<User> rowMapper = this::mapRow;

    public UserRepository(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    public int count() {
        Integer count = jdbcTemplate.queryForObject("SELECT COUNT(*) FROM users", Integer.class);
        return count == null ? 0 : count;
    }

    public void insert(User user) {
        jdbcTemplate.update(
            """
            INSERT INTO users (id, name, email, password, role, region, phone, department, status, mfa_enabled)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            user.id(),
            user.name(),
            user.email(),
            user.password(),
            user.role(),
            user.region(),
            user.phone(),
            user.department(),
            user.status(),
            Boolean.TRUE.equals(user.mfaEnabled())
        );
    }

    public void updatePasswordByEmail(String email, String encodedPassword) {
        jdbcTemplate.update(
            "UPDATE users SET password = ?, updated_at = NOW() WHERE LOWER(email) = LOWER(?)",
            encodedPassword,
            email
        );
    }

    public void updateStatusByEmail(String email, String status) {
        jdbcTemplate.update(
            "UPDATE users SET status = ?, updated_at = NOW() WHERE LOWER(email) = LOWER(?)",
            status,
            email
        );
    }

    public void updateRoleById(String id, String role) {
        jdbcTemplate.update("UPDATE users SET role = ?, updated_at = NOW() WHERE id = ?", role, id);
    }

    public void updateStatusById(String id, String status) {
        jdbcTemplate.update("UPDATE users SET status = ?, updated_at = NOW() WHERE id = ?", status, id);
    }

    public void updateMfaById(String id, boolean mfaEnabled) {
        jdbcTemplate.update("UPDATE users SET mfa_enabled = ?, updated_at = NOW() WHERE id = ?", mfaEnabled, id);
    }

    public void updateProfileById(String id, String name, String phone, String department, String region) {
        jdbcTemplate.update(
            "UPDATE users SET name = ?, phone = ?, department = ?, region = ?, updated_at = NOW() WHERE id = ?",
            name,
            phone,
            department,
            region,
            id
        );
    }

    public void updatePasswordById(String id, String encodedPassword) {
        jdbcTemplate.update("UPDATE users SET password = ?, updated_at = NOW() WHERE id = ?", encodedPassword, id);
    }

    public int deleteById(String id) {
        return jdbcTemplate.update("DELETE FROM users WHERE id = ?", id);
    }

    public Optional<User> findById(String id) {
        List<User> users = jdbcTemplate.query(
            """
            SELECT id, name, email, password, role, region, phone, department, status, mfa_enabled
            FROM users WHERE id = ? LIMIT 1
            """,
            rowMapper,
            id
        );
        return users.stream().findFirst();
    }

    public void updateRoleByEmail(String email, String role) {
        jdbcTemplate.update(
            "UPDATE users SET role = ?, updated_at = NOW() WHERE LOWER(email) = LOWER(?)",
            role,
            email
        );
    }

    public Optional<User> findByEmailAndRole(String email, String role) {
        List<User> users = jdbcTemplate.query(
            """
            SELECT id, name, email, password, role, region, phone, department, status, mfa_enabled
            FROM users
            WHERE LOWER(email) = LOWER(?) AND role = ?
            LIMIT 1
            """,
            rowMapper,
            email,
            role
        );
        return users.stream().findFirst();
    }

    public Optional<User> findByEmail(String email) {
        List<User> users = jdbcTemplate.query(
            """
            SELECT id, name, email, password, role, region, phone, department, status, mfa_enabled
            FROM users
            WHERE LOWER(email) = LOWER(?)
            LIMIT 1
            """,
            rowMapper,
            email
        );
        return users.stream().findFirst();
    }

    public List<User> findAll() {
        return jdbcTemplate.query(
            "SELECT id, name, email, password, role, region, phone, department, status, mfa_enabled FROM users ORDER BY created_at DESC, name ASC",
            rowMapper
        );
    }

    private User mapRow(ResultSet rs, int rowNum) throws SQLException {
        return new User(
            rs.getString("id"),
            rs.getString("name"),
            rs.getString("email"),
            rs.getString("password"),
            rs.getString("role"),
            rs.getString("region"),
            rs.getString("phone"),
            rs.getString("department"),
            rs.getString("status") == null || rs.getString("status").isBlank() ? "Active" : rs.getString("status"),
            rs.getBoolean("mfa_enabled")
        );
    }
}
