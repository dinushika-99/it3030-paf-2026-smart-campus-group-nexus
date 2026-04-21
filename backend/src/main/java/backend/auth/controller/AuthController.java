package backend.auth.controller;

import backend.auth.model.AuthProvider;
import backend.auth.model.Role;
import backend.auth.model.User;
import backend.auth.repository.UserRepository;
import backend.auth.services.JwtAuthenticationFilter;
import backend.auth.services.JwtService;
import backend.auth.services.RefreshTokenService;
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
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.Locale;
import java.util.Map;
import java.util.Set;

record RegisterRequest(String name, String email, String password, String role, String studentId) {}
record LoginRequest(String email, String password) {}
record GoogleAuthRequest(String token, String role) {}
record ChangePasswordRequest(String currentPassword, String newPassword, String confirmPassword) {}

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final RefreshTokenService refreshTokenService;
    private JwtDecoder googleIdTokenDecoder;
    private final boolean cookieSecure;
    private final String cookieSameSite;

    private static final Set<Role> SELF_REGISTRATION_ROLES = Set.of(Role.STUDENT, Role.LECTURER);

    public AuthController(UserRepository userRepository,
                          PasswordEncoder passwordEncoder,
                          JwtService jwtService,
                          RefreshTokenService refreshTokenService,
                          @Value("${app.auth.jwt.cookie-secure:false}") boolean cookieSecure,
                          @Value("${app.auth.jwt.cookie-same-site:Lax}") String cookieSameSite) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
        this.refreshTokenService = refreshTokenService;
        this.cookieSecure = cookieSecure;
        this.cookieSameSite = cookieSameSite;
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
            "role", user.getRole().name()
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

        issueAuthCookies(user, response);

        return ResponseEntity.ok(Map.of(
            "success", true,
            "user", Map.of(
                "id", user.getId(),
                "name", user.getName(),
                "email", user.getEmail(),
                "role", user.getRole().name()
            )
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
        // TEMP: store plain-text password (hashing disabled by request)
        user.setPasswordHash(request.password());
        user.setAuthProvider(AuthProvider.LOCAL);
        user.setProviderId(null);
        user.setCreatedAt(LocalDateTime.now());
        userRepository.save(user);

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
        } else {
            if (user.getAuthProvider() == null) {
                user.setAuthProvider(AuthProvider.GOOGLE);
            }
            if (subject != null && !subject.isBlank() && (user.getProviderId() == null || user.getProviderId().isBlank())) {
                user.setProviderId(subject);
            }
            userRepository.save(user);
        }

        issueAuthCookies(user, response);

        HttpStatus responseStatus = isNewUser ? HttpStatus.CREATED : HttpStatus.OK;

        return ResponseEntity.status(responseStatus).body(Map.of(
                "success", true,
                "isNewUser", isNewUser,
                "user", Map.of(
                        "id", user.getId(),
                        "name", user.getName(),
                        "email", user.getEmail(),
                        "role", user.getRole().name()
                )
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
}


