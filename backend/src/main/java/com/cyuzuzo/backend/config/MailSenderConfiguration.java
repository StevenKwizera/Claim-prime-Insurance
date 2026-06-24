package com.cyuzuzo.backend.config;

import java.util.Properties;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.JavaMailSenderImpl;

@Configuration
public class MailSenderConfiguration {

    private static final Logger log = LoggerFactory.getLogger(MailSenderConfiguration.class);

    @Bean
    @ConditionalOnProperty(name = "mail.enabled", havingValue = "true")
    public JavaMailSender javaMailSender(
        @Value("${spring.mail.host}") String host,
        @Value("${spring.mail.port}") int port,
        @Value("${spring.mail.username:}") String username,
        @Value("${spring.mail.password:}") String password,
        @Value("${spring.mail.properties.mail.smtp.auth:true}") boolean smtpAuth,
        @Value("${spring.mail.properties.mail.smtp.starttls.enable:true}") boolean startTls
    ) {
        String normalizedPassword = password == null ? "" : password.replace(" ", "").trim();
        String normalizedUser = username == null ? "" : username.trim();

        JavaMailSenderImpl sender = new JavaMailSenderImpl();
        sender.setHost(host);
        sender.setPort(port);
        sender.setUsername(normalizedUser);
        sender.setPassword(normalizedPassword);

        Properties props = sender.getJavaMailProperties();
        props.put("mail.transport.protocol", "smtp");
        props.put("mail.smtp.auth", String.valueOf(smtpAuth));
        props.put("mail.smtp.connectiontimeout", "15000");
        props.put("mail.smtp.timeout", "15000");
        props.put("mail.smtp.writetimeout", "15000");
        props.put("mail.smtp.ssl.trust", host);

        if (port == 465) {
            props.put("mail.smtp.ssl.enable", "true");
            props.put("mail.smtp.socketFactory.port", "465");
            props.put("mail.smtp.socketFactory.class", "javax.net.ssl.SSLSocketFactory");
            props.put("mail.smtp.socketFactory.fallback", "false");
            props.put("mail.smtp.starttls.enable", "false");
            props.put("mail.smtp.starttls.required", "false");
            log.info("Mail configured for Gmail SSL on port 465 as {}", normalizedUser);
        } else {
            props.put("mail.smtp.starttls.enable", String.valueOf(startTls));
            props.put("mail.smtp.starttls.required", String.valueOf(startTls));
            log.info("Mail configured for STARTTLS on {}:{} as {}", host, port, normalizedUser);
        }

        if (normalizedPassword.isEmpty()) {
            log.warn("MAIL_PASSWORD is empty — emails will fail until you set a Gmail App Password in backend/local.env");
        }

        return sender;
    }
}
