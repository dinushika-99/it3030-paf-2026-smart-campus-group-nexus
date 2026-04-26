package backend.auth.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.security.SecureRandom;
import java.util.Base64;

@Entity
@Table(name = "users")
public class User {

    private static final SecureRandom ID_RANDOM = new SecureRandom();
    private static final Base64.Encoder ID_ENCODER = Base64.getUrlEncoder().withoutPadding();

    @Id
    @Column(name = "user_id", nullable = false, updatable = false, length = 255)
    private String user_id;

    @Column(nullable = false, unique = true)
    private String email;

    @Column
    private String name;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Role role;

    @Column(name = "password_hash")
    private String passwordHash;

    @Enumerated(EnumType.STRING)
    @Column(name = "auth_provider", nullable = false, length = 32)
    private AuthProvider authProvider;

    @Column(name = "provider_id", unique = true, length = 255)
    private String providerId;

    @Column(name = "student_id", unique = true)
    private String studentId;

    @Column(nullable = false)
    private LocalDateTime createdAt;

    @Column(name = "avatar_url", length = 255)
    private String avatarUrl;

    @Column(name = "refresh_token_hash", length = 255)
    private String refreshTokenHash;

    @Column(name = "refresh_token_expires_at")
    private LocalDateTime refreshTokenExpiresAt;

    @Column(name = "two_factor_enabled", nullable = false)
    private Boolean twoFactorEnabled = false;

    @Column(name = "totp_secret", length = 128)
    private String totpSecret;

    @Column(name = "password_reset_token_hash", length = 128)
    private String passwordResetTokenHash;

    @Column(name = "password_reset_token_expires_at")
    private LocalDateTime passwordResetTokenExpiresAt;

    public User() {
    }

    public User(String email, String name, Role role, LocalDateTime createdAt) {
        this.email = email;
        this.name = name;
        this.role = role;
        this.createdAt = createdAt;
    }

    public String getId() {
        return user_id;
    }

    public void setId(String id) {
        this.user_id = id;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public Role getRole() {
        return role;
    }

    public void setRole(Role role) {
        this.role = role;
    }

    public String getPasswordHash() {
        return passwordHash;
    }

    public void setPasswordHash(String passwordHash) {
        this.passwordHash = passwordHash;
    }

    public AuthProvider getAuthProvider() {
        return authProvider;
    }

    public void setAuthProvider(AuthProvider authProvider) {
        this.authProvider = authProvider;
    }

    public String getProviderId() {
        return providerId;
    }

    public void setProviderId(String providerId) {
        this.providerId = providerId;
    }

    public String getStudentId() {
        return studentId;
    }

    public void setStudentId(String studentId) {
        this.studentId = studentId;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public String getAvatarUrl() {
        return avatarUrl;
    }

    public void setAvatarUrl(String avatarUrl) {
        this.avatarUrl = avatarUrl;
    }

    public String getRefreshTokenHash() {
        return refreshTokenHash;
    }

    public void setRefreshTokenHash(String refreshTokenHash) {
        this.refreshTokenHash = refreshTokenHash;
    }

    public LocalDateTime getRefreshTokenExpiresAt() {
        return refreshTokenExpiresAt;
    }

    public void setRefreshTokenExpiresAt(LocalDateTime refreshTokenExpiresAt) {
        this.refreshTokenExpiresAt = refreshTokenExpiresAt;
    }

    public Boolean getTwoFactorEnabled() {
        return twoFactorEnabled;
    }

    public void setTwoFactorEnabled(Boolean twoFactorEnabled) {
        this.twoFactorEnabled = twoFactorEnabled;
    }

    public String getTotpSecret() {
        return totpSecret;
    }

    public void setTotpSecret(String totpSecret) {
        this.totpSecret = totpSecret;
    }

    public String getPasswordResetTokenHash() {
        return passwordResetTokenHash;
    }

    public void setPasswordResetTokenHash(String passwordResetTokenHash) {
        this.passwordResetTokenHash = passwordResetTokenHash;
    }

    public LocalDateTime getPasswordResetTokenExpiresAt() {
        return passwordResetTokenExpiresAt;
    }

    public void setPasswordResetTokenExpiresAt(LocalDateTime passwordResetTokenExpiresAt) {
        this.passwordResetTokenExpiresAt = passwordResetTokenExpiresAt;
    }

    @PrePersist
    public void onPrePersist() {
        if (user_id == null || user_id.isBlank()) {
            user_id = generateShortUserId();
        }
        if (authProvider == null) {
            authProvider = AuthProvider.LOCAL;
        }
        if (createdAt == null) {
            createdAt = LocalDateTime.now();
        }
        if (twoFactorEnabled == null) {
            twoFactorEnabled = false;
        }
    }

    private static String generateShortUserId() {
        byte[] randomBytes = new byte[9];
        ID_RANDOM.nextBytes(randomBytes);
        return "usr_" + ID_ENCODER.encodeToString(randomBytes);
    }
}

