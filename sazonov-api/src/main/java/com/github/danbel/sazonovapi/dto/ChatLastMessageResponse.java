package com.github.danbel.sazonovapi.dto;

import java.time.Instant;

public record ChatLastMessageResponse(
    Instant lastMessageAt
) {
}
