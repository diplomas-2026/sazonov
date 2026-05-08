package com.github.danbel.sazonovapi.dto;

import java.time.Instant;

public record ChatMessageResponse(
    Long id,
    UserResponse sender,
    String content,
    Instant createdAt
) {
}
