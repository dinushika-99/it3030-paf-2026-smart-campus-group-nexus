package backend.controller;

import backend.model.User;
import backend.repository.UserRepository;
import org.springframework.http.CacheControl;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.Locale;
import java.util.Map;
import java.util.Optional;
import java.util.concurrent.TimeUnit;
import java.util.UUID;

@RestController
@RequestMapping("/api/profile")
public class ProfileController {

    private static final long MAX_AVATAR_SIZE_BYTES = 2L * 1024L * 1024L;
    private static final String AVATAR_URL_PREFIX = "/api/profile/avatar/file/";

    private final UserRepository userRepository;
    private final Path avatarDirectory;

    public ProfileController(UserRepository userRepository) {
        this.userRepository = userRepository;
        this.avatarDirectory = Paths.get("uploads", "avatars").toAbsolutePath().normalize();
        try {
            Files.createDirectories(this.avatarDirectory);
        } catch (IOException ex) {
            throw new IllegalStateException("Could not initialize avatar storage directory", ex);
        }
    }

    private Optional<User> resolveCurrentUser(Object principal) {
        if (principal == null) return Optional.empty();

        String email = null;
        if (principal instanceof OAuth2User oAuth2User) {
            email = oAuth2User.getAttribute("email");
        } else if (principal instanceof String s) {
            email = s;
        }

        if (email == null) return Optional.empty();
        return userRepository.findByEmail(email);
    }

    @PostMapping(value = "/avatar", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<?> uploadAvatar(@RequestParam("file") MultipartFile file,
                                          @AuthenticationPrincipal Object principal) {
        User user = resolveCurrentUser(principal).orElse(null);
        if (user == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        if (file.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("error", "No file provided"));
        }

        String contentType = file.getContentType();
        if (contentType == null || !contentType.startsWith("image/")) {
            return ResponseEntity.badRequest().body(Map.of("error", "Only image uploads are allowed"));
        }

        if (file.getSize() > MAX_AVATAR_SIZE_BYTES) { // 2MB limit
            return ResponseEntity.badRequest().body(Map.of("error", "Image must be under 2MB"));
        }

        try {
            deleteAvatarFile(user.getAvatarUrl());

            String extension = resolveFileExtension(file.getOriginalFilename(), contentType);
            String storedFileName = "avatar-" + user.getId() + "-" + UUID.randomUUID() + extension;
            Path targetPath = avatarDirectory.resolve(storedFileName).normalize();

            Files.copy(file.getInputStream(), targetPath, StandardCopyOption.REPLACE_EXISTING);

            String avatarUrl = AVATAR_URL_PREFIX + storedFileName;
            user.setAvatarUrl(avatarUrl);
            userRepository.save(user);
            return ResponseEntity.ok(Map.of("message", "Avatar updated", "avatarUrl", avatarUrl));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Could not save image"));
        }
    }

    @GetMapping(value = "/avatar")
    public ResponseEntity<byte[]> getAvatar(@AuthenticationPrincipal Object principal) {
        User user = resolveCurrentUser(principal).orElse(null);
        if (user == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        Path avatarPath = resolveAvatarPath(user.getAvatarUrl());
        if (avatarPath == null || !Files.exists(avatarPath)) {
            return ResponseEntity.status(HttpStatus.NO_CONTENT).build();
        }

        try {
            byte[] avatar = Files.readAllBytes(avatarPath);
            String contentType = Files.probeContentType(avatarPath);
            if (contentType == null || !contentType.startsWith("image/")) {
                contentType = MediaType.IMAGE_PNG_VALUE;
            }

            HttpHeaders headers = new HttpHeaders();
            headers.setCacheControl(CacheControl.maxAge(1, TimeUnit.HOURS).cachePublic());
            headers.setContentType(MediaType.parseMediaType(contentType));
            return new ResponseEntity<>(avatar, headers, HttpStatus.OK);
        } catch (IOException ex) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    private Path resolveAvatarPath(String avatarUrl) {
        if (avatarUrl == null || avatarUrl.isBlank() || !avatarUrl.startsWith(AVATAR_URL_PREFIX)) {
            return null;
        }

        String fileName = avatarUrl.substring(AVATAR_URL_PREFIX.length());
        if (fileName.isBlank() || fileName.contains("..") || fileName.contains("/") || fileName.contains("\\")) {
            return null;
        }

        Path path = avatarDirectory.resolve(fileName).normalize();
        if (!path.startsWith(avatarDirectory)) {
            return null;
        }
        return path;
    }

    private void deleteAvatarFile(String avatarUrl) {
        Path previousAvatarPath = resolveAvatarPath(avatarUrl);
        if (previousAvatarPath == null) {
            return;
        }
        try {
            Files.deleteIfExists(previousAvatarPath);
        } catch (IOException ignored) {
        }
    }

    private String resolveFileExtension(String originalFilename, String contentType) {
        if (originalFilename != null) {
            int dotIndex = originalFilename.lastIndexOf('.');
            if (dotIndex >= 0 && dotIndex < originalFilename.length() - 1) {
                String ext = originalFilename.substring(dotIndex).toLowerCase(Locale.ROOT);
                if (ext.matches("\\.[a-z0-9]{1,8}")) {
                    return ext;
                }
            }
        }

        if (contentType == null) {
            return ".png";
        }
        return switch (contentType.toLowerCase(Locale.ROOT)) {
            case "image/jpeg" -> ".jpg";
            case "image/webp" -> ".webp";
            case "image/gif" -> ".gif";
            case "image/bmp" -> ".bmp";
            default -> ".png";
        };
    }
}
