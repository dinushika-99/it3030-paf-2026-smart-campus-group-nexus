package backend.security;

import backend.model.User;
import backend.repository.UserRepository;
import org.springframework.stereotype.Service;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.LocalDateTime;
import java.util.Base64;

@Service
public class RefreshTokenService {

    private final UserRepository userRepository;

    public RefreshTokenService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    public void saveRefreshToken(User user, String rawRefreshToken, LocalDateTime expiresAt) {
        user.setRefreshTokenHash(hash(rawRefreshToken));
        user.setRefreshTokenExpiresAt(expiresAt);
        userRepository.save(user);
    }

    public boolean isValidRefreshToken(User user, String rawRefreshToken) {
        if (user.getRefreshTokenHash() == null || user.getRefreshTokenExpiresAt() == null) {
            return false;
        }
        if (user.getRefreshTokenExpiresAt().isBefore(LocalDateTime.now())) {
            return false;
        }
        return user.getRefreshTokenHash().equals(hash(rawRefreshToken));
    }

    public void revokeRefreshToken(User user) {
        user.setRefreshTokenHash(null);
        user.setRefreshTokenExpiresAt(null);
        userRepository.save(user);
    }

    private String hash(String rawToken) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(rawToken.getBytes(StandardCharsets.UTF_8));
            return Base64.getEncoder().encodeToString(hash);
        } catch (NoSuchAlgorithmException ex) {
            throw new IllegalStateException("SHA-256 is not available", ex);
        }
    }
}
