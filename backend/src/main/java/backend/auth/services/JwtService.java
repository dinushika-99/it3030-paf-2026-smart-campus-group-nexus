package backend.auth.services;

import backend.auth.model.User;
import backend.config.JwtProperties;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.time.Duration;
import java.time.Instant;
import java.util.Date;
import java.util.Map;

@Service
public class JwtService {

    private final SecretKey secretKey;
    private final Duration accessTokenTtl;
    private final Duration refreshTokenTtl;
    private final Duration twoFactorTokenTtl;

    public JwtService(
            @Value("${app.auth.jwt.secret}") String jwtSecret,
            @Value("${app.auth.jwt.access-token-minutes:15}") long accessTokenMinutes,
                @Value("${app.auth.jwt.refresh-token-days:14}") long refreshTokenDays,
                @Value("${app.auth.jwt.two-factor-minutes:5}") long twoFactorMinutes
    ) {
    public JwtService(JwtProperties jwtProperties) {
        String jwtSecret = jwtProperties.getSecret();
        long accessTokenMinutes = jwtProperties.getAccessTokenMinutes();
        long refreshTokenDays = jwtProperties.getRefreshTokenDays();

        byte[] keyBytes;
        try {
            keyBytes = Decoders.BASE64.decode(jwtSecret);
        } catch (RuntimeException ex) {
            keyBytes = jwtSecret.getBytes();
        }
        this.secretKey = Keys.hmacShaKeyFor(keyBytes);
        this.accessTokenTtl = Duration.ofMinutes(accessTokenMinutes);
        this.refreshTokenTtl = Duration.ofDays(refreshTokenDays);
        this.twoFactorTokenTtl = Duration.ofMinutes(twoFactorMinutes);
    }

    public String generateAccessToken(User user) {
        return buildToken(user, "access", accessTokenTtl);
    }

    public String generateRefreshToken(User user) {
        return buildToken(user, "refresh", refreshTokenTtl);
    }

    public String generateTwoFactorToken(User user) {
        return buildToken(user, "two_factor", twoFactorTokenTtl);
    }

    private String buildToken(User user, String tokenType, Duration ttl) {
        Instant now = Instant.now();
        return Jwts.builder()
                .subject(user.getEmail())
                .issuedAt(Date.from(now))
                .expiration(Date.from(now.plus(ttl)))
                .claims(Map.of(
                        "type", tokenType,
                        "role", user.getRole().name(),
                        "uid", user.getId()
                ))
                .signWith(secretKey)
                .compact();
    }

    public Claims parseClaims(String token) {
        return Jwts.parser()
                .verifyWith(secretKey)
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }

    public String extractEmail(String token) {
        return parseClaims(token).getSubject();
    }

    public String extractTokenType(String token) {
        return parseClaims(token).get("type", String.class);
    }

    public String extractRole(String token) {
        return parseClaims(token).get("role", String.class);
    }

    public boolean isAccessToken(String token) {
        return "access".equals(extractTokenType(token));
    }

    public boolean isRefreshToken(String token) {
        return "refresh".equals(extractTokenType(token));
    }

    public boolean isTwoFactorToken(String token) {
        return "two_factor".equals(extractTokenType(token));
    }

    public Duration getAccessTokenTtl() {
        return accessTokenTtl;
    }

    public Duration getRefreshTokenTtl() {
        return refreshTokenTtl;
    }
}


