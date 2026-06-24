package com.cyuzuzo.backend.service;

import jakarta.mail.internet.InternetAddress;
import jakarta.mail.internet.MimeMessage;
import java.util.Arrays;
import java.util.List;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

@Service
public class EmailNotificationService {

    private static final Logger log = LoggerFactory.getLogger(EmailNotificationService.class);
    private static final Pattern FROM_PATTERN = Pattern.compile("^(.+?)\\s*<([^>]+)>$");

    private final JavaMailSender mailSender;
    private final boolean mailEnabled;
    private final String mailFrom;
    private final String smtpUsername;
    private final String recipientsCsv;

    public EmailNotificationService(
        ObjectProvider<JavaMailSender> mailSenderProvider,
        @Value("${mail.enabled:false}") boolean mailEnabled,
        @Value("${mail.from:Prime Insurance <primeinsurance@gmail.com>}") String mailFrom,
        @Value("${spring.mail.username:}") String smtpUsername,
        @Value("${mail.recipients:}") String recipientsCsv
    ) {
        this.mailSender = mailSenderProvider.getIfAvailable();
        this.mailEnabled = mailEnabled;
        this.mailFrom = mailFrom;
        this.smtpUsername = smtpUsername == null ? "" : smtpUsername.trim();
        this.recipientsCsv = recipientsCsv;
    }

    public boolean sendPlain(String subject, String body) {
        return sendPlainTo(configuredRecipients(), subject, body);
    }

    public boolean sendPlainTo(String recipient, String subject, String body) {
        if (recipient == null || recipient.isBlank()) {
            return false;
        }
        return sendPlainToWithResult(recipient, subject, body).sent();
    }

    public EmailDeliveryResult sendPlainToWithResult(String recipient, String subject, String body) {
        if (recipient == null || recipient.isBlank()) {
            return new EmailDeliveryResult(false, "", mailFrom, "Recipient email is required.");
        }
        return sendPlainToWithResult(List.of(recipient.trim()), subject, body);
    }

    private List<String> configuredRecipients() {
        return Arrays.stream(recipientsCsv.split(","))
            .map(String::trim)
            .filter(s -> !s.isEmpty())
            .toList();
    }

    private boolean sendPlainTo(List<String> recipients, String subject, String body) {
        return sendPlainToWithResult(recipients, subject, body).sent();
    }

    private EmailDeliveryResult sendPlainToWithResult(List<String> recipients, String subject, String body) {
        String recipientText = String.join(", ", recipients);
        if (!mailEnabled || mailSender == null) {
            return new EmailDeliveryResult(false, recipientText, mailFrom, "Email sending is disabled or SMTP is not configured.");
        }
        if (recipients.isEmpty()) {
            return new EmailDeliveryResult(false, recipientText, mailFrom, "Recipient email is required.");
        }
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, false, "UTF-8");
            helper.setFrom(resolveFromAddress());
            helper.setTo(recipients.toArray(new String[0]));
            helper.setSubject(subject);
            helper.setText(body, false);
            mailSender.send(message);
            log.info("Email sent to {} subject={}", recipientText, subject);
            return new EmailDeliveryResult(true, recipientText, resolveFromEmail(), "");
        } catch (Exception ex) {
            log.warn("Email failed to {}: {}", recipientText, ex.getMessage());
            String detail = ex.getMessage() == null || ex.getMessage().isBlank() ? ex.getClass().getSimpleName() : ex.getMessage();
            if (detail.toLowerCase().contains("authentication")) {
                detail = "Gmail SMTP authentication failed. In backend/local.env set MAIL_USERNAME and MAIL_PASSWORD (16-character App Password, no spaces).";
            }
            return new EmailDeliveryResult(false, recipientText, resolveFromEmail(), detail);
        }
    }

    private InternetAddress resolveFromAddress() throws Exception {
        String configured = mailFrom == null ? "" : mailFrom.trim();
        String fromEmail = "";
        String displayName = "Prime Insurance";

        Matcher matcher = FROM_PATTERN.matcher(configured);
        if (matcher.matches()) {
            displayName = matcher.group(1).trim();
            fromEmail = matcher.group(2).trim();
        } else if (configured.contains("@")) {
            fromEmail = configured;
        }

        if (!smtpUsername.isBlank()
            && !fromEmail.isBlank()
            && !fromEmail.equalsIgnoreCase(smtpUsername)) {
            log.warn(
                "MAIL_FROM ({}) does not match MAIL_USERNAME ({}); sending as authenticated Gmail account.",
                fromEmail,
                smtpUsername
            );
            fromEmail = smtpUsername;
        }

        if (!fromEmail.isBlank()) {
            return new InternetAddress(fromEmail, displayName, "UTF-8");
        }

        String email = smtpUsername.isBlank() ? "noreply@localhost" : smtpUsername;
        return new InternetAddress(email, displayName, "UTF-8");
    }

    private String resolveFromEmail() {
        try {
            return resolveFromAddress().getAddress();
        } catch (Exception ex) {
            return smtpUsername.isBlank() ? mailFrom : smtpUsername;
        }
    }

    public record EmailDeliveryResult(
        boolean sent,
        String recipient,
        String from,
        String error
    ) {
    }
}
