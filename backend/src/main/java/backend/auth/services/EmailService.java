package backend.auth.services;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.MailException;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Service
public class EmailService {

    private static final Logger logger = LoggerFactory.getLogger(EmailService.class);

    private final JavaMailSender mailSender;
    private final String fromAddress;

    public EmailService(JavaMailSender mailSender,
                        @Value("${app.mail.from:}") String fromAddress) {
        this.mailSender = mailSender;
        this.fromAddress = fromAddress;
    }

    public void sendWelcomeEmail(String to, String displayName) {
        if (!isConfigured() || to == null || to.isBlank()) {
            return;
        }

        String name = displayName == null || displayName.isBlank() ? "there" : displayName.trim();
        String subject = "Welcome to NEXUS";
        String body = "Hi " + name + ",\n\n"
                + "Welcome to NEXUS. Your account is now ready.\n\n"
                + "You can sign in and start using bookings, tickets, and notifications.\n\n"
                + "- NEXUS Team";

        sendTextEmail(to, subject, body);
    }

    public void sendPasswordResetEmail(String to, String displayName, String resetLink) {
        if (!isConfigured() || to == null || to.isBlank() || resetLink == null || resetLink.isBlank()) {
            return;
        }

        String name = displayName == null || displayName.isBlank() ? "there" : displayName.trim();
        String subject = "Reset your NEXUS password";
        String body = "Hi " + name + ",\n\n"
                + "We received a request to reset your NEXUS password.\n"
                + "Use this link to continue:\n\n"
                + resetLink + "\n\n"
                + "This link expires in 30 minutes. If you did not request this, you can ignore this email.\n\n"
                + "- NEXUS Team";

        sendTextEmail(to, subject, body);
    }

    private void sendTextEmail(String to, String subject, String body) {
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom(fromAddress);
            message.setTo(to);
            message.setSubject(subject);
            message.setText(body);
            mailSender.send(message);
        } catch (MailException ex) {
            logger.warn("Email delivery failed for {}: {}", to, ex.getMessage());
        }
    }

    private boolean isConfigured() {
        return fromAddress != null && !fromAddress.isBlank();
    }
}
