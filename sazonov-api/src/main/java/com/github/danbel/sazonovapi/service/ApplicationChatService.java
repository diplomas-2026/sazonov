package com.github.danbel.sazonovapi.service;

import com.github.danbel.sazonovapi.domain.AdmissionApplication;
import com.github.danbel.sazonovapi.domain.AppUser;
import com.github.danbel.sazonovapi.domain.ApplicationChatMessage;
import com.github.danbel.sazonovapi.dto.ChatLastMessageResponse;
import com.github.danbel.sazonovapi.dto.ChatMessageCreateRequest;
import com.github.danbel.sazonovapi.repository.ApplicationChatMessageRepository;
import com.github.danbel.sazonovapi.repository.AppUserRepository;
import java.time.Instant;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional
public class ApplicationChatService {

    private final ApplicationService applicationService;
    private final ApplicationChatMessageRepository messageRepository;
    private final AppUserRepository userRepository;

    public List<ApplicationChatMessage> listMessages(Authentication authentication, Long applicationId) {
        ensureAccess(authentication, applicationId);
        return messageRepository.findByApplicationIdOrderByCreatedAtAsc(applicationId);
    }

    public ChatLastMessageResponse lastMessage(Authentication authentication, Long applicationId) {
        ensureAccess(authentication, applicationId);
        Instant lastMessageAt = messageRepository.findTopByApplicationIdOrderByCreatedAtDesc(applicationId)
            .map(ApplicationChatMessage::getCreatedAt)
            .orElse(null);
        return new ChatLastMessageResponse(lastMessageAt);
    }

    public ApplicationChatMessage sendMessage(Authentication authentication, Long applicationId, ChatMessageCreateRequest request) {
        AdmissionApplication application = ensureAccess(authentication, applicationId);
        AppUser sender = currentUser(authentication);

        ApplicationChatMessage message = new ApplicationChatMessage();
        message.setApplication(application);
        message.setSender(sender);
        message.setContent(request.content().trim());
        return messageRepository.save(message);
    }

    private AdmissionApplication ensureAccess(Authentication authentication, Long applicationId) {
        return applicationService.getApplication(authentication, applicationId);
    }

    private AppUser currentUser(Authentication authentication) {
        return userRepository.findByUsername(authentication.getName())
            .filter(AppUser::isActive)
            .orElseThrow(() -> new IllegalArgumentException("Пользователь не найден"));
    }
}
