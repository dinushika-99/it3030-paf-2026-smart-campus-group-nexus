package backend.security;

import backend.model.AuthProvider;
import backend.model.Role;
import backend.model.User;
import backend.repository.UserRepository;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.oauth2.client.userinfo.DefaultOAuth2UserService;
import org.springframework.security.oauth2.client.userinfo.OAuth2UserRequest;
import org.springframework.security.oauth2.core.user.DefaultOAuth2User;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.Collection;
import java.util.List;

@Service
public class CustomOAuth2UserService extends DefaultOAuth2UserService {

    private final UserRepository userRepository;

    public CustomOAuth2UserService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @Override
    public OAuth2User loadUser(OAuth2UserRequest userRequest) {
        OAuth2User oAuth2User = super.loadUser(userRequest);

        String email = oAuth2User.getAttribute("email");
        String name = oAuth2User.getAttribute("name");
        String subject = oAuth2User.getAttribute("sub");

        if (email == null) {
            throw new IllegalStateException("Email not found from Google account");
        }

        User user = userRepository.findByEmail(email)
                .orElseGet(() -> {
                    User newUser = new User();
                    newUser.setEmail(email);
                    newUser.setName(name != null ? name : email);
                    newUser.setRole(Role.STUDENT); // default role for new users
                    newUser.setAuthProvider(AuthProvider.GOOGLE);
                    newUser.setProviderId(subject);
                    newUser.setCreatedAt(LocalDateTime.now());
                    return userRepository.save(newUser);
                });

        if (user.getAuthProvider() == null) {
            user.setAuthProvider(AuthProvider.GOOGLE);
        }
        if (subject != null && !subject.isBlank() && (user.getProviderId() == null || user.getProviderId().isBlank())) {
            user.setProviderId(subject);
        }
        userRepository.save(user);

        Collection<? extends GrantedAuthority> authorities =
                List.of(new SimpleGrantedAuthority("ROLE_" + user.getRole().name()));

        // Use "sub" (subject) as the key for name attribute if available
        String nameAttributeKey = "sub";
        if (oAuth2User.getAttributes().get(nameAttributeKey) == null) {
            nameAttributeKey = "email";
        }

        return new DefaultOAuth2User(authorities, oAuth2User.getAttributes(), nameAttributeKey);
    }
}
