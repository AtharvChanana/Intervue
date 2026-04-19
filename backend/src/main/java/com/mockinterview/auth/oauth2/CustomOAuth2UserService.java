package com.mockinterview.auth.oauth2;

import com.mockinterview.user.model.Role;
import com.mockinterview.user.model.User;
import com.mockinterview.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.oauth2.client.userinfo.DefaultOAuth2UserService;
import org.springframework.security.oauth2.client.userinfo.OAuth2UserRequest;
import org.springframework.security.oauth2.core.OAuth2AuthenticationException;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.stereotype.Service;

import java.util.Optional;

@Service
@RequiredArgsConstructor
public class CustomOAuth2UserService extends DefaultOAuth2UserService {

    private final UserRepository userRepository;

    @Override
    public OAuth2User loadUser(OAuth2UserRequest userRequest) throws OAuth2AuthenticationException {
        OAuth2User oAuth2User = super.loadUser(userRequest);

        String registrationId = userRequest.getClientRegistration().getRegistrationId();
        String providerId = oAuth2User.getAttribute("sub"); // Google uses "sub"

        if (registrationId.equalsIgnoreCase("github")) {
            providerId = String.valueOf(oAuth2User.getAttributes().get("id")); // Github uses "id"
        }

        String email = oAuth2User.getAttribute("email");
        String name = oAuth2User.getAttribute("name");
        String profilePictureUrl = oAuth2User.getAttribute("picture"); // Google
        if (registrationId.equalsIgnoreCase("github")) {
            profilePictureUrl = oAuth2User.getAttribute("avatar_url"); // Github
            if (name == null) {
                name = oAuth2User.getAttribute("login");
            }
        }

        Optional<User> userOptional = userRepository.findByEmail(email);

        User user;
        if (userOptional.isPresent()) {
            user = userOptional.get();
            // Automatically upgrade auth provider link if they log in via OAuth but already
            // exist
            if (user.getProvider() == null || !user.getProvider().equalsIgnoreCase(registrationId)) {
                user.setProvider(registrationId);
                user.setProviderId(providerId);
                userRepository.save(user);
            }
        } else {
            user = User.builder()
                    .name(name)
                    .email(email)
                    .password(null) // Nullable because OAuth
                    .role(Role.CANDIDATE)
                    .provider(registrationId)
                    .providerId(providerId)
                    .profilePictureUrl(profilePictureUrl)
                    .build();
            userRepository.save(user);
        }

        return new CustomOAuth2User(oAuth2User, user);
    }
}
