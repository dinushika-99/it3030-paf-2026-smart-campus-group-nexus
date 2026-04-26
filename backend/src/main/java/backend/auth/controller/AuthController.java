package backend.auth.controller;

import backend.auth.model.AuthProvider;
import backend.auth.model.Role;
import backend.auth.model.User;
import backend.auth.repository.UserRepository;
import backend.auth.services.JwtAuthenticationFilter;
import backend.auth.services.EmailService;
import backend.auth.services.JwtService;
import backend.auth.services.RefreshTokenService;
import backend.auth.services.TotpService;
import io.jsonwebtoken.JwtException;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseCookie;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.security.oauth2.jwt.JwtDecoders;
import org.springframework.web.client.RestClient;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.util.Base64;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.net.URLEncoder;

record RegisterRequest(String name, String email, String password, String role, String studentId) {}
record LoginRequest(String email, String password) {}
record GoogleAuthRequest(String token, String role) {}
record GithubAuthRequest(String code, String role) {}
record ChangePasswordRequest(String currentPassword, String newPassword, String confirmPassword) {}
record TwoFactorVerifyRequest(String twoFactorToken, String code) {}
record TwoFactorCodeRequest(String code) {}
record ForgotPasswordRequest(String email) {}
record ResetPasswordRequest(String token, String newPassword, String confirmPassword) {}

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final RefreshTokenService refreshTokenService;
    private final TotpService totpService;
    private final EmailService emailService;
    private JwtDecoder googleIdTokenDecoder;
    private final RestClient restClient;
    private final boolean cookieSecure;
    private final String cookieSameSite;
    private final String githubClientId;
    private final String githubClientSecret;
    private final String githubRedirectUri;
    private final String totpIssuer;
    private final String frontendBaseUrl;
    private final SecureRandom secureRandom = new SecureRandom();

    private static final Set<Role> SELF_REGISTRATION_ROLES = Set.of(Role.STUDENT, Role.LECTURER);

    public AuthController(UserRepository userRepository,
                          PasswordEncoder passwordEncoder,
                          JwtService jwtService,
                          RefreshTokenService refreshTokenService,
                          TotpService totpService,
                          EmailService emailService,
                          @Value("${app.auth.jwt.cookie-secure:false}") boolean cookieSecure,
                          @Value("${app.auth.jwt.cookie-same-site:Lax}") String cookieSameSite,
                          @Value("${app.auth.github.client-id:}") String githubClientId,
                          @Value("${app.auth.github.client-secret:}") String githubClientSecret,
                          @Value("${app.auth.github.redirect-uri:http://localhost:3000/auth/github/callback}") String githubRedirectUri,
                          @Value("${app.auth.totp.issuer:NEXUS}") String totpIssuer,
                          @Value("${app.frontend.base-url:http://localhost:3000}") String frontendBaseUrl) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
        this.refreshTokenService = refreshTokenService;
        this.totpService = totpService;
        this.emailService = emailService;
        this.cookieSecure = cookieSecure;
        this.cookieSameSite = cookieSameSite;
        this.githubClientId = githubClientId;
        this.githubClientSecret = githubClientSecret;
        this.githubRedirectUri = githubRedirectUri;
        this.totpIssuer = totpIssuer;
        this.frontendBaseUrl = frontendBaseUrl;
        this.restClient = RestClient.builder().build();
        this.googleIdTokenDecoder = null;
    }

    private JwtDecoder getGoogleIdTokenDecoder() {
        if (googleIdTokenDecoder == null) {
            googleIdTokenDecoder = JwtDecoders.fromIssuerLocation("https://accounts.google.com");
        }
        return googleIdTokenDecoder;
    }

    @GetMapping("/me")
    public ResponseEntity<?> me(Authentication authentication) {
        User user = resolveCurrentUser(authentication);
        if (user == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "Unauthorized"));
        }

        return ResponseEntity.ok(Map.of(
            "id", user.getId(),
            "name", user.getName(),
            "email", user.getEmail(),
            "role", user.getRole().name(),
            "twoFactorEnabled", Boolean.TRUE.equals(user.getTwoFactorEnabled())
        ));
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequest request,
                                   HttpServletResponse response) {
        if (request.email() == null || request.password() == null) {
            return ResponseEntity.badRequest().body(Map.of("error", "Missing email or password"));
        }

        var user = userRepository.findByEmail(request.email().trim().toLowerCase(Locale.ROOT)).orElse(null);
        if (user == null || user.getPasswordHash() == null) {
            if (user != null && user.getAuthProvider() == AuthProvider.GOOGLE) {
                return ResponseEntity.status(401).body(Map.of("error", "This account uses Google sign-in. Use Continue with Google."));
            }
            return ResponseEntity.status(401).body(Map.of("error", "Invalid credentials"));
        }

        // Support both legacy plain-text and BCrypt-hashed passwords during transition.
        boolean passwordMatches = request.password().equals(user.getPasswordHash())
            || passwordEncoder.matches(request.password(), user.getPasswordHash());
        if (!passwordMatches) {
            return ResponseEntity.status(401).body(Map.of("error", "Invalid credentials"));
        }

        if (requiresTwoFactor(user)) {
            return ResponseEntity.status(HttpStatus.ACCEPTED).body(buildTwoFactorChallengeResponse(user));
        }

        issueAuthCookies(user, response);

        return ResponseEntity.ok(Map.of(
            "success", true,
            "user", buildUserPayload(user)
        ));
    }

    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody RegisterRequest request) {
        if (request.email() == null || request.password() == null || request.name() == null) {
            return ResponseEntity.badRequest().body(Map.of("error", "Missing required fields"));
        }

        if (userRepository.findByEmail(request.email()).isPresent()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Email already in use"));
        }

        Role role = parseRole(request.role());
        if (!SELF_REGISTRATION_ROLES.contains(role)) {
            return ResponseEntity.status(403).body(Map.of(
                    "error",
                    "Self-registration allowed only for STUDENT or LECTURER. Contact an admin for other roles."
            ));
        }

        var user = new User();
        user.setName(request.name());
        user.setEmail(request.email());
        user.setRole(role);
        user.setStudentId(request.studentId());
        user.setPasswordHash(passwordEncoder.encode(request.password()));
        user.setAuthProvider(AuthProvider.LOCAL);
        user.setProviderId(null);
        user.setCreatedAt(LocalDateTime.now());
        userRepository.save(user);

        sendWelcomeEmailSafely(user);

        return ResponseEntity.status(201).body(Map.of("message", "Registration successful"));
    }

    @PostMapping("/google")
    public ResponseEntity<?> googleAuth(@RequestBody GoogleAuthRequest request,
                                        HttpServletResponse response) {
        if (request.token() == null || request.token().isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Missing Google token"));
        }

        Jwt jwt;
        try {
            jwt = getGoogleIdTokenDecoder().decode(request.token());
        } catch (JwtException ex) {
            return ResponseEntity.status(401).body(Map.of("error", "Invalid Google token"));
        }

        String email = jwt.getClaimAsString("email");
        String name = jwt.getClaimAsString("name");
        String subject = jwt.getClaimAsString("sub");
        Boolean emailVerified = jwt.getClaimAsBoolean("email_verified");

        if (email == null || email.isBlank()) {
            return ResponseEntity.status(401).body(Map.of("error", "Google account email is missing"));
        }
        if (Boolean.FALSE.equals(emailVerified)) {
            return ResponseEntity.status(401).body(Map.of("error", "Google account email is not verified"));
        }

        String requestedRoleRaw = request.role();
        boolean roleProvided = requestedRoleRaw != null && !requestedRoleRaw.isBlank();

        boolean isNewUser = false;
        User user = userRepository.findByEmail(email).orElse(null);
        if (user == null) {
            if (!roleProvided) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of(
                        "error", "Account not found. Please go to the Register page."
                ));
            }

            Role requestedRole = parseSelfRegistrationRole(requestedRoleRaw);
            user = new User();
            user.setEmail(email);
            user.setName(name != null && !name.isBlank() ? name : email);
            user.setRole(requestedRole);
            user.setAuthProvider(AuthProvider.GOOGLE);
            user.setProviderId(subject);
            user.setCreatedAt(LocalDateTime.now());
            user = userRepository.save(user);
            isNewUser = true;
            sendWelcomeEmailSafely(user);
        } else {
            if (user.getAuthProvider() == null) {
                user.setAuthProvider(AuthProvider.GOOGLE);
            }
            if (subject != null && !subject.isBlank() && (user.getProviderId() == null || user.getProviderId().isBlank())) {
                user.setProviderId(subject);
            }
            userRepository.save(user);
        }

        if (requiresTwoFactor(user)) {
            return ResponseEntity.status(HttpStatus.ACCEPTED).body(buildTwoFactorChallengeResponse(user));
        }

        issueAuthCookies(user, response);

        HttpStatus responseStatus = isNewUser ? HttpStatus.CREATED : HttpStatus.OK;

        return ResponseEntity.status(responseStatus).body(Map.of(
                "success", true,
                "isNewUser", isNewUser,
                "user", buildUserPayload(user)
        ));
    }

    @PostMapping("/github")
    public ResponseEntity<?> githubAuth(@RequestBody GithubAuthRequest request,
                                        HttpServletResponse response) {
        if (request.code() == null || request.code().isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Missing GitHub authorization code"));
        }

        if (githubClientId == null || githubClientId.isBlank()
                || githubClientSecret == null || githubClientSecret.isBlank()) {
            return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE)
                    .body(Map.of("error", "GitHub login is not configured on the server"));
        }

        String accessToken;
        try {
            @SuppressWarnings("unchecked")
            Map<String, Object> tokenResponse = restClient.post()
                    .uri("https://github.com/login/oauth/access_token")
                    .header(HttpHeaders.ACCEPT, "application/json")
                    .body(Map.of(
                            "client_id", githubClientId,
                            "client_secret", githubClientSecret,
                            "code", request.code(),
                            "redirect_uri", githubRedirectUri
                    ))
                    .retrieve()
                    .body(Map.class);

            accessToken = tokenResponse == null ? null : (String) tokenResponse.get("access_token");
        } catch (RuntimeException ex) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("error", "GitHub token exchange failed"));
        }

        if (accessToken == null || accessToken.isBlank()) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("error", "Invalid GitHub authorization code"));
        }

        Map<String, Object> githubUser;
        try {
            @SuppressWarnings("unchecked")
            Map<String, Object> profile = restClient.get()
                    .uri("https://api.github.com/user")
                    .header(HttpHeaders.AUTHORIZATION, "Bearer " + accessToken)
                    .header(HttpHeaders.ACCEPT, "application/vnd.github+json")
                    .retrieve()
                    .body(Map.class);
            githubUser = profile;
        } catch (RuntimeException ex) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("error", "Unable to read GitHub profile"));
        }

        if (githubUser == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("error", "Unable to read GitHub profile"));
        }

        String email = githubUser.get("email") instanceof String e ? e : null;
        if (email == null || email.isBlank()) {
            try {
                @SuppressWarnings("unchecked")
                List<Map<String, Object>> emails = restClient.get()
                        .uri("https://api.github.com/user/emails")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + accessToken)
                        .header(HttpHeaders.ACCEPT, "application/vnd.github+json")
                        .retrieve()
                        .body(List.class);

                if (emails != null) {
                    email = emails.stream()
                            .filter(item -> Boolean.TRUE.equals(item.get("verified")) && Boolean.TRUE.equals(item.get("primary")))
                            .map(item -> (String) item.get("email"))
                            .filter(itemEmail -> itemEmail != null && !itemEmail.isBlank())
                            .findFirst()
                            .orElseGet(() -> emails.stream()
                                    .filter(item -> Boolean.TRUE.equals(item.get("verified")))
                                    .map(item -> (String) item.get("email"))
                                    .filter(itemEmail -> itemEmail != null && !itemEmail.isBlank())
                                    .findFirst()
                                    .orElse(null));
                }
            } catch (RuntimeException ex) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(Map.of("error", "Unable to read GitHub account email"));
            }
        }

        if (email == null || email.isBlank()) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("error", "GitHub account email is missing or private"));
        }

        String name = githubUser.get("name") instanceof String n && !n.isBlank()
                ? n
                : (githubUser.get("login") instanceof String login && !login.isBlank() ? login : email);
        String subject = githubUser.get("id") == null ? null : String.valueOf(githubUser.get("id"));

        String requestedRoleRaw = request.role();
        boolean roleProvided = requestedRoleRaw != null && !requestedRoleRaw.isBlank();

        boolean isNewUser = false;
        User user = userRepository.findByEmail(email).orElse(null);
        if (user == null) {
            if (!roleProvided) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of(
                        "error", "Account not found. Please go to the Register page."
                ));
            }

            Role requestedRole = parseSelfRegistrationRole(requestedRoleRaw);
            user = new User();
            user.setEmail(email);
            user.setName(name);
            user.setRole(requestedRole);
            user.setAuthProvider(AuthProvider.GITHUB);
            user.setProviderId(subject);
            user.setCreatedAt(LocalDateTime.now());
            user = userRepository.save(user);
            isNewUser = true;
            sendWelcomeEmailSafely(user);
        } else {
            if (user.getAuthProvider() == null) {
                user.setAuthProvider(AuthProvider.GITHUB);
            }
            if (subject != null && !subject.isBlank() && (user.getProviderId() == null || user.getProviderId().isBlank())) {
                user.setProviderId(subject);
            }
            userRepository.save(user);
        }

        if (requiresTwoFactor(user)) {
            return ResponseEntity.status(HttpStatus.ACCEPTED).body(buildTwoFactorChallengeResponse(user));
        }

        issueAuthCookies(user, response);

        HttpStatus responseStatus = isNewUser ? HttpStatus.CREATED : HttpStatus.OK;
        return ResponseEntity.status(responseStatus).body(Map.of(
                "success", true,
                "isNewUser", isNewUser,
                "user", buildUserPayload(user)
        ));
    }

    @PostMapping("/2fa/verify")
    public ResponseEntity<?> verifyTwoFactor(@RequestBody TwoFactorVerifyRequest request,
                                             HttpServletResponse response) {
        if (request.twoFactorToken() == null || request.twoFactorToken().isBlank()
                || request.code() == null || request.code().isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Two-factor token and code are required"));
        }

        try {
            if (!jwtService.isTwoFactorToken(request.twoFactorToken())) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "Invalid two-factor session"));
            }

            String email = jwtService.extractEmail(request.twoFactorToken());
            User user = userRepository.findByEmail(email).orElse(null);
            if (user == null || !requiresTwoFactor(user)) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "Two-factor authentication is not available"));
            }

            if (!totpService.isCodeValid(user.getTotpSecret(), request.code())) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "Invalid authenticator code"));
            }

            issueAuthCookies(user, response);
            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "user", buildUserPayload(user)
            ));
        } catch (JwtException | IllegalArgumentException ex) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "Two-factor session expired. Please log in again."));
        }
    }

    @GetMapping("/2fa/status")
    public ResponseEntity<?> twoFactorStatus(Authentication authentication) {
        User user = resolveCurrentUser(authentication);
        if (user == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "Unauthorized"));
        }

        boolean configured = hasTotpConfigured(user);
        boolean enabled = Boolean.TRUE.equals(user.getTwoFactorEnabled()) && configured;
        return ResponseEntity.ok(Map.of(
                "enabled", enabled,
                "configured", configured
        ));
    }

    @PostMapping("/2fa/setup")
    public ResponseEntity<?> setupTwoFactor(Authentication authentication) {
        User user = resolveCurrentUser(authentication);
        if (user == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "Unauthorized"));
        }

        String secret = totpService.generateSecret();
        user.setTotpSecret(secret);
        user.setTwoFactorEnabled(false);
        userRepository.save(user);

        String otpAuthUri = totpService.buildOtpAuthUri(totpIssuer, user.getEmail(), secret);
        return ResponseEntity.ok(Map.of(
                "message", "Authenticator setup initialized",
                "enabled", false,
                "configured", true,
                "secret", secret,
                "otpAuthUri", otpAuthUri
        ));
    }

    @PostMapping("/2fa/enable")
    public ResponseEntity<?> enableTwoFactor(@RequestBody TwoFactorCodeRequest request,
                                             Authentication authentication) {
        User user = resolveCurrentUser(authentication);
        if (user == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "Unauthorized"));
        }

        if (!hasTotpConfigured(user)) {
            return ResponseEntity.badRequest().body(Map.of("error", "Set up authenticator first"));
        }

        if (request.code() == null || request.code().isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Authenticator code is required"));
        }

        if (!totpService.isCodeValid(user.getTotpSecret(), request.code())) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "Invalid authenticator code"));
        }

        user.setTwoFactorEnabled(true);
        userRepository.save(user);
        return ResponseEntity.ok(Map.of(
                "message", "Two-factor authentication enabled",
                "enabled", true,
                "configured", true
        ));
    }

    @PostMapping("/2fa/disable")
    public ResponseEntity<?> disableTwoFactor(@RequestBody TwoFactorCodeRequest request,
                                              Authentication authentication) {
        User user = resolveCurrentUser(authentication);
        if (user == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "Unauthorized"));
        }

        if (!requiresTwoFactor(user)) {
            user.setTwoFactorEnabled(false);
            user.setTotpSecret(null);
            userRepository.save(user);
            return ResponseEntity.ok(Map.of(
                    "message", "Two-factor authentication disabled",
                    "enabled", false,
                    "configured", false
            ));
        }

        if (request.code() == null || request.code().isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Authenticator code is required"));
        }

        if (!totpService.isCodeValid(user.getTotpSecret(), request.code())) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "Invalid authenticator code"));
        }

        user.setTwoFactorEnabled(false);
        user.setTotpSecret(null);
        userRepository.save(user);
        return ResponseEntity.ok(Map.of(
                "message", "Two-factor authentication disabled",
                "enabled", false,
                "configured", false
        ));
    }

    @PostMapping("/refresh")
    public ResponseEntity<?> refresh(HttpServletRequest request, HttpServletResponse response) {
        String refreshToken = getCookieValue(request, JwtAuthenticationFilter.REFRESH_TOKEN_COOKIE);
        if (refreshToken == null || refreshToken.isBlank()) {
            clearAuthCookies(response);
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "Missing refresh token"));
        }

        try {
            if (!jwtService.isRefreshToken(refreshToken)) {
                clearAuthCookies(response);
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "Invalid refresh token"));
            }

            String email = jwtService.extractEmail(refreshToken);
            User user = userRepository.findByEmail(email).orElse(null);
            if (user == null || !refreshTokenService.isValidRefreshToken(user, refreshToken)) {
                clearAuthCookies(response);
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "Refresh token expired or revoked"));
            }

            issueAuthCookies(user, response);
            return ResponseEntity.ok(Map.of("success", true));
        } catch (JwtException | IllegalArgumentException ex) {
            clearAuthCookies(response);
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "Invalid refresh token"));
        }
    }

    @PostMapping("/logout")
    public ResponseEntity<?> logout(HttpServletRequest request, HttpServletResponse response, Authentication authentication) {
        String refreshToken = getCookieValue(request, JwtAuthenticationFilter.REFRESH_TOKEN_COOKIE);
        if (refreshToken != null && !refreshToken.isBlank()) {
            try {
                String email = jwtService.extractEmail(refreshToken);
                userRepository.findByEmail(email).ifPresent(refreshTokenService::revokeRefreshToken);
            } catch (JwtException | IllegalArgumentException ignored) {
            }
        } else {
            User user = resolveCurrentUser(authentication);
            if (user != null) {
                refreshTokenService.revokeRefreshToken(user);
            }
        }

        clearAuthCookies(response);
        return ResponseEntity.ok(Map.of("success", true));
    }

    @PostMapping("/change-password")
    public ResponseEntity<?> changePassword(@RequestBody ChangePasswordRequest request,
                                            Authentication authentication) {
        User user = resolveCurrentUser(authentication);
        if (user == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "Unauthorized"));
        }

        if (user.getAuthProvider() == AuthProvider.GOOGLE) {
            return ResponseEntity.badRequest().body(Map.of(
                    "error",
                    "This account uses Google sign-in. Password changes are managed by Google."
            ));
        }

        if (request.currentPassword() == null || request.newPassword() == null || request.confirmPassword() == null
                || request.currentPassword().isBlank() || request.newPassword().isBlank() || request.confirmPassword().isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("error", "All password fields are required"));
        }

        if (!request.newPassword().equals(request.confirmPassword())) {
            return ResponseEntity.badRequest().body(Map.of("error", "New password and confirm password must match"));
        }

        if (request.newPassword().length() < 8) {
            return ResponseEntity.badRequest().body(Map.of("error", "New password must be at least 8 characters long"));
        }

        if (request.currentPassword().equals(request.newPassword())) {
            return ResponseEntity.badRequest().body(Map.of("error", "New password must be different from current password"));
        }

        String storedPassword = user.getPasswordHash();
        if (storedPassword == null || storedPassword.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("error", "No local password is set for this account"));
        }

        boolean currentMatches = request.currentPassword().equals(storedPassword)
                || passwordEncoder.matches(request.currentPassword(), storedPassword);
        if (!currentMatches) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "Current password is incorrect"));
        }

        user.setPasswordHash(passwordEncoder.encode(request.newPassword()));
        userRepository.save(user);
        refreshTokenService.revokeRefreshToken(user);

        return ResponseEntity.ok(Map.of("message", "Password changed successfully"));
    }

    @PostMapping("/forgot-password")
    public ResponseEntity<?> forgotPassword(@RequestBody ForgotPasswordRequest request) {
        String email = request.email() == null ? "" : request.email().trim().toLowerCase(Locale.ROOT);
        if (email.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Email is required"));
        }

        User user = userRepository.findByEmail(email).orElse(null);
        if (user != null && user.getAuthProvider() == AuthProvider.LOCAL) {
            String token = generatePasswordResetToken();
            user.setPasswordResetTokenHash(sha256Hex(token));
            user.setPasswordResetTokenExpiresAt(LocalDateTime.now().plusMinutes(30));
            userRepository.save(user);
            emailService.sendPasswordResetEmail(user.getEmail(), user.getName(), buildResetLink(token));
        }

        return ResponseEntity.ok(Map.of(
                "message", "If an account exists for that email, a password reset link has been sent."
        ));
    }

    @PostMapping("/reset-password")
    public ResponseEntity<?> resetPassword(@RequestBody ResetPasswordRequest request) {
        if (request.token() == null || request.token().isBlank()
                || request.newPassword() == null || request.newPassword().isBlank()
                || request.confirmPassword() == null || request.confirmPassword().isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Token and new password fields are required"));
        }

        if (!request.newPassword().equals(request.confirmPassword())) {
            return ResponseEntity.badRequest().body(Map.of("error", "New password and confirm password must match"));
        }

        if (request.newPassword().length() < 8) {
            return ResponseEntity.badRequest().body(Map.of("error", "New password must be at least 8 characters long"));
        }

        String tokenHash = sha256Hex(request.token().trim());
        User user = userRepository.findByPasswordResetTokenHash(tokenHash).orElse(null);
        if (user == null || user.getPasswordResetTokenExpiresAt() == null
                || user.getPasswordResetTokenExpiresAt().isBefore(LocalDateTime.now())) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "Invalid or expired reset token"));
        }

        user.setPasswordHash(passwordEncoder.encode(request.newPassword()));
        user.setPasswordResetTokenHash(null);
        user.setPasswordResetTokenExpiresAt(null);
        userRepository.save(user);
        refreshTokenService.revokeRefreshToken(user);

        return ResponseEntity.ok(Map.of("message", "Password reset successfully"));
    }

    private void issueAuthCookies(User user, HttpServletResponse response) {
        String accessToken = jwtService.generateAccessToken(user);
        String refreshToken = jwtService.generateRefreshToken(user);

        refreshTokenService.saveRefreshToken(user, refreshToken, LocalDateTime.now().plus(jwtService.getRefreshTokenTtl()));

        ResponseCookie accessCookie = ResponseCookie.from(JwtAuthenticationFilter.ACCESS_TOKEN_COOKIE, accessToken)
                .httpOnly(true)
                .secure(cookieSecure)
                .sameSite(cookieSameSite)
                .path("/")
                .maxAge(jwtService.getAccessTokenTtl())
                .build();

        ResponseCookie refreshCookie = ResponseCookie.from(JwtAuthenticationFilter.REFRESH_TOKEN_COOKIE, refreshToken)
                .httpOnly(true)
                .secure(cookieSecure)
                .sameSite(cookieSameSite)
                .path("/")
                .maxAge(jwtService.getRefreshTokenTtl())
                .build();

        response.addHeader(HttpHeaders.SET_COOKIE, accessCookie.toString());
        response.addHeader(HttpHeaders.SET_COOKIE, refreshCookie.toString());
    }

    private void clearAuthCookies(HttpServletResponse response) {
        ResponseCookie accessCookie = ResponseCookie.from(JwtAuthenticationFilter.ACCESS_TOKEN_COOKIE, "")
                .httpOnly(true)
                .secure(cookieSecure)
                .sameSite(cookieSameSite)
                .path("/")
                .maxAge(0)
                .build();
        ResponseCookie refreshCookie = ResponseCookie.from(JwtAuthenticationFilter.REFRESH_TOKEN_COOKIE, "")
                .httpOnly(true)
                .secure(cookieSecure)
                .sameSite(cookieSameSite)
                .path("/")
                .maxAge(0)
                .build();

        response.addHeader(HttpHeaders.SET_COOKIE, accessCookie.toString());
        response.addHeader(HttpHeaders.SET_COOKIE, refreshCookie.toString());
    }

    private String getCookieValue(HttpServletRequest request, String cookieName) {
        Cookie[] cookies = request.getCookies();
        if (cookies == null) {
            return null;
        }
        for (Cookie cookie : cookies) {
            if (cookieName.equals(cookie.getName())) {
                return cookie.getValue();
            }
        }
        return null;
    }

    private User resolveCurrentUser(Authentication authentication) {
        if (authentication == null || !authentication.isAuthenticated()) {
            return null;
        }
        Object principal = authentication.getPrincipal();
        if (principal instanceof String email && !email.isBlank() && !"anonymousUser".equals(email)) {
            return userRepository.findByEmail(email).orElse(null);
        }
        return null;
    }

    private boolean hasTotpConfigured(User user) {
        return user != null && user.getTotpSecret() != null && !user.getTotpSecret().isBlank();
    }

    private boolean requiresTwoFactor(User user) {
        return user != null && Boolean.TRUE.equals(user.getTwoFactorEnabled()) && hasTotpConfigured(user);
    }

    private Map<String, Object> buildTwoFactorChallengeResponse(User user) {
        return Map.of(
                "requiresTwoFactor", true,
                "twoFactorToken", jwtService.generateTwoFactorToken(user),
                "message", "Authenticator code required"
        );
    }

    private Map<String, Object> buildUserPayload(User user) {
        return Map.of(
                "id", user.getId(),
                "name", user.getName(),
                "email", user.getEmail(),
                "role", user.getRole().name(),
                "twoFactorEnabled", Boolean.TRUE.equals(user.getTwoFactorEnabled())
        );
    }

    private Role parseRole(String role) {
        if (role == null) return Role.STUDENT;
        return switch (role.toLowerCase()) {
            case "admin" -> Role.ADMIN;
            case "staff", "lecturer" -> Role.LECTURER;
            case "technician" -> Role.TECHNICIAN;
            case "manager" -> Role.MANAGER;
            default -> Role.STUDENT;
        };
    }

    private Role parseSelfRegistrationRole(String role) {
        if (role == null) {
            return Role.STUDENT;
        }
        return switch (role.toLowerCase()) {
            case "lecturer", "staff" -> Role.LECTURER;
            default -> Role.STUDENT;
        };
    }

    private String generatePasswordResetToken() {
        byte[] bytes = new byte[32];
        secureRandom.nextBytes(bytes);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
    }

    private String buildResetLink(String token) {
        String encodedToken = URLEncoder.encode(token, StandardCharsets.UTF_8);
        return frontendBaseUrl.replaceAll("/+$", "") + "/reset-password?token=" + encodedToken;
    }

    private String sha256Hex(String value) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(value.getBytes(StandardCharsets.UTF_8));
            StringBuilder sb = new StringBuilder(hash.length * 2);
            for (byte b : hash) {
                sb.append(String.format("%02x", b));
            }
            return sb.toString();
        } catch (NoSuchAlgorithmException ex) {
            throw new IllegalStateException("SHA-256 not available", ex);
        }
    }

    private void sendWelcomeEmailSafely(User user) {
        try {
            emailService.sendWelcomeEmail(user.getEmail(), user.getName());
        } catch (RuntimeException ignored) {
        }
    }
}


