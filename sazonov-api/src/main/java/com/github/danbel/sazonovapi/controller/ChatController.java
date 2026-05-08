package com.github.danbel.sazonovapi.controller;

import com.github.danbel.sazonovapi.dto.ChatLastMessageResponse;
import com.github.danbel.sazonovapi.dto.ChatMessageCreateRequest;
import com.github.danbel.sazonovapi.dto.ChatMessageResponse;
import com.github.danbel.sazonovapi.service.ApiMapper;
import com.github.danbel.sazonovapi.service.ApplicationChatService;
import jakarta.validation.Valid;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequiredArgsConstructor
@RequestMapping("/chat")
public class ChatController {

    private final ApplicationChatService chatService;

    @GetMapping("/applications/{id}/messages")
    public List<ChatMessageResponse> messages(Authentication authentication, @PathVariable Long id) {
        return chatService.listMessages(authentication, id).stream()
            .map(ApiMapper::chatMessageResponse)
            .toList();
    }

    @GetMapping("/applications/{id}/messages/last")
    public ChatLastMessageResponse lastMessage(Authentication authentication, @PathVariable Long id) {
        return chatService.lastMessage(authentication, id);
    }

    @PostMapping("/applications/{id}/messages")
    public ChatMessageResponse send(Authentication authentication,
                                    @PathVariable Long id,
                                    @Valid @RequestBody ChatMessageCreateRequest request) {
        return ApiMapper.chatMessageResponse(chatService.sendMessage(authentication, id, request));
    }
}
