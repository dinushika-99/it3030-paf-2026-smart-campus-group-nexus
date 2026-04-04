package backend.controller;

import backend.model.AuthProvider;
import backend.model.Role;
import backend.model.User;
import backend.repository.UserRepository;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.security.oauth2.jwt.JwtDecoders;
import org.springframework.security.oauth2.jwt.JwtException;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.security.web.context.HttpSessionSecurityContextRepository;
import org.springframework.security.web.context.SecurityContextRepository;
import org.springframework.web.bind.annotation.*;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.Set;

record RegisterRequest(String name, String email, String password, String role, String studentId) {}
record LoginRequest(String email, String password) {}
record GoogleAuthRequest(String token, String role) {}

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtDecoder googleIdTokenDecoder;
    private final SecurityContextRepository securityContextRepository = new HttpSessionSecurityContextRepository();

    private static final Set<Role> SELF_REGISTRATION_ROLES = Set.of(Role.STUDENT, Role.LECTURER);

    public AuthController(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.googleIdTokenDecoder = JwtDecoders.fromIssuerLocation("https://accounts.google.com");
    }

    @GetMapping("/me")
    public Map<String, Object> me(@AuthenticationPrincipal OAuth2User principal) {
        if (principal == null) {
            return Map.of();
        }

        String email = principal.getAttribute("email");
        if (email == null) {
            return Map.of();
        }

        User user = userRepository.findByEmail(email).orElse(null);
        if (user == null) {
            return Map.of();
        }

        return Map.of(
                "id", user.getId(),
                "name", user.getName(),
                "email", user.getEmail(),
                "role", user.getRole().name()
        );
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequest request,
                                   HttpServletRequest httpRequest,
                                   HttpServletResponse httpResponse) {
        if (request.email() == null || request.password() == null) {
            return ResponseEntity.badRequest().body(Map.of("error", "Missing email or password"));
        }

        var user = userRepository.findByEmail(request.email()).orElse(null);
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

        var auth = new UsernamePasswordAuthenticationToken(
                user.getEmail(),
                null,
                List.of(new SimpleGrantedAuthority("ROLE_" + user.getRole().name()))
        );
        SecurityContext context = SecurityContextHolder.createEmptyContext();
        context.setAuthentication(auth);
        SecurityContextHolder.setContext(context);
        httpRequest.getSession(true); // ensure session is created
        securityContextRepository.saveContext(context, httpRequest, httpResponse);

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
                                        HttpServletRequest httpRequest,
                                        HttpServletResponse httpResponse) {
        if (request.token() == null || request.token().isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Missing Google token"));
        }

        Jwt jwt;
        try {
            jwt = googleIdTokenDecoder.decode(request.token());
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

        var auth = new UsernamePasswordAuthenticationToken(
                user.getEmail(),
                null,
                List.of(new SimpleGrantedAuthority("ROLE_" + user.getRole().name()))
        );
        SecurityContext context = SecurityContextHolder.createEmptyContext();
        context.setAuthentication(auth);
        SecurityContextHolder.setContext(context);
        httpRequest.getSession(true);
        securityContextRepository.saveContext(context, httpRequest, httpResponse);

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
